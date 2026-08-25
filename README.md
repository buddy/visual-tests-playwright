# Visual Test Playwright Plugin

A Playwright plugin for performing visual testing using Buddy Works Visual Testing. This plugin allows automatic capturing of website snapshots across different screen resolutions and comparing them with reference versions to detect visual regressions.

## Requirements

- **Node.js** `>=20`
- **[bdy CLI](https://www.npmjs.com/package/bdy)** — tests must be run through the CLI within a visual testing session, e.g. `bdy tests visual session create "playwright test"`

## Installation

```bash
npm install @buddy-works/visual-tests-playwright
```

## Usage

### ESM (`import`)

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

### CommonJS (`require`)

```javascript
const { test: base } = require("@playwright/test");
const { default: withVisualTestPluginFixture } = require("@buddy-works/visual-tests-playwright");

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
