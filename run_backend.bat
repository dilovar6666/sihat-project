@echo off
cd /d "%~dp0"
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
    python -m uvicorn sihat.main:app --reload --port 8000
) else (
    echo Error: .venv not found!
    pause
)
