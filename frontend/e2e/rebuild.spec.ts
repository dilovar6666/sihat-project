import { expect, test } from '@playwright/test'

test('renders the rebuilt SIHAT landing experience', async ({ page }) => {
  await page.route('http://127.0.0.1:8000/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/categories' || path === '/tests' || path === '/knowledge' || path === '/faq') return route.fulfill({ json: [] })
    return route.fulfill({ status: 404, json: { detail: 'Not found' } })
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Make room/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Explore SIHAT/i })).toBeVisible()
  await page.getByRole('button', { name: /Explore SIHAT/i }).click()
  await expect(page.getByRole('heading', { name: /Start with/i })).toBeVisible()
})
