# SIHAT

SIHAT (Сиҳат) is an API-first platform for carefully bounded health screenings,
questionnaires, interactive exercises, and symptom information. It does not diagnose
conditions or prescribe treatment.

## Stage 1 local setup

1. Install Python 3.12 or newer.
2. Create and activate a virtual environment.
3. Install the project and test dependencies:

   ```powershell
   python -m pip install -e ".[test]"
   ```

4. Copy `.env.example` to `.env`, then set `DATABASE_URL` and a random `JWT_SECRET`.
5. Run the API with `uvicorn sihat.main:app --reload`.
6. Open `/docs` for OpenAPI. `/health` is independent of the database.

## Checks

```powershell
ruff check .
pytest
alembic upgrade head
```

PostgreSQL, the Google OAuth client ID, mail delivery, and Gemini credentials are
intentionally not bundled. Configure them through environment variables when the
corresponding stages are implemented.

## Authentication currently available

Email/password registration and login issue a short-lived bearer access token plus a
rotating refresh token. The API exposes refresh, logout, current-profile, and reset
password endpoints. Google sign-in receives an Identity Services ID token at
`POST /auth/google`; only `GOOGLE_OAUTH_CLIENT_ID` is required. Password-reset email
delivery uses the configured SMTP provider and never logs or returns the reset token.
Registration, login, Google sign-in, and password-reset requests are rate limited.

## Results and privacy

A completed attempt remains temporary until the signed-in owner chooses **Save** or
**Do not save**. `Save` creates an immutable owner-only record and removes the
temporary attempt. `Do not save` deletes the completed attempt and its answers.
Expired temporary attempts are deleted when accessed.

The owner can use these authenticated API endpoints:

- `GET /results/history` — list saved results without raw answers.
- `GET /results/{result_id}/compare` — compare only records with the same test,
  methodology version, definition version, and recorded device conditions.
- `DELETE /results/{result_id}` and `DELETE /results/history` — delete one result
  or the complete history.
- `POST /results/{result_id}/pdf` — download a field-selectable PDF record. It
  always states that the result is not a diagnosis and contains no health percentage.

The API reference at `/docs` contains the request and response schemas, including
`POST /attempts/{attempt_id}/save` and `POST /attempts/{attempt_id}/do-not-save`.
