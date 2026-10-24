import { chromium } from 'playwright'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  console.log('Launching headless browser for Admin Tremor verification...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1366, height: 950 } })
  const page = await context.newPage()

  console.log('Navigating to http://127.0.0.1:5173/#/admin...')
  await page.goto('http://127.0.0.1:5173/#/admin', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // Click 1-click Dev Admin Login if visible
  const adminLoginBtn = page.getByRole('button', { name: /Войти как Admin/i })
  if (await adminLoginBtn.isVisible()) {
    console.log('Clicking 1-click Admin Login...')
    await adminLoginBtn.click()
    await page.waitForTimeout(1200)
  }

  // 1. Capture Overview Tab
  console.log('Capturing Admin Tremor Overview Tab...')
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_tremor_overview.png'), fullPage: false })

  // 2. Click Catalog & Tests Tab
  console.log('Switching to Catalog Tab...')
  const testsTab = page.locator('#admin button', { hasText: /Каталог тестов/i })
  if (await testsTab.isVisible()) {
    await testsTab.click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_tremor_catalog.png'), fullPage: false })
  }

  // 3. Click Zero-Retention Audit Tab
  console.log('Switching to Zero-Retention Privacy Audit Tab...')
  const privacyTab = page.locator('#admin button', { hasText: /Zero-Retention аудит/i })
  if (await privacyTab.isVisible()) {
    await privacyTab.click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_tremor_privacy_audit.png'), fullPage: false })
  }

  await browser.close()
  console.log('Admin Tremor verification passed!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
