@echo off
title GitHub Login for SIHAT
color 0A

echo ========================================================
echo          SIHAT - GITHUB ACCOUNT LOGIN
echo ========================================================
echo.

if exist "%~dp0.git" (
    cd /d "%~dp0"
) else if exist "%~dp0fastapi-sihat\fastapi-sihat\.git" (
    cd /d "%~dp0fastapi-sihat\fastapi-sihat"
) else if exist "%~dp0fastapi-sihat\.git" (
    cd /d "%~dp0fastapi-sihat"
)

echo Current Git User:
git config user.name
git config user.email
echo.
echo 1. Old credentials have been removed.
echo 2. Now browser will open for GitHub login.
echo 3. Please sign in as: dilovar6666
echo 4. Click the green "Authorize GitCredentialManager" button.
echo.
echo Press any key to open browser...
pause >nul

git credential-manager github login --browser --force

echo.
echo ========================================================
echo Logged-in GitHub account:
git credential-manager github list
echo ========================================================
echo.

echo Pushing changes to GitHub:
git push origin master
echo.

if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  SUCCESS! All changes pushed to GitHub successfully!
    echo ========================================================
) else (
    echo [ERROR] Push failed. Make sure you logged in as dilovar6666.
)

echo.
echo Press any key to exit...
pause >nul
