const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const out = path.resolve("apps/web/scripts/creature-sheet-proof.png");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto("http://localhost:3000/dev/creature-sheet", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector(".gx-shrine", { timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: out, fullPage: true });
  console.log(out);
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
