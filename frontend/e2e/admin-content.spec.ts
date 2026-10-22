import { expect, test } from '@playwright/test'

test('navigates to FAQ and submits a support inquiry', async ({ page }) => {
  let submittedTicket: unknown
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (path === '/faq') {
      return route.fulfill({
        json: [
          {
            id: 'faq-1',
            slug: 'what-is-sihat',
            category: 'general',
            question: { en: 'What is SIHAT?', ru: 'Что такое SIHAT?' },
            answer: { en: 'Educational health screening platform.', ru: 'Образовательная платформа.' },
          },
        ],
      })
    }
    if (path === '/support/tickets') {
      submittedTicket = JSON.parse(route.request().postData() ?? '{}')
      return route.fulfill({
        status: 201,
        json: {
          id: 'ticket-1',
          contact_email: 'user@example.com',
          subject: 'Question on tests',
          message: 'Can I perform exercises on mobile?',
          status: 'open',
          created_at: new Date().toISOString(),
        },
      })
    }
    return route.fulfill({ status: 404, json: { detail: 'Not found' } })
  })

  await page.goto('/')

  // Navigate to FAQ
  await page.getByRole('button', { name: 'FAQ' }).click()
  await expect(page.getByText('What is SIHAT?')).toBeVisible()
  await expect(page.getByText('Educational health screening platform.')).toBeVisible()

  // Navigate to Support
  await page.getByRole('button', { name: 'Support' }).click()
  await page.getByLabel('Contact Email').fill('user@example.com')
  await page.getByLabel('Subject').fill('Question on tests')
  await page.getByLabel('Message').fill('Can I perform exercises on mobile?')
  await page.getByRole('button', { name: 'Submit support ticket' }).click()
  await expect(page.getByText('Your support request was submitted.')).toBeVisible()
  expect(submittedTicket).toMatchObject({
    contact_email: 'user@example.com',
    subject: 'Question on tests',
  })
})

test('admin logs in and accesses administrative dashboard and users list', async ({ page }) => {
  await page.route('http://127.0.0.1:8000/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (path === '/auth/login') {
      return route.fulfill({ json: { access_token: 'admin-jwt-token' } })
    }
    if (path === '/me/profile') {
      return route.fulfill({
        json: { id: 'admin-1', email: 'admin@sihat.local', role: 'admin', age_group: '18_plus' },
      })
    }
    if (path === '/admin/dashboard') {
      return route.fulfill({
        json: {
          total_users: 18,
          active_users: 16,
          inactive_users: 2,
          total_categories: 10,
          total_completed_attempts: 42,
          total_saved_results: 35,
          users_by_age_group: { '18_plus': 18 },
          tests_by_status: { published: 15, draft: 15 },
          tests_by_type: { educational_exercise: 15 },
          tickets_by_status: { open: 3 },
        },
      })
    }
    if (path === '/admin/users') {
      return route.fulfill({
        json: [
          { id: 'u1', email: 'user1@example.com', role: 'user', age_group: '18_plus', is_active: true },
          { id: 'admin-1', email: 'admin@sihat.local', role: 'admin', age_group: '18_plus', is_active: true },
        ],
      })
    }
    if (path === '/admin/support/tickets') {
      return route.fulfill({
        json: [
          { id: 't1', contact_email: 'visitor@example.com', subject: 'Inquiry', status: 'open' },
        ],
      })
    }
    if (path === '/admin/tests') {
      return route.fulfill({
        json: [
          { id: 'tst1', slug: 'reaction-speed', type: 'educational_exercise', status: 'published', guest_allowed: true, min_age: 16 },
        ],
      })
    }
    return route.fulfill({ status: 404, json: { detail: 'Not found' } })
  })

  await page.goto('/')
  await page.getByLabel('Email').fill('admin@sihat.local')
  await page.getByLabel('Password').fill('adminpassword')
  await page.getByRole('button', { name: 'Sign in to choose an exercise' }).click()

  // Admin button should appear in navigation
  await expect(page.getByRole('button', { name: 'Admin Panel' })).toBeVisible()
  await page.getByRole('button', { name: 'Admin Panel' }).click()

  // Check dashboard metrics and user list
  await expect(page.getByText('Administrative Dashboard')).toBeVisible()
  await expect(page.getByText('Total Users')).toBeVisible()
  await expect(page.getByText('user1@example.com')).toBeVisible()
  await expect(page.getByText('reaction-speed')).toBeVisible()
})
