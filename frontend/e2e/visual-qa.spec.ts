import { test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const OUT_DIR = path.resolve(process.cwd(), '../docs/visual-qa')

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  }
})

const BREAKPOINTS = [
  { name: 'mobile-compact-360', width: 360, height: 740 },
  { name: 'mobile-standard-390', width: 390, height: 844 },
  { name: 'tablet-portrait-768', width: 768, height: 1024 },
  { name: 'tablet-landscape-1024', width: 1024, height: 768 },
  { name: 'desktop-standard-1440', width: 1440, height: 900 },
  { name: 'desktop-wide-1920', width: 1920, height: 1080 },
]

test.describe('Autonomous Visual QA Captures', () => {
  test('captures Home Landing page across 6 breakpoints and themes', async ({ page }) => {
    await page.route('http://127.0.0.1:8000/**', async (route) => {
      return route.fulfill({ status: 404, json: { detail: 'Not found' } })
    })

    await page.goto('/')
    await page.getByRole('button', { name: 'Home' }).click()
    await page.waitForTimeout(400)

    // Capture standard viewports in Light Theme
    for (const bp of BREAKPOINTS) {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      await page.waitForTimeout(300)
      await page.screenshot({
        path: path.join(OUT_DIR, `01-home-light-${bp.name}.png`),
        fullPage: bp.width <= 768, // fullpage for mobile/tablet to audit flow
      })
    }

    // Toggle to Dark Theme at 1440px and capture
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('button', { name: /Dark/i }).click()
    await page.waitForTimeout(400)
    await page.screenshot({
      path: path.join(OUT_DIR, '01-home-dark-desktop-1440.png'),
      fullPage: false,
    })

    // Switch back to light theme
    await page.getByRole('button', { name: /Light/i }).click()
    await page.waitForTimeout(200)
  })

  test('captures Catalog & Methodology Passport Modal', async ({ page }) => {
    await page.route('http://127.0.0.1:8000/**', async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === '/categories') {
        return route.fulfill({
          json: [
            { id: 'c1', slug: 'vision', localizations: { en: { title: 'Vision' } } },
            { id: 'c2', slug: 'hearing', localizations: { en: { title: 'Hearing' } } },
            { id: 'c3', slug: 'memory', localizations: { en: { title: 'Cognition & Memory' } } },
          ],
        })
      }
      if (url.pathname === '/tests') {
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
              localizations: { en: { title: 'Contrast Sensitivity Check', description: 'Evaluates spatial contrast resolution threshold at varying illumination levels.' } },
              methodology: {
                name: 'Screen Contrast Method',
                version: '1.2',
                evidence_status: 'digital',
                source: 'ISO Display Standards & Clinical Optometry Norms',
                limitations: 'Subject to ambient illumination and screen hardware gamma.',
                warnings: ['Does not diagnose cataract, glaucoma, or retinal degeneration.'],
              },
            },
            {
              id: 't2',
              category_id: 'c3',
              slug: 'corsi-blocks',
              type: 'educational_exercise',
              status: 'published',
              guest_allowed: true,
              min_age: 18,
              localizations: { en: { title: 'Corsi Block-Tapping Span', description: 'Measures spatial working memory span and forward sequence retention.' } },
              methodology: {
                name: 'Corsi Block Spatial Span Protocol',
                version: '2.1',
                evidence_status: 'validated',
                source: 'Corsi (1972); Milner (1971) Neuropsychology standard',
                limitations: 'Latency sensitive to touch screen latency and motor tremor.',
                warnings: ['Educational assessment marker only; not a dementia diagnostic.'],
              },
            },
          ],
        })
      }
      return route.fulfill({ status: 404, json: { detail: 'Not found' } })
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Catalog & Passports' }).click()
    await page.waitForTimeout(500)

    // Capture Catalog Grid
    await page.screenshot({
      path: path.join(OUT_DIR, '02-catalog-grid-1440.png'),
    })

    // Open Passport Modal and capture
    await page.getByRole('button', { name: 'Methodology Passport' }).first().click()
    await page.waitForTimeout(400)
    await page.screenshot({
      path: path.join(OUT_DIR, '02-catalog-methodology-passport-modal-1440.png'),
    })

    await page.getByRole('button', { name: 'Dismiss' }).click()
  })

  test('captures Interactive Runner and Privacy Choice Completion', async ({ page }) => {
    await page.addInitScript(() => { Math.random = () => 0 })
    await page.route('http://127.0.0.1:8000/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/auth/login') return route.fulfill({ json: { access_token: 'valid-test-token' } })
      if (path === '/attempts/start') return route.fulfill({ json: { id: 'att-1', current_question: { id: 'reaction-speed-response' } } })
      if (path === '/attempts/att-1/answer') return route.fulfill({ json: { id: 'att-1', current_question: null } })
      if (path === '/attempts/att-1/complete') {
        return route.fulfill({
          json: {
            id: 'att-1',
            result: {
              metric: 'Mean Latency: 218 ms',
              accuracy: '100%',
              message: 'Session response latency computed locally. This is an objective sensory marker, not a clinical diagnosis.',
            },
          },
        })
      }
      return route.fulfill({ status: 404, json: { detail: 'Not found' } })
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    // Login to enter runner
    await page.getByLabel('Email').fill('user@sihat.local')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Sign in to choose an exercise' }).click()
    await page.waitForTimeout(400)

    // Start reaction speed exercise
    await page.locator('article', { hasText: 'Reaction speed' }).getByRole('button', { name: 'Start exercise' }).click()
    await page.waitForTimeout(400)

    // Capture active runner stage
    await page.screenshot({
      path: path.join(OUT_DIR, '03-runner-stage-active-1440.png'),
    })

    // Complete the exercise
    await page.getByRole('button', { name: 'Start reaction timing' }).click()
    await page.getByRole('button', { name: 'Respond now' }).click({ timeout: 2000 })
    await page.getByRole('button', { name: 'Complete exercise' }).click()
    await page.waitForTimeout(400)

    // Capture completion & privacy choice screen
    await page.screenshot({
      path: path.join(OUT_DIR, '03-runner-completion-privacy-choice-1440.png'),
    })
  })

  test('captures Results History & Compatible Comparison Modal', async ({ page }) => {
    await page.route('http://127.0.0.1:8000/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/auth/login') return route.fulfill({ json: { access_token: 'valid-test-token' } })
      if (path === '/me/profile') return route.fulfill({ json: { id: 'u1', email: 'user@sihat.local', role: 'user', age_group: '18_plus' } })
      if (path === '/results/history') {
        return route.fulfill({
          json: [
            {
              id: 'res-1',
              test_slug: 'contrast-sensitivity',
              test_type: 'digital_check',
              test_title: 'Contrast Sensitivity Check',
              methodology_name: 'Screen Contrast Method',
              methodology_version: '1.2',
              definition_version: '1.0',
              compatibility_conditions: { device: 'standard', illuminance: 'stable' },
              result: { score: '10/12', threshold_pct: '1.8%' },
              limitations: 'Standard room illumination requirement confirmed.',
              warnings: ['Non-clinical metric.'],
              completed_at: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: 'res-2',
              test_slug: 'contrast-sensitivity',
              test_type: 'digital_check',
              test_title: 'Contrast Sensitivity Check',
              methodology_name: 'Screen Contrast Method',
              methodology_version: '1.2',
              definition_version: '1.0',
              compatibility_conditions: { device: 'standard', illuminance: 'stable' },
              result: { score: '11/12', threshold_pct: '1.5%' },
              limitations: 'Standard room illumination requirement confirmed.',
              warnings: ['Non-clinical metric.'],
              completed_at: new Date().toISOString(),
            },
          ],
        })
      }
      if (path === '/results/res-2/compare') {
        return route.fulfill({
          json: {
            base_result: { id: 'res-2' },
            results: [
              { id: 'res-1', completed_at: new Date(Date.now() - 86400000).toISOString(), result: { score: '10/12', threshold: '1.8%' } },
              { id: 'res-2', completed_at: new Date().toISOString(), result: { score: '11/12', threshold: '1.5%' } },
            ],
            compatibility_rule: 'same test, methodology version (v1.2), and display calibrated ambient conditions',
          },
        })
      }
      return route.fulfill({ status: 404, json: { detail: 'Not found' } })
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByLabel('Email').fill('user@sihat.local')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Sign in to choose an exercise' }).click()

    await page.getByRole('button', { name: 'My History & PDF' }).click()
    await page.waitForTimeout(400)

    // Capture History table
    await page.screenshot({
      path: path.join(OUT_DIR, '04-history-table-1440.png'),
    })

    // Trigger comparison and capture modal
    await page.getByRole('button', { name: 'Compare' }).first().click()
    await page.waitForTimeout(400)
    await page.screenshot({
      path: path.join(OUT_DIR, '04-history-compatible-comparison-modal-1440.png'),
    })
  })

  test('captures Gemini AI Assistant and Auth Modal', async ({ page }) => {
    await page.route('http://127.0.0.1:8000/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/assistant/message') {
        return route.fulfill({
          json: {
            message: 'Hello! I am your SIHAT AI Navigator. I can explain sensory check protocols, answer questions about methodology passports, and recommend non-invasive assessments.',
            provider_available: true,
            actions: [{ name: 'open_catalog', arguments: {}, requires_confirmation: false }],
          },
        })
      }
      return route.fulfill({ status: 404, json: { detail: 'Not found' } })
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    // Open Gemini Assistant launcher
    await page.getByRole('button', { name: 'Ask SIHAT' }).click()
    await page.waitForTimeout(400)
    await page.getByLabel('Message SIHAT assistant').fill('How do contrast checks correlate with code fatigue?')
    await page.getByRole('button', { name: 'Send' }).click()
    await page.waitForTimeout(500)

    // Capture Gemini Assistant Panel
    await page.screenshot({
      path: path.join(OUT_DIR, '05-gemini-ai-assistant-panel-1440.png'),
    })

    // Close assistant
    await page.getByRole('button', { name: '✕' }).click()
    await page.waitForTimeout(200)

    // Open Auth Modal
    await page.getByRole('button', { name: 'Sign In / Sign Up' }).click()
    await page.waitForTimeout(400)

    // Capture Auth Modal
    await page.screenshot({
      path: path.join(OUT_DIR, '06-auth-modal-login-1440.png'),
    })
  })

  test('captures Admin Dashboard and Telemetry Console in Light and Dark', async ({ page }) => {
    await page.route('http://127.0.0.1:8000/**', async (route) => {
      const path = new URL(route.request().url())
      if (path.pathname === '/auth/login') return route.fulfill({ json: { access_token: 'admin-jwt-token' } })
      if (path.pathname === '/me/profile') return route.fulfill({ json: { id: 'admin-1', email: 'admin@sihat.local', role: 'admin', age_group: '18_plus' } })
      if (path.pathname === '/admin/dashboard') {
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
      if (path.pathname === '/admin/users') {
        return route.fulfill({
          json: [
            { id: 'u1', email: 'user1@example.com', role: 'user', age_group: '18_plus', is_active: true },
            { id: 'admin-1', email: 'admin@sihat.local', role: 'admin', age_group: '18_plus', is_active: true },
          ],
        })
      }
      if (path.pathname === '/admin/support/tickets') {
        return route.fulfill({
          json: [
            { id: 't1', contact_email: 'visitor@example.com', subject: 'Inquiry on optical checks', message: 'Is screen calibration certified for external displays?', status: 'open' },
          ],
        })
      }
      if (path.pathname === '/admin/tests') {
        return route.fulfill({
          json: [
            {
              id: 'tst1',
              slug: 'reaction-speed',
              type: 'educational_exercise',
              status: 'published',
              guest_allowed: true,
              min_age: 16,
              methodology: { name: 'Simple Sensorimotor Latency', version: '1.0' },
            },
          ],
        })
      }
      return route.fulfill({ status: 404, json: { detail: 'Not found' } })
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByLabel('Email').fill('admin@sihat.local')
    await page.getByLabel('Password').fill('adminpassword')
    await page.getByRole('button', { name: 'Sign in to choose an exercise' }).click()

    await page.getByRole('button', { name: 'Admin Panel' }).click()
    await page.waitForTimeout(500)

    // Capture Admin Dashboard in Light Theme
    await page.screenshot({
      path: path.join(OUT_DIR, '07-admin-dashboard-light-1440.png'),
    })

    // Toggle Dark Mode and capture Admin Dashboard
    await page.getByRole('button', { name: /Dark/i }).click()
    await page.waitForTimeout(400)
    await page.screenshot({
      path: path.join(OUT_DIR, '07-admin-dashboard-dark-1440.png'),
    })
  })
})
