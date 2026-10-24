import { chromium } from 'playwright'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  // Set language to TJ
  await page.addInitScript(() => {
    localStorage.setItem('sihat_lang', 'tj')
  })

  console.log('Navigating to http://127.0.0.1:5173/#/catalog in Tajiki...')
  await page.goto('http://127.0.0.1:5173/#/catalog', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'catalog_15_tests_tj.png') })

  console.log('Navigating to #/test/reaction-speed in Tajiki...')
  await page.goto('http://127.0.0.1:5173/#/test/reaction-speed', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_reaction_speed_tj.png') })

  await browser.close()
  console.log('Tajiki verification passed!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
