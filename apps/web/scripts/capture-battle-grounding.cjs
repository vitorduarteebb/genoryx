const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const out = path.resolve("apps/web/scripts/grounding-proof.png");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto("http://localhost:3000/dev/battle-grounding", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll('[data-visual-status="ready"]').length >= 6, null, { timeout: 45000 });
  await page.waitForTimeout(1200);
  await page.locator(".gx-arena").screenshot({ path: out });
  console.log(out);
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
