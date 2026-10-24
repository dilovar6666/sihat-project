import { chromium } from 'playwright'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  console.log('1. Launching browser to verify Floating Translucent Navbar & Profile Sidebar...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  await page.addInitScript(() => {
    localStorage.setItem('sihat_theme', 'dark')
  })

  console.log('2. Navigating to http://127.0.0.1:5173/#/ ...')
  await page.goto('http://127.0.0.1:5173/#/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)

  // Verify Floating Navbar in Dark mode
  console.log('3. Checking floating navbar styles and elements in Dark mode...')
  const navbarPill = page.locator('header > div')
  await navbarPill.waitFor({ state: 'visible' })

  // Print text content
  const navText = await navbarPill.innerText()
  console.log('Navbar inner text:', navText.replace(/\s+/g, ' '))

  // Save screenshot of floating navbar in Dark mode
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'navbar_floating_dark.png'),
    fullPage: false,
  })
  console.log('Saved navbar_floating_dark.png')

  // Switch to Light mode
  console.log('4. Switching to Light theme...')
  const themeBtn = page.locator('button[aria-label="Переключить тему оформления"]')
  await themeBtn.click()
  await page.waitForTimeout(500)

  // Save screenshot of floating navbar in Light mode
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'navbar_floating_light.png'),
    fullPage: false,
  })
  console.log('Saved navbar_floating_light.png')

  // Switch back to Dark mode
  await themeBtn.click()
  await page.waitForTimeout(400)

  // Open Profile Drawer as Guest
  console.log('5. Clicking Profile trigger to open Profile Sidebar (Guest)...')
  const profileGuestBtn = page.locator('button[aria-label="Открыть профиль"]')
  await profileGuestBtn.click()
  await page.waitForTimeout(600)

  // Verify Sidebar items
  const drawer = page.locator('aside[aria-modal="true"]')
  await drawer.waitFor({ state: 'visible' })

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'profile_sidebar_guest.png'),
    fullPage: false,
  })
  console.log('Saved profile_sidebar_guest.png')

  // Click "История результатов" inside sidebar
  console.log('6. Clicking "История результатов" inside Profile Sidebar...')
  await page.click('text=История результатов')
  await page.waitForTimeout(600)
  console.log('Current URL hash:', await page.evaluate(() => window.location.hash))

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'profile_navigated_history.png'),
    fullPage: false,
  })
  console.log('Saved profile_navigated_history.png')

  // Now login as Admin to test Admin in Profile Drawer
  console.log('7. Logging in as Admin via quick Dev login...')
  await page.evaluate(() => { window.location.hash = '#/home' })
  await page.waitForTimeout(400)

  // Open Profile Drawer again
  await page.locator('button[aria-label="Открыть профиль"]').click()
  await page.waitForTimeout(400)

  // Click Sign in button in drawer
  await page.click('button:has-text("Войти или зарегистрироваться")')
  await page.waitForTimeout(500)

  // Click Dev Admin Login
  const devAdminBtn = page.locator('button:has-text("Dilovar")')
  if (await devAdminBtn.isVisible({ timeout: 4000 })) {
    console.log('Clicking Quick Dev Admin Login (Dilovar)...')
    await devAdminBtn.click()
    await page.waitForTimeout(1000)
  }

  // Now user is Admin! Let's click Profile button
  console.log('8. Opening Profile Drawer for Admin user...')
  const userProfileBtn = page.locator('button[aria-label="Профиль пользователя"]')
  await userProfileBtn.waitFor({ state: 'visible', timeout: 5000 })
  await userProfileBtn.click()
  await page.waitForTimeout(600)

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'profile_sidebar_admin.png'),
    fullPage: false,
  })
  console.log('Saved profile_sidebar_admin.png')

  // Click "Админ-панель (Tremor)" in Profile Drawer
  console.log('9. Clicking "Админ-панель (Tremor)" in Profile Drawer...')
  await page.click('text=Админ-панель (Tremor)')
  await page.waitForTimeout(800)
  console.log('Admin URL hash:', await page.evaluate(() => window.location.hash))

  // Re-open Profile and click "ИИ-помощник (Gemini)"
  console.log('10. Re-opening Profile and clicking "ИИ-помощник (Gemini)"...')
  await userProfileBtn.click()
  await page.waitForTimeout(400)
  await page.click('text=ИИ-помощник (Gemini)')
  await page.waitForTimeout(600)

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'profile_triggered_assistant.png'),
    fullPage: false,
  })
  console.log('Saved profile_triggered_assistant.png')

  console.log('SUCCESS: All floating navbar and profile drawer interactions verified!');
  await browser.close()
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
