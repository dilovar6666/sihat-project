import { chromium } from '@playwright/test'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  console.log('Starting Liquid Glass Visual Verification...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  })
  const page = await context.newPage()

  try {
    // 1. Home Page Hero & Liquid Glass Elements
    console.log('1. Visiting Home Page...')
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'liquid_glass_hero.png') })
    console.log('Saved liquid_glass_hero.png')

    // 2. Open Compact AI Widget with Liquid Glass
    console.log('2. Opening Compact AI Widget...')
    const floatingBtn = page.getByRole('button', { name: /ИИ-помощник|AI Guide|Ёвари AI/i })
    await floatingBtn.click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'liquid_glass_widget.png') })
    console.log('Saved liquid_glass_widget.png')

    // Close widget
    await floatingBtn.click()
    await page.waitForTimeout(300)

    // 3. Catalog Page Liquid Glass
    console.log('3. Visiting Catalog...')
    await page.goto('http://127.0.0.1:5173/#/catalog', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'liquid_glass_catalog.png') })
    console.log('Saved liquid_glass_catalog.png')

    // 4. Dedicated AI Page Liquid Glass
    console.log('4. Visiting Dedicated AI Page (#/assistant)...')
    await page.goto('http://127.0.0.1:5173/#/assistant', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'liquid_glass_assistant.png') })
    console.log('Saved liquid_glass_assistant.png')

    // 5. Light Theme View
    console.log('5. Toggling Light Theme...')
    const themeBtn = page.locator('header button[aria-label="Переключить тему оформления"]')
    if (await themeBtn.isVisible()) {
      await themeBtn.click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'liquid_glass_light_theme.png') })
      console.log('Saved liquid_glass_light_theme.png')

      // Toggle back to dark
      await themeBtn.click()
      await page.waitForTimeout(300)
    }

    // 6. Profile Page with Logged in Admin
    console.log('6. Logging in and visiting Profile Page...')
    const guestLoginBtn = page.locator('header button[aria-label="Открыть профиль"]')
    if (await guestLoginBtn.isVisible()) {
      await guestLoginBtn.click()
      await page.waitForTimeout(500)
      // Click dev login
      const devBtn = page.getByRole('button', { name: /Быстрый вход/i })
      if (await devBtn.isVisible()) {
        await devBtn.click()
        await page.waitForTimeout(1000)
      }
    }
    await page.goto('http://127.0.0.1:5173/#/profile', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'liquid_glass_profile.png') })
    console.log('Saved liquid_glass_profile.png')

    console.log('ALL LIQUID GLASS VISUAL CHECKS COMPLETED!')
  } catch (err) {
    console.error('Liquid glass verification error:', err)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

run()
