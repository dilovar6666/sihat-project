# SIHAT — Comprehensive Product, UX, and Architectural Audit

**Audit Date:** 2026-10-29  
**Platform:** SIHAT (Understand Your Health)  
**Stack:** FastAPI, SQLAlchemy 2.0 (Async), PostgreSQL / asyncpg, Alembic, React 19, TypeScript, Vite, Gemini AI  
**Scope:** Clinical UX, Security, Concurrency, Multilingual Support (RU / TJ / EN), Mobile Responsiveness, Admin Operations, and Architecture  

---

## 1. Executive Summary

SIHAT is an evidence-based self-monitoring and cognitive-sensory screening platform designed for Central Asia (with native Russian, Tajik, and English localization). Following the Phase 1 & 2 full asynchronous backend refactoring, the platform now operates on an asynchronous SQLAlchemy 2.0 / `asyncpg` engine with non-blocking I/O, concurrency protection on attempt completion, and robust rate limiting.

This comprehensive audit evaluates the platform through 14 real-world user journeys and identifies gaps across reliability, user experience, medical safety, and administrative workflows.

---

## 2. Real-World User Scenarios Assessment

| Scenario | Experience Analysis | Severity |
|---|---|---|
| **First-time visitor** | Clean landing page and bento grid, but lacks a quick 60-second interactive onboarding/tour explaining Zero-Retention and how tests work. | P2 |
| **Quick test discovery** | Category filtering and search work well, but users benefit from symptom-to-test instant filter chips (e.g., "Устали глаза" -> Landolt C). | P1 |
| **Mobile user (375px)** | Some test canvases (Schulte 5x5, Corsi blocks) require strict responsive touch targets (minimum 44x44px) and prevent page scrolling during interactive trials. | P1 |
| **Interrupted test / reload** | If a user refreshes the page mid-test, local React state resets; attempt recovery via `sessionStorage` and `/attempts/{id}/current` is needed to resume gracefully. | P0 |
| **Result comprehension** | Raw numerical scores (e.g., "240 ms") are displayed, but users need clear percentile bands, qualitative feedback ("Выше среднего"), and non-diagnostic explanations. | P1 |
| **Comparing two attempts** | History view exists, but lacks an inline visual delta comparison (e.g., "Время реакции улучшилось на 15 мс по сравнению с 22 октября"). | P1 |
| **Data deletion (Zero-Retention)** | Option "Do not save" works on completion. One-click "Purge All History" works. Immediate visual confirmation toast is essential. | P1 |
| **Medical terminology clarity** | Tooltips or inline popovers explaining clinical terms (e.g. "Циркадианный ритм", "Селективное внимание", "Ингибиторный контроль") are needed. | P2 |
| **Loss of internet during test** | When connection drops, network fetch throws an unhandled error. Need an offline indicator and safe retry for answer submissions. | P1 |
| **Doctor handoff / PDF report** | PDF generation exists via ReportLab. Must ensure patient-friendly header, ISO disclaimer, and physician notes field. | P1 |
| **Screen reader / Accessibility** | Need `aria-live` regions for dynamic test countdowns, high-contrast focus rings, and proper keyboard navigation (tabbing across options). | P2 |
| **Expired access token (JWT)** | If access token expires during browsing, API requests throw 401. Silent refresh via `/auth/refresh` must seamlessly rotate tokens without logging out. | P0 |
| **Admin spam/user moderation** | Admin dashboard has user listing and status toggle (Active/Blocked). Needs instant filter by email/status and role escalation. | P1 |
| **Clinical methodology verification** | Methodology modal displays passport details, evidence status, and limitations. Needs clear link to scientific bibliography. | P2 |

---

## 3. Prioritized Action Matrix

### P0 — Blocking Bugs & Critical Gaps (Must fix immediately)

1. **Silent JWT Token Refresh in Frontend Client:**
   - **Issue:** In `frontend/src/api.ts`, when the 15-30 min JWT access token expires, API requests fail with 401 and throw unhandled errors, forcing the user to log in again mid-session or mid-test.
   - **Resolution:** Implement automatic token refresh queue in `apiRequest()` using the stored `refreshToken`. On 401, call `/auth/refresh`, rotate tokens in memory/storage, and seamlessly retry the original request.

2. **Mid-Test Interruption & State Recovery:**
   - **Issue:** If an authenticated user accidentally reloads the page or loses connectivity while answering a multi-step test, the in-memory React state is lost.
   - **Resolution:** Persist active attempt ID in `sessionStorage`. On test runner mount, detect active attempt, query `/attempts/{id}/current` or `/attempts/{id}/resume`, and restore progress.

---

### P1 — High-Priority Functional & UX Improvements

1. **Offline & Network Resilience:**
   - Add a global `Online/Offline` listener in React (`window.addEventListener('offline')`).
   - Show a non-intrusive banner: "⚠️ Соединение с сервером нестабильно. Ответы сохраняются в локальном буфере."
   - Implement exponential backoff retry in `apiRequest()` for network failures.

2. **Doctor Handoff & PDF Enhancements:**
   - Verify PDF export displays clean formatting, timestamp, methodology disclaimer ("Не является медицинским диагнозом"), and doctor review section.
   - Ensure download triggers properly on iOS Safari and Android Chrome without popup blockers.

3. **Responsive Mobile Ergonomics (375px+):**
   - Ensure Schulte Table, Corsi Blocks, and Landolt C containers fit comfortably within a 375px mobile screen width without horizontal overflow.
   - Set touch action `touch-action: manipulation` to prevent double-tap zoom delay on mobile reaction tests.

4. **Detailed Knowledge Article Modal:**
   - Provide a full-screen or slide-over drawer when clicking an article in the Knowledge Base, rendering the complete text, references, and related screening tests.

5. **Toast Notifications & Error Boundaries:**
   - Wrap application tree in a React Error Boundary with fallback UI to prevent white-screen crashes if an unexpected rendering exception occurs.
   - Add centralized toast notifications for copy-to-clipboard, test completion, and network warnings.

---

### P2 — Usability & Polish

1. **Interactive Clinical Tooltips:**
   - Add hover/tap info badges next to metrics like "Ингибиторный контроль (Go/No-Go)", "Pelli-Robson", "Landolt C" explaining what is being assessed.
2. **Result Trend & Delta Indicator:**
   - In the History tab, display comparison chips (`▲ 12% faster`, `▼ 2 pts`) when multiple attempts of the same test exist.
3. **Sound Test Calibration Step:**
   - For Tonal Audiometry and Speech-in-Noise, add an initial volume check screen with a sample tone to verify headphone stereo separation.

---

### P3 — Long-Term & Architectural Roadmap

1. **Web Workers for High-Precision Audio/Visual Timing:**
   - Offload reaction time timers and tone generation to a dedicated Web Worker to eliminate main-thread UI jank interference.
2. **PWA (Progressive Web App) Offline Screening:**
   - Service Worker caching of test assets, Landolt rings, and audio stimuli so users in remote rural clinics can complete screenings completely offline and sync upon reconnecting.
3. **FHIR / HL7 Export Standard:**
   - Export structured screening records compatible with hospital EHR systems.
