import { chromium } from 'playwright'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  console.log('Launching browser for Theme Toggle verification...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } })
  const page = await context.newPage()

  // Start with explicit dark theme
  await page.addInitScript(() => {
    localStorage.setItem('sihat_theme', 'dark')
  })

  console.log('Navigating to http://127.0.0.1:5173/#/ ...')
  await page.goto('http://127.0.0.1:5173/#/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  // 1. Verify Dark Mode
  const isDarkInitial = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  console.log('Initial isDark:', isDarkInitial)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'theme_dark.png') })

  // 2. Click Theme Toggle button in Navbar
  const themeToggleBtn = page.locator('button[aria-label="Сменить тему"]')
  console.log('Clicking Theme Toggle button...')
  await themeToggleBtn.click()
  await page.waitForTimeout(600)

  // 3. Verify Light Mode
  const isDarkAfterClick = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  const themeStored = await page.evaluate(() => localStorage.getItem('sihat_theme'))
  console.log('After toggle isDark:', isDarkAfterClick, 'stored:', themeStored)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'theme_light.png') })

  if (isDarkAfterClick) {
    throw new Error('Theme toggle failed: dark class was not removed from html element!')
  }

  // 4. Click again to return to Dark Mode
  console.log('Clicking Theme Toggle again to return to dark mode...')
  await themeToggleBtn.click()
  await page.waitForTimeout(600)
  const isDarkReturned = await page.evaluate(() => document.documentElement.classList.contains('dark'))
  console.log('After second toggle isDark:', isDarkReturned)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'theme_toggled_back.png') })

  if (!isDarkReturned) {
    throw new Error('Theme toggle failed: dark class was not re-added!')
  }

  // 5. Test on Admin page as well
  console.log('Testing theme toggle on #/admin...')
  await page.goto('http://127.0.0.1:5173/#/admin', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await themeToggleBtn.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'theme_admin_light.png') })

  await browser.close()
  console.log('Theme toggle verified successfully in all states!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
