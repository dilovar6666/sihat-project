import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]`, msg.text()))
  page.on('pageerror', err => console.log('[PAGEERROR]', err))
  
  console.log('Navigating to http://localhost:5173/# ...')
  await page.goto('http://localhost:5173/#')
  await page.waitForTimeout(1000)

  console.log('Finding and clicking login button...')
  const loginBtn = await page.locator('button:has-text("Войти")').first()
  if (loginBtn) {
    await loginBtn.click()
    console.log('Login modal opened. Waiting 3 seconds for Google gsi to render...')
    await page.waitForTimeout(3000)
    
    // Check if google button iframe exists
    const iframeCount = await page.locator('iframe').count()
    console.log('Iframes found in modal:', iframeCount)
    for (let i = 0; i < iframeCount; i++) {
      const src = await page.locator('iframe').nth(i).getAttribute('src')
      console.log(`Iframe ${i} src:`, src)
    }
  }

  await browser.close()
}

run().catch(console.error)
