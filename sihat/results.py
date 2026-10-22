"""Owner-only saved result history, comparison, deletion, and small PDF exports."""

from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from sihat.attempt_schemas import ComparisonOutput, PdfExportInput, SavedResultOutput
from sihat.auth import get_current_user
from sihat.db import get_db_session
from sihat.models import SavedResult, TestAttempt, User

router = APIRouter(tags=["results"])


def _result_output(item: SavedResult) -> SavedResultOutput:
    return SavedResultOutput(
        id=item.id,
        test_slug=item.test_slug,
        test_type=item.test_type,
        test_title=item.test_title,
        methodology_name=item.methodology_name,
        methodology_version=item.methodology_version,
        definition_version=item.definition_version,
        compatibility_conditions=item.compatibility_conditions,
        result=item.result,
        limitations=item.limitations,
        warnings=item.warnings,
        completed_at=item.completed_at.isoformat(),
    )


def _owned_saved_result(db: Session, result_id: str, user: User) -> SavedResult:
    item = db.get(SavedResult, result_id)
    if not item or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Result was not found")
    return item


@router.post("/attempts/{attempt_id}/save", response_model=SavedResultOutput, status_code=201)
def save_completed_attempt(
    attempt_id: str,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> SavedResultOutput:
    attempt = db.get(TestAttempt, attempt_id)
    if not attempt or attempt.user_id != user.id:
        raise HTTPException(status_code=404, detail="Attempt was not found")
    if attempt.status != "completed" or not attempt.completed_at or attempt.result is None:
        raise HTTPException(status_code=409, detail="Only a completed attempt can be saved")
    if attempt.save_consent is False:
        raise HTTPException(status_code=409, detail="This attempt was marked not to save")
    snapshot = attempt.definition_snapshot.get("result_context", {})
    if not isinstance(snapshot, dict):
        raise HTTPException(status_code=409, detail="Attempt result context is unavailable")
    saved = SavedResult(
        id=attempt.id,
        user_id=user.id,
        test_id=attempt.test_id,
        test_slug=str(snapshot["test_slug"]),
        test_type=str(snapshot["test_type"]),
        test_title=str(snapshot["test_title"]),
        methodology_name=str(snapshot["methodology_name"]),
        methodology_version=str(snapshot["methodology_version"]),
        definition_version=attempt.definition_version,
        compatibility_conditions=dict(snapshot["compatibility_conditions"]),
        result=dict(attempt.result),
        answers=dict(attempt.answers),
        limitations=str(snapshot["limitations"]),
        warnings=list(snapshot["warnings"]),
        completed_at=attempt.completed_at,
    )
    db.add(saved)
    db.delete(attempt)
    db.commit()
    db.refresh(saved)
    return _result_output(saved)


@router.post("/attempts/{attempt_id}/do-not-save", status_code=status.HTTP_204_NO_CONTENT)
def do_not_save_completed_attempt(
    attempt_id: str,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> None:
    attempt = db.get(TestAttempt, attempt_id)
    if not attempt or attempt.user_id != user.id:
        raise HTTPException(status_code=404, detail="Attempt was not found")
    if attempt.status != "completed":
        raise HTTPException(status_code=409, detail="Only a completed attempt can be discarded")
    if db.get(SavedResult, attempt.id):
        raise HTTPException(status_code=409, detail="Saved results cannot be changed")
    attempt.save_consent = False
    db.delete(attempt)
    db.commit()


@router.get("/results/history", response_model=list[SavedResultOutput])
def history(
    db: Session = Depends(get_db_session), user: User = Depends(get_current_user)
) -> list[SavedResultOutput]:
    items = db.scalars(
        select(SavedResult)
        .where(SavedResult.user_id == user.id)
        .order_by(SavedResult.completed_at.desc(), SavedResult.id.desc())
    ).all()
    return [_result_output(item) for item in items]


@router.get("/results/{result_id}/compare", response_model=ComparisonOutput)
def compare_compatible_results(
    result_id: str,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> ComparisonOutput:
    selected = _owned_saved_result(db, result_id, user)
    items = db.scalars(
        select(SavedResult)
        .where(
            SavedResult.user_id == user.id,
            SavedResult.test_id == selected.test_id,
            SavedResult.methodology_version == selected.methodology_version,
            SavedResult.definition_version == selected.definition_version,
        )
        .order_by(SavedResult.completed_at)
    ).all()
    compatible = [
        item for item in items if item.compatibility_conditions == selected.compatibility_conditions
    ]
    return ComparisonOutput(
        test_slug=selected.test_slug,
        methodology_version=selected.methodology_version,
        definition_version=selected.definition_version,
        compatibility_conditions=selected.compatibility_conditions,
        results=[_result_output(item) for item in compatible],
    )


@router.delete("/results/history", status_code=status.HTTP_204_NO_CONTENT)
def delete_history(
    db: Session = Depends(get_db_session), user: User = Depends(get_current_user)
) -> None:
    db.execute(delete(SavedResult).where(SavedResult.user_id == user.id))
    db.commit()


@router.delete("/results/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_result(
    result_id: str,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> None:
    db.delete(_owned_saved_result(db, result_id, user))
    db.commit()


def _pdf_bytes(lines: list[str]) -> bytes:
    """A dependency-free PDF foundation containing plain, user-selected text fields."""
    safe_lines = [line.encode("latin-1", "replace").decode("latin-1") for line in lines]
    stream_lines = ["BT", "/F1 11 Tf", "50 760 Td"]
    for index, line in enumerate(safe_lines):
        if index:
            stream_lines.append("0 -16 Td")
        escaped = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        stream_lines.append("(" + escaped + ") Tj")
    stream_lines.append("ET")
    content = "\n".join(stream_lines).encode("latin-1")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
        ),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n" + content + b"\nendstream",
    ]
    output = BytesIO()
    output.write(b"%PDF-1.4\n")
    offsets = [0]
    for index, item in enumerate(objects, start=1):
        offsets.append(output.tell())
        output.write(f"{index} 0 obj\n".encode() + item + b"\nendobj\n")
    xref = output.tell()
    output.write(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]:
        output.write(f"{offset:010d} 00000 n \n".encode())
    trailer = f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n"
    output.write(trailer.encode())
    return output.getvalue()


@router.post("/results/{result_id}/pdf")
def export_pdf(
    result_id: str,
    payload: PdfExportInput,
    db: Session = Depends(get_db_session),
    user: User = Depends(get_current_user),
) -> Response:
    item = _owned_saved_result(db, result_id, user)
    lines = [
        "SIHAT result record",
        f"Date: {item.completed_at.isoformat()}",
        f"Test: {item.test_title}",
        f"Type: {item.test_type}",
        "This record is not a diagnosis.",
    ]
    if payload.include_result:
        lines.append(f"Result: {item.result}")
    if payload.include_methodology:
        lines.extend(
            [
                f"Methodology: {item.methodology_name}",
                f"Version: {item.methodology_version}",
            ]
        )
    if payload.include_limitations:
        lines.append(f"Limitations: {item.limitations}")
    if payload.include_warnings:
        lines.append(f"Warnings: {', '.join(item.warnings) or 'None recorded'}")
    if payload.include_answers:
        lines.append(f"Answers included by user request: {item.answers}")
    filename = f"sihat-result-{item.id}.pdf"
    return Response(
        content=_pdf_bytes(lines),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
