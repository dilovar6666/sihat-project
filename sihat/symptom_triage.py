"""Safe extension point for clinician-approved symptom triage rules."""

from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/symptom-triage", tags=["symptom-triage"])

TRIAGE_MODULES = {
    "headache": "Headache",
    "fatigue": "Fatigue",
    "cough-breathing": "Cough and breathing symptoms",
    "abdominal-pain": "Abdominal pain",
}


@router.get("/{slug}")
def get_triage_definition(slug: str) -> dict:
    if slug not in TRIAGE_MODULES:
        raise HTTPException(status_code=404, detail="Symptom module was not found")
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Clinical triage rules are pending expert review and are not available",
    )
