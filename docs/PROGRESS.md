# SIHAT progress

## Current stage

**Stage 5 — Results and privacy: technically complete**

## Stage 5 implementation

- Completed attempts require an explicit `Save` or `Do not save` choice in the
  API and technical React runner. Until that choice, result and answers remain
  only in the temporary attempt.
- Saving creates an immutable `saved_results` record owned by the authenticated
  user and removes the temporary attempt. Declining deletes the temporary result
  and answers immediately. Attempts still expire after the configured retention
  period and are deleted when accessed.
- Owner-only history, single-result deletion, full-history deletion, compatible
  comparison, and PDF export endpoints are available. Unknown or another user's
  result identifiers return 404, preventing IDOR disclosure.
- Comparison requires the same test, methodology version, definition version, and
  recorded device conditions. It never produces an aggregate health score.
- The PDF foundation supports user-selected result, methodology, limitations,
  warnings, and optional answer fields. Every export carries a non-diagnostic
  statement and does not invent a health percentage.

## Stage 5 verification

- Ruff check and formatting check pass.
- Pytest passes 21 tests, including consent, temporary deletion, ownership,
  immutable-result surface, history deletion, compatibility, and PDF coverage.
- Local PostgreSQL was upgraded through Alembic revision `0008_saved_results`.
- Vite production build and Playwright exercise flow pass, including explicit save
  consent.

## Stage 4 verification

- Temporary authenticated attempts support start, sanitized questions, branching, resume,
  discard, completion, expiry, consent choice, and immutable completed attempts.
- Fifteen educational activities are available through the technical React runner; their
  results describe activity performance only and never diagnose a condition.
- Symptom triage endpoints remain explicitly blocked until clinician-approved rules are
  recorded.
- Ruff passes, pytest passes 18 tests, Playwright passes the exercise flow, the Vite
  production build passes, and PostgreSQL is at Alembic revision `0007_expand_attempts`.

## Evidence

- Repository audit completed on 2026-10-21.
- Initial workspace contained the specification and logo asset only; no Git metadata,
  application source, tests, or environment configuration existed.
- Python 3.14.6 and Node 24.19.0 are available. Docker and the PostgreSQL CLI are not
  available in the current environment.
- GitHub remote is configured for `https://github.com/dilovar6666/sihat-project`.

## Stage 1 implementation

- FastAPI application with generated OpenAPI and a database-independent `/health`
  endpoint.
- Environment-driven settings and PostgreSQL SQLAlchemy/Alembic configuration.
- Pytest and Ruff configuration, initial health/OpenAPI tests, and CI workflow.
- Reproducible setup instructions and a ten-stage implementation plan.
- Baseline Alembic revision to establish migration history before domain tables arrive.

## Verification

- Ruff: passed (`All checks passed!`).
- Pytest: passed, 2 tests (`health` and OpenAPI), with one upstream Starlette/httpx
  deprecation warning.
- Alembic offline SQL generation: passed.
- Live `alembic upgrade head`: passed against the local PostgreSQL 16 `sihat`
  database and applied baseline revision `0001_initial_schema`.
- The standard pytest/Alembic launcher reported an inaccessible base interpreter in
  this managed environment; invoking the installed modules through the workspace
  interpreter's Python API completed successfully.

## Stage 1 result

- Acceptance criteria currently available in the local environment have passed.

## Stage 2 implementation

- Email/password registration and login with Argon2 password hashing.
- Exactly two persisted roles: `user` and `admin`; public registration always creates
  a `user` account.
- Short-lived JWT access tokens, hashed rotating refresh tokens, logout/revocation,
  and authenticated profile access.
- Password-reset token persistence, expiry, single-use semantics, and session
  invalidation after a successful reset.
- Google Identity Services ID-token verification and subject-to-user links without a
  redirect URI or a browser-visible server secret.
- SMTP password-reset delivery with a one-hour, single-use token; tokens are neither
  returned by the API nor written to logs.
- In-memory rate limiting for registration, login, Google sign-in/linking, and reset
  requests.

## Stage 2 verification

- Ruff and formatting pass; pytest passes 12 auth, health, CORS, Google identity,
  reset-delivery, and rate-limit scenarios.
- PostgreSQL migration `0003_google_identities` is applied locally.
- SMTP TLS/authentication succeeded without sending a message.
- Google credentials are configured. A browser E2E sign-in requires the Stage 8 React
  client to obtain an actual Google ID token; backend signature/claim behavior is
  covered with controlled provider responses.

## Stage 3 implementation

- Categories, test definitions, and methodology passports with explicit evidence,
  language, device, scoring, limitation, and warning fields.
- Public catalog endpoints expose only published tests allowed for guests and matching
  their requested age filter.
- Admin-only CRUD creates draft content and permits publication only after a passport;
  pending-review modules cannot be published, and validated modules require source and
  license information.
- A repeatable seed routine created the ten agreed categories and 30 draft cards with
  `pending_review` passports in the local database.
- Versioned questionnaire definitions now store localized question data, branching
  rules, and declarative scoring configuration without executing arbitrary formulas.

## Content publication blockers

- Record methodology passports and evidence decisions for every module before public
  publication.
- Review each draft's RU/TJ/EN copy and replace the seed labels with approved content.

The catalog, filters, age/guest rules, admin authoring API, questionnaire storage, and
publication gate are complete. The 30 seeded modules remain drafts until their
methodology, licensing, translations, and medical review are recorded; Stage 3 does
not represent those modules as medically validated or publicly available.

See `docs/METHODOLOGY_AUDIT.md` for the all-30 status table. Fifteen original,
device-limited exercises may be developed only as educational modules; the remaining
fifteen require an approved clinical source, licensing decision, or expert-reviewed
triage rule before any public screening claim.
