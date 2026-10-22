import { expect, test } from '@playwright/test'

test('browses catalog, filters by category, and inspects methodology passport', async ({ page }) => {
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (path === '/categories') {
      return route.fulfill({
        json: [
          { id: 'c1', slug: 'vision', localizations: { en: { title: 'Vision' } } },
          { id: 'c2', slug: 'hearing', localizations: { en: { title: 'Hearing' } } },
        ],
      })
    }
    if (path === '/tests') {
      return route.fulfill({
        json: [
          {
            id: 't1',
            category_id: 'c1',
            slug: 'contrast-sensitivity',
            type: 'digital_check',
            status: 'published',
            guest_allowed: true,
            min_age: 16,
            max_age: null,
            localizations: { en: { title: 'Contrast sensitivity check' } },
            methodology: {
              name: 'Screen Contrast Method',
              version: '1.2',
              evidence_status: 'digital',
              source: 'ISO Display Standards',
              limitations: 'Subject to monitor brightness and ambient lighting.',
              warnings: ['Not a diagnostic examination for cataract or optical disease.'],
            },
          },
        ],
      })
    }
    return route.fulfill({ status: 404, json: { detail: 'Not found' } })
  })

  await page.goto('/')

  // Open Catalog tab
  await page.getByRole('button', { name: 'Catalog & Passports' }).click()
  await expect(page.getByText('Contrast sensitivity check')).toBeVisible()

  // Open Methodology Passport Modal
  await page.getByRole('button', { name: 'Methodology Passport' }).click()
  await expect(page.getByRole('heading', { name: /Methodology/i })).toBeVisible()
  await expect(page.getByText('Screen Contrast Method (v1.2)')).toBeVisible()
  await expect(page.getByText('Subject to monitor brightness and ambient lighting.')).toBeVisible()
  await expect(page.getByText('Not a diagnostic examination for cataract or optical disease.')).toBeVisible()

  // Dismiss modal
  await page.getByRole('button', { name: 'Dismiss' }).click()
  await expect(page.getByText('Subject to monitor brightness and ambient lighting.')).not.toBeVisible()
})

test('user views private history and triggers compatible comparison', async ({ page }) => {
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (path === '/auth/login') {
      return route.fulfill({ json: { access_token: 'valid-user-token' } })
    }
    if (path === '/me/profile') {
      return route.fulfill({ json: { id: 'u1', email: 'user@sihat.local', role: 'user', age_group: '18_plus' } })
    }
    if (path === '/results/history') {
      return route.fulfill({
        json: [
          {
            id: 'res-1',
            test_slug: 'contrast-sensitivity',
            test_type: 'digital_check',
            test_title: 'Contrast choices',
            methodology_name: 'Screen Contrast Method',
            methodology_version: '1.2',
            definition_version: '1.0',
            compatibility_conditions: { device: 'standard' },
            result: { score: '10/12' },
            limitations: 'Environmental light conditions apply.',
            warnings: ['Non-clinical metric.'],
            completed_at: new Date().toISOString(),
          },
        ],
      })
    }
    if (path === '/results/res-1/compare') {
      return route.fulfill({
        json: {
          base_result: { id: 'res-1' },
          results: [
            { id: 'res-1', completed_at: new Date().toISOString(), result: { score: '10/12' } },
            { id: 'res-2', completed_at: new Date().toISOString(), result: { score: '11/12' } },
          ],
          compatibility_rule: 'same test, methodology, and device conditions',
        },
      })
    }
    return route.fulfill({ status: 404, json: { detail: 'Not found' } })
  })

  await page.goto('/')
  await page.getByLabel('Email').fill('user@sihat.local')
  await page.getByLabel('Password').fill('userpassword')
  await page.getByRole('button', { name: 'Sign in to choose an exercise' }).click()

  // Open My History & PDF tab
  await page.getByRole('button', { name: 'My History & PDF' }).click()
  await expect(page.getByText('Your Private Results History')).toBeVisible()
  await expect(page.getByText('Contrast choices')).toBeVisible()

  // Run comparison
  await page.getByRole('button', { name: 'Compare' }).click()
  await expect(page.getByText('Compatible Result Comparison')).toBeVisible()
  await expect(page.getByText('Completion #1')).toBeVisible()
  await expect(page.getByText('Completion #2')).toBeVisible()
})
