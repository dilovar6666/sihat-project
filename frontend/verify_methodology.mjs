import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\Dio\\.gemini\\antigravity\\brain\\9af53273-2c36-40ca-8721-a9ffcdd9aa8b';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  console.log('Navigating to Methodology page...');
  await page.goto('http://127.0.0.1:5173/#/passport/attention-concentration', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check Dark Mode Screenshot
  console.log('Capturing dark mode screenshot...');
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'methodology_page_dark.png'),
    fullPage: true,
  });

  // Switch to Light Mode
  console.log('Switching to light mode...');
  const themeBtn = page.locator('button[aria-label="Переключить тему оформления"]');
  if (await themeBtn.isVisible()) {
    await themeBtn.click();
    await page.waitForTimeout(600);
    console.log('Capturing light mode screenshot...');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'methodology_page_light.png'),
      fullPage: true,
    });
    // Toggle back to dark
    await themeBtn.click();
    await page.waitForTimeout(600);
  }

  // Test Test Switcher: Click another test button
  console.log('Testing interactive test switcher...');
  const switcherButtons = page.locator('div.overflow-x-auto button');
  const count = await switcherButtons.count();
  console.log(`Found ${count} test switcher pills`);

  if (count > 2) {
    const secondPill = switcherButtons.nth(1);
    const pillText = await secondPill.innerText();
    console.log(`Clicking pill: ${pillText}`);
    await secondPill.click();
    await page.waitForTimeout(700);

    const currentUrl = page.url();
    console.log(`Current URL after clicking: ${currentUrl}`);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'methodology_switcher_active.png'),
      fullPage: false,
    });
  }

  // Test Catalog Navigation: Click Back to Catalog
  console.log('Testing Back to Catalog navigation...');
  const backBtn = page.getByText('Назад в каталог скринингов').first();
  if (await backBtn.isVisible()) {
    await backBtn.click();
    await page.waitForTimeout(800);
    console.log(`URL after clicking Back to Catalog: ${page.url()}`);
    
    // In Catalog, click 'Паспорт методики' on a card
    const passportCardBtn = page.locator('button:has-text("Паспорт методики")').first();
    if (await passportCardBtn.isVisible()) {
      console.log('Clicking "Паспорт методики" on catalog card...');
      await passportCardBtn.click();
      await page.waitForTimeout(800);
      console.log(`URL after catalog card click: ${page.url()}`);
      
      // Verify no modal with class or backdrop is covering
      const modalBackdrop = page.locator('[role="dialog"]');
      const modalCount = await modalBackdrop.count();
      console.log(`Modal dialog count on screen: ${modalCount}`);

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, 'methodology_from_catalog.png'),
        fullPage: false,
      });
    }
  }

  await browser.close();
  console.log('Playwright verification finished successfully!');
}

run().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
