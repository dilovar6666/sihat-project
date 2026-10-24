import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  console.log('Launching browser for verification...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[BROWSER ERROR]', msg.text())
  })

  // 1. Open FAQ page in Russian
  console.log('Step 1: Navigating to http://127.0.0.1:5173/#/faq ...')
  await page.goto('http://127.0.0.1:5173/#/faq')
  await page.waitForTimeout(1000)

  // Switch to Russian first to be certain
  const langBtn = page.locator('button:has-text("TJ"), button:has-text("RU"), button:has-text("EN")').first()
  if (await langBtn.isVisible()) {
    await langBtn.click()
    await page.waitForTimeout(300)
    const ruOpt = page.locator('button:has-text("Русский")')
    if (await ruOpt.isVisible()) await ruOpt.click()
    await page.waitForTimeout(500)
  }

  const faqShotRu = path.join(ARTIFACT_DIR, 'verified_faq_ru.png')
  await page.screenshot({ path: faqShotRu, fullPage: false })
  console.log('Saved Russian FAQ screenshot:', faqShotRu)

  // 2. Switch language to Tajiki
  console.log('Step 2: Switching language to Tajiki (TJ)...')
  const langBtnTj = page.locator('button:has-text("RU")').first()
  await langBtnTj.click()
  await page.waitForTimeout(300)
  await page.locator('button:has-text("Тоҷикӣ")').click()
  await page.waitForTimeout(1000)

  const faqShotTj = path.join(ARTIFACT_DIR, 'verified_faq_tj.png')
  await page.screenshot({ path: faqShotTj, fullPage: false })
  console.log('Saved Tajiki FAQ screenshot:', faqShotTj)

  // Verify text in Tajiki
  const headingText = await page.locator('h2').first().innerText()
  console.log('Tajiki H2 title:', headingText)

  const firstQuestion = await page.locator('button:has-text("SIHAT")').first().innerText()
  console.log('Tajiki FAQ question:', firstQuestion)

  // 3. Test Auth Modal with Dev Login
  console.log('Step 3: Opening Auth Modal and testing Dev Login...')
  const authBtn = page.locator('button:has-text("Воридшавӣ"), button:has-text("Войти")').first()
  await authBtn.click()
  await page.waitForTimeout(800)

  const modalShot = path.join(ARTIFACT_DIR, 'verified_auth_modal.png')
  await page.screenshot({ path: modalShot })
  console.log('Saved Auth Modal screenshot:', modalShot)

  const devLoginBtn = page.locator('button:has-text("Dilovar")').first()
  if (await devLoginBtn.isVisible()) {
    console.log('Clicking Dev Login button for Dilovar...')
    await devLoginBtn.click()
    await page.waitForTimeout(1200)
  }

  // 4. Test Assistant Drawer
  console.log('Step 4: Opening Assistant Drawer...')
  const assistantBtn = page.locator('button:has-text("Ёвари AI"), button:has-text("AI Помощник")').first()
  await assistantBtn.click()
  await page.waitForTimeout(600)

  // Click quick prompt "Чӣ тавр биноиро санҷем?" or "Как проверить зрение?"
  const promptChip = page.locator('button:has-text("биноиро"), button:has-text("зрение")').first()
  if (await promptChip.isVisible()) {
    console.log('Clicking quick prompt chip...')
    await promptChip.click()
    await page.waitForTimeout(2000)
  }

  const assistantShot = path.join(ARTIFACT_DIR, 'verified_assistant.png')
  await page.screenshot({ path: assistantShot })
  console.log('Saved Assistant Drawer screenshot:', assistantShot)

  // Read latest message text
  const lastMessage = await page.locator('.whitespace-pre-wrap').last().innerText()
  console.log('Latest Assistant reply preview:', lastMessage.slice(0, 150) + '...')

  await browser.close()
  console.log('Verification completed successfully!')
}

run().catch(err => {
  console.error('Verification failed:', err)
  process.exit(1)
})
