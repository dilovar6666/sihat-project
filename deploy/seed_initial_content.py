"""Idempotently load SIHAT's bundled public catalog and content after migrations."""

from sihat.catalog_seed import seed_catalog
from sihat.content_seed import seed_content
from sihat.db import SessionLocal

with SessionLocal() as session:
    categories, tests = seed_catalog(session)
    faqs, articles = seed_content(session)

print(
    f"Seed complete: categories={categories}, tests={tests}, faqs={faqs}, articles={articles}"
)
