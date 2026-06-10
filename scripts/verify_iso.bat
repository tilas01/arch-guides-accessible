@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Arch Linux ISO Integrity Verifier (Windows)
echo ===================================================

if "%~1"=="" (
    echo Usage: verify_iso.bat ^<path_to_archlinux.iso^>
    echo Please drag and drop the Arch Linux ISO onto this batch file.
    pause
    exit /b 1
)

set ISO_FILE=%~1
if not exist "%ISO_FILE%" (
    echo Error: File not found - %ISO_FILE%
    pause
    exit /b 1
)

echo.
echo Fetching latest SHA256 checksums from Arch Linux mirrors...
curl -sL "https://mirror.rackspace.com/archlinux/iso/latest/sha256sums.txt" > "%TEMP%\arch_sha256sums.txt"

if errorlevel 1 (
    echo Error: Failed to fetch checksums. Check your internet connection.
    pause
    exit /b 1
)

echo Calculating SHA256 hash of your ISO (this may take a minute)...
for /f "skip=1 tokens=* delims=" %%A in ('certutil -hashfile "%ISO_FILE%" SHA256') do (
    set "MY_HASH=%%A"
    goto :hashdone
)
:hashdone
set MY_HASH=%MY_HASH: =%

echo Your ISO Hash:  !MY_HASH!

findstr /i "!MY_HASH!" "%TEMP%\arch_sha256sums.txt" >nul
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] ISO Integrity Verified! Hash matches official release.
    echo You may proceed to flash this ISO to your USB drive.
) else (
    echo.
    echo [WARNING] INTEGRITY CHECK FAILED!
    echo The hash of your ISO does NOT match the official release!
    echo Please DELETE this ISO, re-download it, and do NOT flash it to a USB!
)

del "%TEMP%\arch_sha256sums.txt"
echo.
pause
