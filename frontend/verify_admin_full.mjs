import { chromium } from 'playwright'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1366, height: 1100 } })
  const page = await context.newPage()

  await page.goto('http://127.0.0.1:5173/#/admin', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  // Dev login
  const adminLoginBtn = page.getByRole('button', { name: /Войти как Admin/i })
  if (await adminLoginBtn.isVisible()) {
    await adminLoginBtn.click()
    await page.waitForTimeout(1000)
  }

  // Full page view
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_tremor_full.png'), fullPage: true })

  // Switch to Dark mode
  await page.evaluate(() => {
    document.documentElement.classList.add('dark')
    localStorage.setItem('sihat_theme', 'dark')
  })
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_tremor_dark.png'), fullPage: true })

  await browser.close()
  console.log('Full & Dark mode captures completed!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
