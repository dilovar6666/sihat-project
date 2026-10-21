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

4. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL database.
5. Run the API with `uvicorn sihat.main:app --reload`.
6. Open `/docs` for OpenAPI. `/health` is independent of the database.

## Checks

```powershell
ruff check .
pytest
alembic upgrade head
```

PostgreSQL, OAuth credentials, mail delivery, Gemini credentials, and a GitHub remote
are intentionally not bundled. Configure them through environment variables when the
corresponding stages are implemented.

