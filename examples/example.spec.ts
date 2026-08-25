import { test as base } from "@playwright/test";
import withVisualTestPluginFixture from "@buddy-works/visual-tests-playwright";

const test = withVisualTestPluginFixture(base);

test("Homepage", async ({ page, visualTestPlugin }) => {
  await page.goto("https://buddy.works/");
  await visualTestPlugin.takeSnap(page, "buddy-blog");
});
