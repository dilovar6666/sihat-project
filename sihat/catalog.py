from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from sihat.auth import get_current_user, get_current_user_optional
from sihat.catalog_schemas import CategoryInput, PassportInput, QuestionnaireInput, TestInput
from sihat.db import get_db_session
from sihat.models import Category, MethodologyPassport, Questionnaire, TestDefinition, User

router = APIRouter(tags=["catalog"])
admin_router = APIRouter(prefix="/admin", tags=["admin"])
LANGUAGES = {"ru", "tg", "en"}


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required",
        )
    return user


def _validate_localizations(localizations: dict[str, dict[str, str]]) -> None:
    if not LANGUAGES.issubset(localizations):
        raise HTTPException(status_code=422, detail="Localizations must include ru, tg, and en")
    if any(not value.get("title") for value in localizations.values()):
        raise HTTPException(status_code=422, detail="Each localization must include a title")


def _category_output(category: Category) -> dict:
    return {"id": category.id, "slug": category.slug, "localizations": category.localizations}


def _test_output(test: TestDefinition, passport: MethodologyPassport | None) -> dict:
    return {
        "id": test.id,
        "category_id": test.category_id,
        "slug": test.slug,
        "type": test.test_type,
        "status": test.availability_status,
        "guest_allowed": test.guest_allowed,
        "min_age": test.min_age,
        "max_age": test.max_age,
        "localizations": test.localizations,
        "methodology": None
        if passport is None
        else {
            "name": passport.methodology_name,
            "version": passport.methodology_version,
            "evidence_status": passport.evidence_status,
            "source": passport.evidence_source,
            "limitations": passport.limitations,
            "warnings": passport.warnings,
        },
    }


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db_session)) -> list[dict]:
    categories = (
        await db.scalars(
            select(Category)
            .where(Category.is_active.is_(True))
            .order_by(Category.sort_order, Category.slug)
        )
    ).all()
    return [_category_output(category) for category in categories]


@router.get("/tests")
async def list_tests(
    category: str | None = None,
    query: str | None = Query(default=None, min_length=2, max_length=100),
    age: int | None = Query(default=None, ge=0, le=120),
    db: AsyncSession = Depends(get_db_session),
    user: User | None = Depends(get_current_user_optional),
) -> list[dict]:
    statement = select(TestDefinition).where(TestDefinition.availability_status == "published")
    if user is None:
        statement = statement.where(TestDefinition.guest_allowed.is_(True))
    if category:
        statement = statement.join(Category).where(Category.slug == category)
    if age is not None:
        statement = statement.where(TestDefinition.min_age <= age).where(
            or_(TestDefinition.max_age.is_(None), TestDefinition.max_age >= age)
        )
    tests = (await db.scalars(statement.order_by(TestDefinition.slug))).all()
    passports = {
        item.test_id: item for item in (await db.scalars(select(MethodologyPassport))).all()
    }
    if query:
        query = query.casefold()
        tests = [test for test in tests if query in str(test.localizations).casefold()]
    return [_test_output(test, passports.get(test.id)) for test in tests]


@router.get("/tests/{slug}")
async def get_test(
    slug: str,
    db: AsyncSession = Depends(get_db_session),
    user: User | None = Depends(get_current_user_optional),
) -> dict:
    statement = select(TestDefinition).where(
        TestDefinition.slug == slug,
        TestDefinition.availability_status == "published",
    )
    if user is None:
        statement = statement.where(TestDefinition.guest_allowed.is_(True))
    test = await db.scalar(statement)
    if not test:
        raise HTTPException(status_code=404, detail="Test is unavailable")
    passport = await db.scalar(
        select(MethodologyPassport).where(MethodologyPassport.test_id == test.id)
    )
    return _test_output(test, passport)


@admin_router.post("/categories", status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryInput,
    db: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> dict:
    _validate_localizations(payload.localizations)
    if await db.scalar(select(Category.id).where(Category.slug == payload.slug)):
        raise HTTPException(status_code=409, detail="Category slug already exists")
    category = Category(**payload.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return _category_output(category)


@admin_router.post("/tests", status_code=status.HTTP_201_CREATED)
async def create_test(
    payload: TestInput,
    db: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> dict:
    _validate_localizations(payload.localizations)
    if payload.max_age is not None and payload.max_age < payload.min_age:
        raise HTTPException(status_code=422, detail="max_age cannot be lower than min_age")
    if not await db.get(Category, payload.category_id):
        raise HTTPException(status_code=404, detail="Category was not found")
    if await db.scalar(select(TestDefinition.id).where(TestDefinition.slug == payload.slug)):
        raise HTTPException(status_code=409, detail="Test slug already exists")
    test = TestDefinition(**payload.model_dump())
    db.add(test)
    await db.commit()
    await db.refresh(test)
    return _test_output(test, None)


@admin_router.put("/tests/{test_id}/methodology")
async def upsert_methodology(
    test_id: str,
    payload: PassportInput,
    db: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> dict:
    if not await db.get(TestDefinition, test_id):
        raise HTTPException(status_code=404, detail="Test was not found")
    passport = await db.scalar(
        select(MethodologyPassport).where(MethodologyPassport.test_id == test_id)
    )
    if passport:
        for key, value in payload.model_dump().items():
            setattr(passport, key, value)
    else:
        passport = MethodologyPassport(test_id=test_id, **payload.model_dump())
        db.add(passport)
    await db.commit()
    return {"test_id": test_id, "evidence_status": passport.evidence_status}


@admin_router.put("/tests/{test_id}/questionnaire")
async def upsert_questionnaire(
    test_id: str,
    payload: QuestionnaireInput,
    db: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> dict:
    if not await db.get(TestDefinition, test_id):
        raise HTTPException(status_code=404, detail="Test was not found")
    if any(
        "id" not in question or "localizations" not in question for question in payload.questions
    ):
        raise HTTPException(
            status_code=422,
            detail="Each questionnaire question requires an id and localizations",
        )
    questionnaire = await db.scalar(
        select(Questionnaire).where(Questionnaire.test_id == test_id)
    )
    if questionnaire:
        for key, value in payload.model_dump().items():
            setattr(questionnaire, key, value)
    else:
        questionnaire = Questionnaire(test_id=test_id, **payload.model_dump())
        db.add(questionnaire)
    await db.commit()
    return {"test_id": test_id, "version": questionnaire.definition_version}


@admin_router.post("/tests/{test_id}/publish")
async def publish_test(
    test_id: str,
    db: AsyncSession = Depends(get_db_session),
    _: User = Depends(require_admin),
) -> dict:
    test = await db.get(TestDefinition, test_id)
    passport = await db.scalar(
        select(MethodologyPassport).where(MethodologyPassport.test_id == test_id)
    )
    if not test or not passport:
        raise HTTPException(
            status_code=409,
            detail="A methodology passport is required before publication",
        )
    _validate_localizations(test.localizations)
    if passport.evidence_status == "pending_review":
        raise HTTPException(status_code=409, detail="Methodology is pending review")
    if passport.evidence_status == "validated" and (
        not passport.evidence_source or not passport.license_info
    ):
        raise HTTPException(
            status_code=409, detail="Validated methodology requires source and license information"
        )
    test.availability_status = "published"
    questionnaire = await db.scalar(select(Questionnaire).where(Questionnaire.test_id == test.id))
    if questionnaire:
        questionnaire.is_published = True
    await db.commit()
    return _test_output(test, passport)
