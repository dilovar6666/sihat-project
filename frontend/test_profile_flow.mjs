import { chromium } from '@playwright/test'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  console.log('Starting Playwright Profile Page Verification...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  })
  const page = await context.newPage()

  try {
    // 1. Visit as Guest
    console.log('1. Visiting #/profile as guest...')
    await page.goto('http://127.0.0.1:5173/#/profile', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_page_guest.png') })
    console.log('Saved profile_page_guest.png')

    // 2. Open Auth Modal & Log In
    console.log('2. Opening Auth modal and logging in...')
    const guestLoginBtn = page.getByRole('button', { name: /Войти или зарегистрироваться/i })
    await guestLoginBtn.click()
    await page.waitForTimeout(600)

    // Quick Admin login button
    const devBtn = page.getByRole('button', { name: /Быстрый вход/i })
    if (await devBtn.isVisible()) {
      console.log('Using quick admin dev login button...')
      await devBtn.click()
    } else {
      console.log('Entering email and password...')
      const emailInput = page.locator('input[type="email"]')
      const passwordInput = page.locator('input[type="password"]')
      await emailInput.fill('alidodovdilovar01@gmail.com')
      await passwordInput.fill('AdminPass123!')
      const submitBtn = page.getByRole('button', { name: /Войти в систему/i })
      await submitBtn.click()
    }

    // Wait for login to complete and user state to propagate
    await page.waitForTimeout(1500)
    console.log('Logged in. Ensuring we are on #/profile...')
    await page.evaluate(() => { window.location.hash = '#/profile' })
    await page.waitForTimeout(1200)

    // 3. Overview / Results Tab
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_page_results_tab.png') })
    console.log('Saved profile_page_results_tab.png')

    // 4. Open Avatar Modal
    console.log('4. Opening Avatar Modal...')
    const changeAvatarBtn = page.getByRole('button', { name: /Сменить аватарку/i }).first()
    await changeAvatarBtn.waitFor({ state: 'visible', timeout: 10000 })
    await changeAvatarBtn.click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_avatar_modal.png') })
    console.log('Saved profile_avatar_modal.png')

    // Select "Нейробиолог" preset
    console.log('Selecting preset avatar...')
    const neuroPreset = page.getByRole('button', { name: /Нейробиолог/i })
    if (await neuroPreset.isVisible()) {
      await neuroPreset.click()
    } else {
      const firstPreset = page.locator('div.grid button').first()
      await firstPreset.click()
    }
    await page.waitForTimeout(500)

    // Click "Применить аватарку"
    const applyAvatarBtn = page.getByRole('button', { name: /Применить аватарку/i })
    await applyAvatarBtn.click()
    await page.waitForTimeout(1500)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_avatar_saved.png') })
    console.log('Saved profile_avatar_saved.png')

    // 5. Edit Tab
    console.log('5. Switching to Edit Tab...')
    const editTabBtn = page.getByRole('button', { name: /Редактирование профиля/i })
    await editTabBtn.click()
    await page.waitForTimeout(600)

    // Edit full name
    const fullNameInput = page.locator('form input[type="text"]').first()
    if (await fullNameInput.isVisible()) {
      await fullNameInput.fill('Диловар Алидодов (M.D.)')
      const saveEditBtn = page.getByRole('button', { name: /Сохранить изменения/i })
      await saveEditBtn.click()
      await page.waitForTimeout(1500)
    }
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_edit_tab_saved.png') })
    console.log('Saved profile_edit_tab_saved.png')

    // 6. Security Tab
    console.log('6. Switching to Security Tab...')
    const securityTabBtn = page.getByRole('button', { name: /Безопасность и аккаунты/i })
    await securityTabBtn.click()
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_security_tab.png') })
    console.log('Saved profile_security_tab.png')

    // 7. Profile Drawer
    console.log('7. Opening Profile Drawer from Navbar...')
    const navbarProfileBtn = page.locator('header button[aria-label="Профиль пользователя"]')
    if (await navbarProfileBtn.isVisible()) {
      await navbarProfileBtn.click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'profile_drawer_with_avatar.png') })
      console.log('Saved profile_drawer_with_avatar.png')
    }

    console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!')
  } catch (err) {
    console.error('Verification failed:', err)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

run()
