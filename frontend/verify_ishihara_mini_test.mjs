import { chromium } from 'playwright'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  console.log('1. Launching browser to verify Ishihara Color Blindness Mini-Screening...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  await page.addInitScript(() => {
    localStorage.setItem('sihat_theme', 'dark')
  })

  console.log('2. Navigating to http://127.0.0.1:5173/#/ ...')
  await page.goto('http://127.0.0.1:5173/#/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  // Scroll to center the Ishihara widget
  await page.evaluate(() => {
    window.scrollBy(0, 560)
  })
  await page.waitForTimeout(500)

  // 3. Checking Plate #1 (Ishihara 12)...
  const canvasLocator = page.locator('canvas[aria-label^="Таблица Ишихары"]')
  await canvasLocator.waitFor({ state: 'visible' })

  // Screenshot of Plate #1
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'hero_ishihara_plate1.png'),
    fullPage: false,
  })
  console.log('Saved hero_ishihara_plate1.png')

  // 4. Click option "12"
  console.log('4. Clicking option "12" on Plate #1...')
  await page.click('button:has-text("12")')
  await page.waitForTimeout(600)

  // Screenshot of Plate #2
  console.log('5. Checking Plate #2 (Ishihara 8)...')
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'hero_ishihara_plate2.png'),
    fullPage: false,
  })
  console.log('Saved hero_ishihara_plate2.png')

  // 5. Click option "8"
  console.log('6. Clicking option "8" on Plate #2...')
  await page.click('button:has-text("8")')
  await page.waitForTimeout(600)

  // Screenshot of Plate #3
  console.log('7. Checking Plate #3 (Ishihara 29)...')
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'hero_ishihara_plate3.png'),
    fullPage: false,
  })
  console.log('Saved hero_ishihara_plate3.png')

  // 6. Click option "29"
  console.log('8. Clicking option "29" on Plate #3 to finish mini-test...')
  await page.click('button:has-text("29")')
  await page.waitForTimeout(600)

  // 7. Verify Gated Result State (Locked result teaser)
  console.log('9. Verifying Gated Result State...')
  const lockIcon = page.locator('text=Экспресс-тест завершён')
  await lockIcon.waitFor({ state: 'visible' })

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'hero_ishihara_gated_result.png'),
    fullPage: false,
  })
  console.log('Saved hero_ishihara_gated_result.png')

  // 8. Click "Посмотреть результат и запустить полный скрининг"
  console.log('10. Clicking "Посмотреть результат и запустить полный скрининг"...')
  const fullBtn = page.locator('button:has-text("Посмотреть результат и запустить полный скрининг")')
  await fullBtn.click()
  await page.waitForTimeout(1000)

  console.log('Current URL Hash after click:', await page.evaluate(() => window.location.hash))

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'hero_ishihara_full_test_opened.png'),
    fullPage: false,
  })
  console.log('Saved hero_ishihara_full_test_opened.png')

  console.log('ALL ISHIHARA MINI-SCREENING CHECKS PASSED!')
  await browser.close()
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
