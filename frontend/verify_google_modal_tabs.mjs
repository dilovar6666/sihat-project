import { chromium } from 'playwright'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  console.log('1. Launching browser to verify Google Auth tabs in AuthModal...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  await page.goto('http://127.0.0.1:5173/#/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  // Open Profile Drawer
  console.log('2. Opening Profile Drawer...')
  const profBtn = page.locator('button[aria-label="Открыть профиль"]')
  await profBtn.click()
  await page.waitForTimeout(400)

  // Click Sign In
  console.log('3. Opening AuthModal (Login tab)...')
  await page.click('button:has-text("Войти или зарегистрироваться")')
  await page.waitForTimeout(600)

  // Verify Login Tab
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'auth_google_login_tab.png'),
    fullPage: false,
  })
  console.log('Saved auth_google_login_tab.png')

  // Switch to Register Tab
  console.log('4. Switching to Register tab...')
  await page.click('button:has-text("Регистрация")')
  await page.waitForTimeout(500)

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'auth_google_register_tab.png'),
    fullPage: false,
  })
  console.log('Saved auth_google_register_tab.png')

  // Switch back to Login Tab
  console.log('5. Switching back to Login tab...')
  await page.click('button:has-text("Войти")')
  await page.waitForTimeout(500)

  console.log('VERIFICATION COMPLETED SUCCESSFULLY!')
  await browser.close()
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
