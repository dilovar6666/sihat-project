import { expect, test } from '@playwright/test'

test('validates SIHAT Signature landing page, trilingual localization, and theme switcher', async ({ page }) => {
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    return route.fulfill({ status: 404, json: { detail: 'Not found' } })
  })

  await page.goto('/')

  // Switch to Home tab
  await page.getByRole('button', { name: 'Home' }).click()

  // Verify Slogan and brand presence
  await expect(page.getByText('UNDERSTAND YOUR HEALTH').first()).toBeVisible()

  // Verify Medical disclaimer callout in English initially
  await expect(page.getByText(/The SIHAT platform is not a medical device/i).first()).toBeVisible()

  // Switch to Tajik (TJ)
  await page.getByRole('button', { name: 'TJ' }).click()
  await expect(page.getByText('Саломатии худро беҳтар фаҳмед')).toBeVisible()
  await expect(page.getByText(/Платформаи SIHAT ташхис намегузорад/i).first()).toBeVisible()

  // Switch to Russian (RU)
  await page.getByRole('button', { name: 'RU' }).click()
  await expect(page.getByText('Понимайте состояние своего здоровья')).toBeVisible()
  await expect(page.getByText(/не является медицинским изделием/i).first()).toBeVisible()

  // Switch back to English (EN)
  await page.getByRole('button', { name: 'EN' }).click()
  await expect(page.getByText('Understand Your Health').first()).toBeVisible()

  // Toggle Theme: Light -> Dark
  const htmlTag = page.locator('html')
  await expect(htmlTag).toHaveAttribute('data-theme', 'light')

  await page.getByRole('button', { name: /Dark/i }).click()
  await expect(htmlTag).toHaveAttribute('data-theme', 'dark')

  // Toggle Theme: Dark -> Light
  await page.getByRole('button', { name: /Light/i }).click()
  await expect(htmlTag).toHaveAttribute('data-theme', 'light')
})
