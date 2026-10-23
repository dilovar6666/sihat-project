import { expect, test } from '@playwright/test'

test('renders the rebuilt SIHAT landing experience', async ({ page }) => {
  await page.route('http://127.0.0.1:8000/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/categories') return route.fulfill({ json: [{id:'c1',slug:'vision',localizations:{en:{title:'Vision'},ru:{title:'Зрение'},tg:{title:'Биноӣ'}}}] })
    if (path === '/tests') return route.fulfill({ json: [{id:'t1',category_id:'c1',slug:'contrast-check',type:'digital_check',localizations:{en:{title:'Contrast check',description:'English'},ru:{title:'Проверка контраста',description:'Русский'},tg:{title:'Санҷиши контраст',description:'Тоҷикӣ'}}}] })
    if (path === '/knowledge' || path === '/faq') return route.fulfill({ json: [] })
    return route.fulfill({ status: 404, json: { detail: 'Not found' } })
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Make room/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Explore SIHAT/i })).toBeVisible()
  await page.getByRole('button', { name: /Explore SIHAT/i }).click()
  await expect(page.getByRole('heading', { name: /Start with/i })).toBeVisible()
  await expect(page.getByText('Contrast check')).toBeVisible()
  await page.getByLabel('Change language').click()
  await expect(page.getByText('Проверка контраста')).toBeVisible()
  await page.getByLabel('Change language').click()
  await expect(page.getByText('Санҷиши контраст')).toBeVisible()
})
