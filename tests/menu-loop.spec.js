const { test } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');

const BASE_URL = process.env.BASE_URL || 'https://percy-demo-for-report-utility.vercel.app/home';
const LOOPS = Number(process.env.LOOPS || 20);
// Build 1: DESIGN_VERSION=A (default). Build 2: DESIGN_VERSION=B (clicks "Toggle Design Version (A)").
const DESIGN_VERSION = (process.env.DESIGN_VERSION || 'A').toUpperCase();

const MENU = ['Home', 'About', 'Products', 'Contact', 'Sitemap'];

test('menu loop: 6 options x 20 loops = 120 snapshots', async ({ page }) => {
  test.setTimeout(30 * 60 * 1000);
  await page.goto(BASE_URL);

  const toggle = page.getByRole('button', { name: /Toggle Design Version/ });
  await toggle.waitFor();

  // Switch to design B for the comparison build.
  if (DESIGN_VERSION === 'B') {
    await toggle.click();
    await page.getByRole('button', { name: 'Toggle Design Version (B)' }).waitFor();
  }

  for (let i = 1; i <= LOOPS; i++) {
    const n = String(i).padStart(2, '0');

    for (const item of MENU) {
      await page.getByRole('button', { name: item, exact: true }).click();
      await page.waitForLoadState('networkidle');
      await percySnapshot(page, `Loop ${n} - ${item}`);
    }

    // 6th option: the Toggle Design Version button, snapshotted after being clicked
    // and toggled back so every loop starts from the same design version.
    await toggle.click();
    await page.waitForLoadState('networkidle');
    await percySnapshot(page, `Loop ${n} - Toggle Design`);
    await toggle.click();
  }
});
