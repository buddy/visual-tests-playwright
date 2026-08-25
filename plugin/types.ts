import type { Cookie } from "@playwright/test";

/**
 * Interface representing viewport dimensions
 */
interface Viewport {
  /**
   * The width of the viewport
   */
  width: number;

  /**
   * The height of the viewport
   */
  height: number;
}

/**
 * Interface representing a device configuration
 */
interface Device {
  /**
   * The viewport settings
   */
  viewport: Viewport;

  /**
   * The screen settings
   */
  screen?: Viewport;

  /**
   * The device pixel ratio
   */
  devicePixelRatio?: number;

  /**
   * Whether the device is mobile
   */
  isMobile?: boolean;
}

/**
 * Interface for snapshot options
 */
interface SnapshotOptions {
  /**
   * Array of custom device configurations
   */
  devices?: Device[];

  /**
   * Whether to screenshot the full page
   */
  fullPage?: boolean;

  /**
   * The color scheme variants used when creating screenshots
   */
  colorScheme?: "LIGHT" | "DARK" | "LIGHT_AND_DARK";

  /**
   * Whether to enable JavaScript when creating screenshots
   */
  enableJavaScript?: boolean;

  /**
   * Custom CSS styles to inject when creating screenshots
   */
  injectStyles?: string;

  /**
   * Timeout for resource discovery
   */
  resourceDiscoveryTimeout?: number;

  /**
   * Whether to clone cookies
   */
  cloneCookies?: boolean;

  /**
   * CSS selectors to ignore when creating screenshots
   */
  cssIgnores?: string[];

  /**
   * XPath expressions to ignore when creating screenshots
   */
  xpathIgnores?: string[];
}

/**
 * Interface representing a snapshot
 */
interface Snapshot {
  /**
   * The name of the snapshot
   */
  name: string;

  /**
   * The URL of the page
   */
  url: string;

  /**
   * The title of the page
   */
  title: string;

  /**
   * The HTML content
   */
  html: string;

  /**
   * The page resources
   */
  resources: Record<string, unknown>[];

  /**
   * Array of device configurations
   */
  devices?: Device[];

  /**
   * The color scheme used
   */
  colorScheme?: "LIGHT" | "DARK" | "LIGHT_AND_DARK";

  /**
   * Resource discovery timeout used
   */
  resourceDiscoveryTimeout?: number;

  /**
   * Whether full page was captured
   */
  fullPage?: boolean;

  /**
   * Whether JavaScript was enabled
   */
  enableJavaScript?: boolean;

  /**
   * Custom CSS styles injected
   */
  injectStyles?: string;

  /**
   * Cloned cookies
   */
  cookies: Cookie[];

  /**
   * CSS selectors ignored
   */
  cssIgnores?: string[];

  /**
   * XPath expressions ignored
   */
  xpathIgnores?: string[];

  /**
   * The snapshot version
   */
  version: number;
}

/**
 * Interface for the VisualTestsPlugin constructor
 */
interface VisualTestsPluginOptions {
  suppressErrors?: boolean;
}

export { Snapshot, SnapshotOptions, Device, Viewport, VisualTestsPluginOptions };
