import { Snapshot, SnapshotOptions, VisualTestsPluginOptions } from "./types";
import { Cookie, Fixtures, Page, TestType } from "@playwright/test";

type WindowSnapshot = {
  SNAPSHOT: {
    parseDom: (
      document: Document,
      jsEnabled?: boolean,
    ) => {
      title: string;
      html: string;
      resources: Array<{ url: string; type: string }>;
    };
  };
};

/**
 * Plugin for capturing snapshots of web pages for visual testing.
 */
export class VisualTestsPlugin {
  private suppressErrors: boolean;
  private parseDomScript?: string;

  /**
   * Creates a new instance of VisualTestsPlugin
   * @param {VisualTestsPluginOptions} [options={}] - The plugin options
   */
  constructor(options: VisualTestsPluginOptions = {}) {
    this.suppressErrors = options.suppressErrors ?? true;
  }

  /**
   * Fetches and caches the parseDom script
   * @private
   * @returns {Promise<void>}
   */
  private async fetchParseDom(): Promise<void> {
    if (this.parseDomScript) return;

    try {
      const response = await fetch("http://localhost:1337/parseDom.js");
      if (!response.ok) {
        throw new Error(`Failed to fetch parseDom.js: ${response.status}`);
      }
      this.parseDomScript = await response.text();
    } catch (error) {
      if (!this.suppressErrors) {
        const error_ =
          error instanceof Error
            ? new Error(`Failed to fetch parseDom.js: ${error.message}`)
            : new Error(`Failed to fetch parseDom.js: ${String(error)}`);
        throw error_;
      }
    }
  }

  /**
   * Takes a snapshot of the current page
   * @param {Page} page - The Playwright page object
   * @param {string} name - The name of the snapshot
   * @param {SnapshotOptions} [options={}] - The snapshot options
   * @returns {Promise<Snapshot|void>} The snapshot data or void if suppressed error occurred
   * @throws {Error} When name is not provided or is not a string
   * @throws {Error} When parseDom.js fails to load and suppressErrors is false
   * @throws {Error} When snapshot fails to be sent to server
   */
  async takeSnap(
    page: Page,
    name: string,
    {
      devices,
      fullPage,
      colorScheme,
      enableJavaScript,
      injectStyles,
      resourceDiscoveryTimeout,
      cloneCookies,
      cssIgnores,
      xpathIgnores,
    }: SnapshotOptions = {},
  ): Promise<Snapshot | void> {
    if (!name || typeof name !== "string") {
      throw new Error("Snapshot name is required and must be a string");
    }

    await this.fetchParseDom();

    if (!this.parseDomScript && this.suppressErrors) {
      return;
    }

    const isScriptInjected = await page.evaluate(() => {
      return (window as unknown as WindowSnapshot).SNAPSHOT !== undefined;
    });

    if (!isScriptInjected) {
      await page.evaluate(this.parseDomScript!);
    }

    const url = page.url();
    const title = await page.title();

    let cookies: Cookie[] = [];
    if (cloneCookies) {
      cookies = await page.context().cookies();
    }

    const result = await page.evaluate((enableJavaScript) => {
      return (window as unknown as WindowSnapshot).SNAPSHOT.parseDom(
        document,
        enableJavaScript,
      );
    }, enableJavaScript);
    const { html, resources } = result;

    const snapshot: Snapshot = {
      name,
      url,
      title,
      html,
      resources,
      devices,
      colorScheme,
      resourceDiscoveryTimeout,
      fullPage,
      enableJavaScript,
      injectStyles,
      cookies: cloneCookies ? cookies : [],
      cssIgnores,
      xpathIgnores,
      version: 1,
    };

    const response = await fetch("http://localhost:1337/snapshot", {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify(snapshot),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    return snapshot;
  }
}

/**
 * Creates a fixture for the VisualTestsPlugin
 * @param {TestType<TestArgs, WorkerArgs>} base - The base test type
 * @param {VisualTestsPluginOptions} [pluginOptions={}] - The plugin options
 * @returns {TestType<TestArgs & { visualTestPlugin: VisualTestsPlugin }, WorkerArgs>} The extended test type
 */
export function withVisualTestPluginFixture<
  TestArguments extends object,
  WorkerArguments extends object,
>(
  base: TestType<TestArguments, WorkerArguments>,
  pluginOptions: VisualTestsPluginOptions = {},
) {
  return base.extend<{
    visualTestPlugin: VisualTestsPlugin;
  }>({
    // eslint-disable-next-line no-empty-pattern
    visualTestPlugin: async ({}, use: (plugin: unknown) => Promise<void>) => {
      const visualTestPlugin = new VisualTestsPlugin(pluginOptions);
      await use(visualTestPlugin);
    },
  } as Fixtures<
    {
      visualTestPlugin: VisualTestsPlugin;
    },
    object,
    TestArguments,
    WorkerArguments
  >);
}
