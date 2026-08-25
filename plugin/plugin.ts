import type { Cookie, Fixtures, Page, TestType } from "@playwright/test";
import type { Snapshot, SnapshotOptions, VisualTestsPluginOptions } from "./types";

interface WindowSnapshot {
  SNAPSHOT: {
    parseDom: (
      document: Document,
      jsEnabled?: boolean,
    ) => {
      title: string;
      html: string;
      resources: { url: string; type: string }[];
    };
  };
}

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
    if (this.parseDomScript) {
      return;
    }

    try {
      const response = await fetch("http://localhost:1337/parseDom.js");
      if (!response.ok) {
        throw new Error(`Failed to fetch parseDom.js: ${response.status}`);
      }
      this.parseDomScript = await response.text();
    } catch (error) {
      if (!this.suppressErrors) {
        throw new Error(`Failed to fetch parseDom.js: ${String(error)}`, { cause: error });
      }
    }
  }

  /**
   * Injects the parseDom script into the page unless it is already present
   * @private
   * @param {Page} page - The Playwright page object
   * @returns {Promise<void>}
   */
  private async injectParseDom(page: Page): Promise<void> {
    const isScriptInjected = await page.evaluate(
      () => (globalThis as unknown as WindowSnapshot).SNAPSHOT !== undefined,
    );
    if (!isScriptInjected) {
      await page.evaluate(this.parseDomScript!);
    }
  }

  /**
   * Reads the page cookies when cloning is requested
   * @private
   * @param {Page} page - The Playwright page object
   * @param {boolean} [cloneCookies] - Whether cookies should be cloned
   * @returns {Promise<Cookie[]>} The page cookies, or an empty array
   */
  private collectCookies(page: Page, cloneCookies?: boolean): Promise<Cookie[]> {
    if (cloneCookies) {
      return page.context().cookies();
    }
    return Promise.resolve([]);
  }

  /**
   * Builds the snapshot payload from the current page state
   * @private
   * @param {Page} page - The Playwright page object
   * @param {string} name - The name of the snapshot
   * @param {SnapshotOptions} options - The snapshot options
   * @returns {Promise<Snapshot>} The snapshot data
   */
  private async buildSnapshot(
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
    }: SnapshotOptions,
  ): Promise<Snapshot> {
    const { html, resources } = await page.evaluate(
      (jsEnabled) =>
        (globalThis as unknown as WindowSnapshot).SNAPSHOT.parseDom(document, jsEnabled),
      enableJavaScript,
    );

    return {
      colorScheme,
      cookies: await this.collectCookies(page, cloneCookies),
      cssIgnores,
      devices,
      enableJavaScript,
      fullPage,
      html,
      injectStyles,
      name,
      resourceDiscoveryTimeout,
      resources,
      title: await page.title(),
      url: page.url(),
      version: 1,
      xpathIgnores,
    };
  }

  /**
   * Sends the snapshot to the server
   * @private
   * @param {Snapshot} snapshot - The snapshot data
   * @returns {Promise<void>}
   * @throws {Error} When the server responds with a non-OK status
   */
  private async sendSnapshot(snapshot: Snapshot): Promise<void> {
    const response = await fetch("http://localhost:1337/snapshot", {
      body: JSON.stringify(snapshot),
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      mode: "cors",
      redirect: "follow",
      referrerPolicy: "no-referrer",
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
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
    options: SnapshotOptions = {},
  ): Promise<Snapshot | void> {
    if (!name || typeof name !== "string") {
      throw new Error("Snapshot name is required and must be a string");
    }

    await this.fetchParseDom();

    if (!this.parseDomScript && this.suppressErrors) {
      return;
    }

    await this.injectParseDom(page);

    const snapshot = await this.buildSnapshot(page, name, options);
    await this.sendSnapshot(snapshot);

    return snapshot;
  }
}

/**
 * Creates a fixture for the VisualTestsPlugin
 * @param {TestType<TestArgs, WorkerArgs>} base - The base test type
 * @param {VisualTestsPluginOptions} [pluginOptions={}] - The plugin options
 * @returns {TestType<TestArgs & { visualTestPlugin: VisualTestsPlugin }, WorkerArgs>} The extended test type
 */
export const withVisualTestPluginFixture = function withVisualTestPluginFixture<
  TestArguments extends object,
  WorkerArguments extends object,
>(base: TestType<TestArguments, WorkerArguments>, pluginOptions: VisualTestsPluginOptions = {}) {
  return base.extend<{
    visualTestPlugin: VisualTestsPlugin;
  }>({
    // oxlint-disable-next-line no-empty-pattern
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
};
