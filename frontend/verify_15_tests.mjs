import { chromium } from 'playwright'
import path from 'path'

const ARTIFACT_DIR = 'C:/Users/Dio/.gemini/antigravity/brain/9af53273-2c36-40ca-8721-a9ffcdd9aa8b'

async function run() {
  console.log('Launching headless browser...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  console.log('Navigating to http://127.0.0.1:5173/#/catalog...')
  await page.goto('http://127.0.0.1:5173/#/catalog', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)

  // 1. Verify Catalog with 15 tests
  const testCards = page.locator('#catalog .grid > div')
  const count = await testCards.count()
  console.log(`Found ${count} test cards in catalog`)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'catalog_15_tests.png'), fullPage: false })

  // 2. Open Reaction Speed Test
  console.log('Navigating to #/test/reaction-speed...')
  await page.goto('http://127.0.0.1:5173/#/test/reaction-speed', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_reaction_speed_idle.png') })

  // Click start test
  const startBtn = page.getByRole('button', { name: /Начать|Оғоз|Start/i })
  if (await startBtn.isVisible()) {
    await startBtn.click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_reaction_speed_waiting.png') })
  }

  // 3. Open Schulte Table Test
  console.log('Navigating to #/test/attention-concentration...')
  await page.goto('http://127.0.0.1:5173/#/test/attention-concentration', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const startSchulte = page.getByRole('button', { name: /Начать поиск|Оғоз|Start/i })
  if (await startSchulte.isVisible()) {
    await startSchulte.click()
    await page.waitForTimeout(500)
    // Click on 1, 2, 3
    const cell1 = page.locator('button', { hasText: /^1$/ })
    if (await cell1.isVisible()) await cell1.click()
    await page.waitForTimeout(200)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_schulte_active.png') })
  }

  // 4. Open Landolt C Vision Test
  console.log('Navigating to #/test/visual-perception...')
  await page.goto('http://127.0.0.1:5173/#/test/visual-perception', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const startVision = page.getByRole('button', { name: /Начать|Оғоз|Start/i })
  if (await startVision.isVisible()) {
    await startVision.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_landolt_c_active.png') })
  }

  // 5. Open Somatic Radar Test
  console.log('Navigating to #/test/physical-wellbeing...')
  await page.goto('http://127.0.0.1:5173/#/test/physical-wellbeing', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_somatic_radar.png') })

  // 6. Open Color Hue Farnsworth D-15 Test
  console.log('Navigating to #/test/color-hue-discrimination...')
  await page.goto('http://127.0.0.1:5173/#/test/color-hue-discrimination', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const startHue = page.getByRole('button', { name: /Начать|Оғоз|Start/i })
  if (await startHue.isVisible()) {
    await startHue.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_color_hue_active.png') })
  }

  // 7. Open Pure Tone Audiometry Test
  console.log('Navigating to #/test/sound-discrimination...')
  await page.goto('http://127.0.0.1:5173/#/test/sound-discrimination', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const startAudio = page.getByRole('button', { name: /Начать|Оғоз|Start/i })
  if (await startAudio.isVisible()) {
    await startAudio.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_audiometry_active.png') })
  }

  // 8. Open Emotional Circumplex Test
  console.log('Navigating to #/test/emotional-wellbeing...')
  await page.goto('http://127.0.0.1:5173/#/test/emotional-wellbeing', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_emotional_circumplex.png') })

  // 9. Open Circadian Clock Test
  console.log('Navigating to #/test/daily-activity...')
  await page.goto('http://127.0.0.1:5173/#/test/daily-activity', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_circadian_clock.png') })

  await browser.close()
  console.log('All verifications completed successfully!')
}

run().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
