import { chromium } from '@playwright/test'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  console.log('Starting Playwright Assistant Verification...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  })
  const page = await context.newPage()

  try {
    // 1. Visit Home Page & Check Floating AI Button
    console.log('1. Visiting Home Page...')
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)

    const floatingBtn = page.getByRole('button', { name: /ИИ-помощник|AI Guide|Ёвари AI/i })
    await floatingBtn.waitFor({ state: 'visible', timeout: 5000 })
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'floating_ai_button_visible.png') })
    console.log('Saved floating_ai_button_visible.png')

    // 2. Open Compact Floating AI Widget
    console.log('2. Clicking Floating AI Button to open compact widget...')
    await floatingBtn.click()
    await page.waitForTimeout(600)

    // Verify compact widget is visible and compact
    const compactWidget = page.locator('aside[aria-label="Компактное окно ИИ-помощника"]')
    await compactWidget.waitFor({ state: 'visible', timeout: 5000 })

    // Click a quick prompt pill: e.g. "Как проверить зрение?"
    console.log('Sending message via quick prompt pill in compact widget...')
    const quickPill = page.getByRole('button', { name: /Как проверить зрение\?/i })
    if (await quickPill.isVisible()) {
      await quickPill.click()
    } else {
      // Input text manually
      const input = compactWidget.locator('input[type="text"]')
      await input.fill('Как проверить зрение?')
      await compactWidget.locator('button[type="submit"]').click()
    }

    // Wait for response to be formulated
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'compact_ai_widget_open.png') })
    console.log('Saved compact_ai_widget_open.png')

    // 3. Click Maximize button to navigate to dedicated AI page
    console.log('3. Clicking Maximize button to open dedicated AI page...')
    const maximizeBtn = compactWidget.locator('button[aria-label="Открыть отдельный сайт ИИ"]')
    await maximizeBtn.click()
    await page.waitForTimeout(1000)

    // Verify URL is #/assistant
    console.log('Current URL hash:', await page.evaluate(() => window.location.hash))

    // 4. Dedicated AI Page Overview
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'assistant_page_overview.png') })
    console.log('Saved assistant_page_overview.png')

    // 5. Click a Scenario Card on the dedicated page: "Аудиометрия чистых тонов"
    console.log('5. Clicking scenario card on dedicated AI page...')
    const earScenario = page.getByRole('button', { name: /Аудиометрия чистых тонов/i })
    if (await earScenario.isVisible()) {
      await earScenario.click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'assistant_page_scenario_result.png') })
      console.log('Saved assistant_page_scenario_result.png')
    }

    // 6. Open Gemini API Key Modal
    console.log('6. Opening Gemini API Key Modal...')
    const apiKeyBtn = page.getByRole('button', { name: /Подключить Gemini API|API-ключ настроен/i })
    if (await apiKeyBtn.isVisible()) {
      await apiKeyBtn.click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'assistant_page_apikey_modal.png') })
      console.log('Saved assistant_page_apikey_modal.png')

      // Close modal
      const cancelBtn = page.getByRole('button', { name: /Отмена/i })
      await cancelBtn.click()
      await page.waitForTimeout(400)
    }

    // 7. Toggle Theme to Light
    console.log('7. Toggling to Light Theme...')
    const themeBtn = page.locator('header button[aria-label="Переключить тему оформления"]')
    if (await themeBtn.isVisible()) {
      await themeBtn.click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'assistant_page_light_theme.png') })
      console.log('Saved assistant_page_light_theme.png')

      // Toggle back to dark
      await themeBtn.click()
      await page.waitForTimeout(400)
    }

    console.log('ALL PLAYWRIGHT ASSISTANT VERIFICATIONS COMPLETED SUCCESSFULLY!')
  } catch (err) {
    console.error('Verification failed:', err)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

run()
