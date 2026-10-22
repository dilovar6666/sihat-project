from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from sihat.content_seed import seed_content
from sihat.db import Base
from sihat.models import FaqItem, KnowledgeArticle


def test_content_seed_creates_faqs_and_articles_idempotently() -> None:
    engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        faqs, articles = seed_content(session)
        assert faqs == 3
        assert articles == 2
        assert session.scalar(select(func.count()).select_from(FaqItem)) == 3
        assert session.scalar(select(func.count()).select_from(KnowledgeArticle)) == 2

        # Second run should add 0
        faqs_again, articles_again = seed_content(session)
        assert faqs_again == 0
        assert articles_again == 0
    Base.metadata.drop_all(engine)
    engine.dispose()
