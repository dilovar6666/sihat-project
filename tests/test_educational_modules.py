from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from sihat.catalog_seed import seed_catalog
from sihat.db import Base
from sihat.educational_modules import EDUCATIONAL_SLUGS, install_educational_modules
from sihat.models import MethodologyPassport, Questionnaire, TestDefinition


def test_all_educational_modules_have_a_safe_published_definition() -> None:
    engine = create_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        seed_catalog(session)
        assert install_educational_modules(session) == len(EDUCATIONAL_SLUGS)
        for slug in EDUCATIONAL_SLUGS:
            test = session.scalar(select(TestDefinition).where(TestDefinition.slug == slug))
            assert test is not None
            assert test.availability_status == "published"
            assert test.test_type == "educational_exercise"
            questionnaire = session.scalar(
                select(Questionnaire).where(Questionnaire.test_id == test.id)
            )
            assert questionnaire is not None and questionnaire.is_published
            passport = session.scalar(
                select(MethodologyPassport).where(MethodologyPassport.test_id == test.id)
            )
            assert passport is not None and passport.evidence_status == "educational"
    Base.metadata.drop_all(engine)
    engine.dispose()
