from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from sihat.catalog_seed import seed_catalog
from sihat.db import Base
from sihat.models import Category, MethodologyPassport
from sihat.models import TestDefinition as CatalogTest


def test_catalog_seed_creates_exactly_ten_categories_and_thirty_draft_tests() -> None:
    engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        assert seed_catalog(session) == (10, 30)
        assert session.scalar(select(func.count()).select_from(Category)) == 10
        assert session.scalar(select(func.count()).select_from(CatalogTest)) == 30
        assert session.scalar(select(func.count()).select_from(MethodologyPassport)) == 30
        assert seed_catalog(session) == (0, 0)
    Base.metadata.drop_all(engine)
    engine.dispose()
