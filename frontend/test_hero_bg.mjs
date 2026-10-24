import { chromium } from 'playwright'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  console.log('Navigating to http://127.0.0.1:5173...')
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })

  // Ensure hero image is present and loaded
  await page.waitForSelector('img[src="/hero-bg.jpg"]')
  await page.waitForTimeout(1000)

  // 1. Dark mode full viewport & hero capture
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'hero_background_final_dark.png'),
  })
  console.log('Captured hero_background_final_dark.png')

  // 2. Switch to Light mode
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('sihat_theme', 'light')
  })
  await page.waitForTimeout(600)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'hero_background_final_light.png'),
  })
  console.log('Captured hero_background_final_light.png')

  // 3. Mobile viewport capture in dark mode
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => {
    document.documentElement.classList.add('dark')
    localStorage.setItem('sihat_theme', 'dark')
  })
  await page.waitForTimeout(600)
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'hero_background_final_mobile.png'),
  })
  console.log('Captured hero_background_final_mobile.png')

  await browser.close()
  console.log('Final verification completed successfully.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
