import { expect, test } from '@playwright/test'

test('renders core navigation and verified routes across SIHAT platform', async ({ page }) => {
  await page.goto('/')

  // 1. Home page renders brand logo and hero
  await expect(page.locator('header img[alt="SIHAT"]')).toBeVisible()

  // 2. Navigate to Catalog
  await page.goto('/#/catalog')
  await expect(page).toHaveURL(/#\/catalog/)

  // 3. Navigate to Methodology Library
  await page.goto('/#/methodologies')
  await expect(page).toHaveURL(/#\/methodologies/)
  await expect(page.getByText('Библиотека паспортов методик SIHAT')).toBeVisible()

  // 4. Navigate to dedicated Auth login page
  await page.goto('/#/login')
  await expect(page).toHaveURL(/#\/login/)
  await expect(page.getByText('Вход в аккаунт SIHAT')).toBeVisible()

  // 5. Navigate to dedicated Auth register page
  await page.goto('/#/register')
  await expect(page).toHaveURL(/#\/register/)
  await expect(page.locator('h3', { hasText: 'Создать личный профиль' })).toBeVisible()

  // 6. Navigate to Profile page (Guest view)
  await page.goto('/#/profile')
  await expect(page).toHaveURL(/#\/profile/)
  await expect(page.getByText('Личный закрытый кабинет SIHAT')).toBeVisible()

  // 7. Navigate to interactive test: Schulte Table
  await page.goto('/#/test/attention-concentration')
  await expect(page).toHaveURL(/#\/test\/attention-concentration/)
  await expect(page.locator('h1', { hasText: 'Таблицы Шульте (5 × 5)' })).toBeVisible()

  // 8. Navigate to interactive test: Cursor Corridor Path
  await page.goto('/#/test/cursor-path')
  await expect(page).toHaveURL(/#\/test\/cursor-path/)
  await expect(page.locator('h1', { hasText: 'Точный маршрут курсора' })).toBeVisible()
  await expect(page.locator('h3', { hasText: 'Удержание траектории' })).toBeVisible()

  // 9. Navigate to interactive test: GAD-7 Anxiety Scale
  await page.goto('/#/test/anxiety')
  await expect(page).toHaveURL(/#\/test\/anxiety/)
  await expect(page.locator('h1', { hasText: 'Шкала тревожности GAD-7' })).toBeVisible()
  await expect(page.locator('h3', { hasText: 'Шкала генерализованной тревожности' })).toBeVisible()
})
