# Visual Test Playwright Plugin

A Playwright plugin for performing visual testing using Buddy Works Visual Testing. This plugin allows automatic capturing of website snapshots across different screen resolutions and comparing them with reference versions to detect visual regressions.

## Installation

```bash
npm install @buddy-works/visual-tests-playwright
```

## Usage

```typescript
import { test as base } from "@playwright/test";
import withVisualTestPluginFixture from "@buddy-works/visual-tests-playwright";

const test = withVisualTestPluginFixture(base);

test("homepage visual test", async ({ page, visualTestPlugin }) => {
  await page.goto("https://example.com");

  await visualTestPlugin.takeSnap(page, "homepage", {
    devices: [{ viewport: { width: 1366, height: 768 } }],
    colorScheme: "DARK",
    cloneCookies: true,
  });
});
```

## Examples

Example usage of the plugin can be found in the `examples/` directory:

```bash
# Install dependencies
pnpm i
# Build plugin
pnpm run build
# Create link for plugin
pnpm link
# Go to examples folder
cd examples
# Link plugin
pnpm link @buddy-works/playwright
# Install examples dependencies
pnpm i
# Add enviroment variables with token
export BUDDY_VT_TOKEN=****
# Run an example
pnpm run test
```

## License

MIT
