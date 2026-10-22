import { expect, test } from '@playwright/test'

test('runs an educational exercise and submits a valid completed answer', async ({ page }) => {
  let submittedAnswer: unknown
  await page.addInitScript(() => { Math.random = () => 0 })
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (path === '/auth/login') return route.fulfill({ json: { access_token: 'test-token' } })
    if (path === '/attempts/start') return route.fulfill({ json: { id: 'attempt-1', current_question: { id: 'reaction-speed-response' } } })
    if (path === '/attempts/attempt-1/answer') {
      submittedAnswer = JSON.parse(route.request().postData() ?? '{}').answer
      return route.fulfill({ json: { id: 'attempt-1', current_question: null } })
    }
    if (path === '/attempts/attempt-1/complete') {
      return route.fulfill({ json: { result: { message: 'Exercise result only; it is not a diagnosis.' } } })
    }
    return route.fulfill({ status: 404, json: { detail: 'Unexpected request' } })
  })

  await page.goto('/')
  await page.getByLabel('Email').fill('learner@example.com')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Sign in to choose an exercise' }).click()
  await expect(page.locator('article')).toHaveCount(15)
  await page.locator('article', { hasText: 'Reaction speed' }).getByRole('button', { name: 'Start exercise' }).click()
  await page.getByRole('button', { name: 'Start reaction timing' }).click()
  await page.getByRole('button', { name: 'Respond now' }).click({ timeout: 2_000 })
  await expect(page.getByRole('button', { name: 'Save completed exercise' })).toBeEnabled()
  await page.getByRole('button', { name: 'Save completed exercise' }).click()
  await expect(page.getByRole('heading', { name: 'Exercise complete' })).toBeVisible()
  expect(submittedAnswer).toBe('completed')
})

test('opens each of the fifteen educational activity panels', async ({ page }) => {
  const started: string[] = []
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/auth/login') return route.fulfill({ json: { access_token: 'test-token' } })
    if (path === '/attempts/start') {
      started.push(JSON.parse(route.request().postData() ?? '{}').test_slug)
      return route.fulfill({ json: { id: 'attempt-1', current_question: { id: 'exercise-response' } } })
    }
    if (path === '/attempts/attempt-1/discard') return route.fulfill({ status: 204 })
    return route.fulfill({ status: 404, json: { detail: 'Unexpected request' } })
  })
  await page.goto('/')
  await page.getByLabel('Email').fill('learner@example.com')
  await page.getByLabel('Password').fill('password')
  await page.getByRole('button', { name: 'Sign in to choose an exercise' }).click()
  const cards = page.locator('article')
  for (let index = 0; index < 15; index += 1) {
    await cards.nth(index).getByRole('button', { name: 'Start exercise' }).click()
    await expect(page.getByRole('button', { name: 'Leave exercise' })).toBeVisible()
    await page.getByRole('button', { name: 'Leave exercise' }).click()
  }
  expect(started).toHaveLength(15)
})
