@echo off
echo === Arch Rusty Security Suite Integrity Verifier ===
if "%~1"=="" (
    echo Usage: verify-integrity.bat ^<binary-file^>
    exit /b 1
)

set BINARY=%~1
set SHA_FILE=%BINARY%.sha256
set ASC_FILE=%BINARY%.asc
set PUB_KEY=tilas01-public-key.asc

if not exist "%BINARY%" (
    echo Error: Missing binary file.
    exit /b 1
)
if not exist "%SHA_FILE%" (
    echo Error: Missing .sha256 file.
    exit /b 1
)

echo [1/2] Verifying SHA-256 Hash...
certutil -hashfile "%BINARY%" SHA256 > temp_hash.txt
findstr /v "hash" temp_hash.txt | findstr /v "CertUtil" > computed_hash.txt
set /p COMPUTED=<computed_hash.txt
set COMPUTED=%COMPUTED: =%

set /p EXPECTED=<"%SHA_FILE%"
for /f "tokens=1" %%a in ("%EXPECTED%") do set EXPECTED=%%a

del temp_hash.txt computed_hash.txt

if /i "%COMPUTED%"=="%EXPECTED%" (
    echo [OK] Hash matches successfully.
) else (
    echo [ERROR] HASH VERIFICATION FAILED! Do not run this binary.
    echo Computed: %COMPUTED%
    echo Expected: %EXPECTED%
    exit /b 1
)

if exist "%ASC_FILE%" (
    echo.
    echo [2/2] Verifying GPG Signature...
    if not exist "%PUB_KEY%" (
        echo Public key not found locally. Downloading official key from GitHub...
        curl -sL "https://raw.githubusercontent.com/tilas01/arch-guides-dynamic/main/tilas01-public-key.asc" -o "%PUB_KEY%"
    )
    gpg --import "%PUB_KEY%" 2>NUL
    gpg --verify "%ASC_FILE%" "%BINARY%"
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] GPG SIGNATURE VERIFICATION FAILED! Do not run this binary.
        exit /b 1
    )
    echo [OK] GPG Signature matches successfully.
) else (
    echo.
    echo [2/2] Skipping GPG check ^(missing .asc file^).
)

echo.
echo Integrity check passed. You may safely run the binary.
