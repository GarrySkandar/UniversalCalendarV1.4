@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Universal Calendar Web

echo ==============================================
echo   Universal Civilization Calendar - Windows Launcher
echo ==============================================
echo.

rem sxtwl 2.0.7 provides a prebuilt Windows wheel for CPython 3.11.
rem Do not use the machine's default Python 3.12/3.13/3.14 for this engine.
set "PY311="

call :find_py311
if defined PY311 goto :have_python

echo [1/5] Python 3.11 x64 was not found.
echo       The Chinese calendar engine needs CPython 3.11 on Windows.
echo.
where winget >nul 2>nul
if not errorlevel 1 (
  echo Installing Python 3.11 for the current user via Windows Package Manager...
  winget install --id Python.Python.3.11 -e --scope user --silent --accept-package-agreements --accept-source-agreements
  call :find_py311
)

if not defined PY311 (
  echo.
  echo Automatic installation did not complete.
  echo Please install Python 3.11 x64, then run this file again:
  echo https://www.python.org/downloads/release/python-3119/
  echo.
  echo The app can still be opened without the Chinese lunar engine by running:
  echo   python server.py
  pause
  exit /b 1
)

:have_python
echo [1/5] Python 3.11 found:
echo       %PY311%

if not exist .venv311 (
  echo [2/5] Creating isolated Python 3.11 environment...
  "%PY311%" -m venv .venv311
  if errorlevel 1 goto :venv_fail
) else (
  echo [2/5] Reusing .venv311
)

set "VPY=%CD%\.venv311\Scripts\python.exe"
if not exist "%VPY%" goto :venv_fail

echo [3/5] Ensuring pip is available...
"%VPY%" -m ensurepip --upgrade >nul 2>nul
"%VPY%" -m pip --version >nul 2>nul
if errorlevel 1 goto :pip_fail

echo [4/5] Installing / verifying calendar and location engines...
"%VPY%" -m pip install --disable-pip-version-check --only-binary=:all: sxtwl==2.0.7
if errorlevel 1 goto :engine_fail
"%VPY%" -m pip install --disable-pip-version-check pythaidate==0.2.0
if errorlevel 1 goto :engine_fail

echo       Checking optional offline timezone resolver...
"%VPY%" -c "import timezonefinder" >nul 2>nul
if errorlevel 1 (
  echo       timezonefinder is optional. Trying a compatible release from the configured pip source...
  "%VPY%" -m pip install --disable-pip-version-check "timezonefinder>=6.5,<9" > timezonefinder-install.log 2>&1
  if errorlevel 1 (
    echo       Configured pip source has no compatible build. Trying official PyPI once...
    "%VPY%" -m pip install --disable-pip-version-check --index-url https://pypi.org/simple --only-binary=:all: "timezonefinder>=8.0,<9" >> timezonefinder-install.log 2>&1
  )
)
"%VPY%" -c "import timezonefinder" >nul 2>nul
if errorlevel 1 (
  echo       Optional timezone resolver unavailable; Earth map will use built-in longitude/nearest-city fallback.
  echo       Details: timezonefinder-install.log
) else (
  echo       Optional timezone resolver ready.
)

echo       Checking recommended Chinese traditional almanac engine...
"%VPY%" -c "import lunar_python" >nul 2>nul
if errorlevel 1 (
  echo       Installing lunar_python from the configured pip source...
  "%VPY%" -m pip install --disable-pip-version-check "lunar_python>=1.4.8,<2" > almanac-install.log 2>&1
  if errorlevel 1 (
    echo       Configured pip source did not provide lunar_python. Trying official PyPI once...
    "%VPY%" -m pip install --disable-pip-version-check --index-url https://pypi.org/simple "lunar_python>=1.4.8,<2" >> almanac-install.log 2>&1
  )
)
"%VPY%" -c "import lunar_python" >nul 2>nul
if errorlevel 1 (
  echo       Traditional almanac enhancement unavailable; Chinese lunisolar calendar still works.
  echo       Details: almanac-install.log
) else (
  echo       Traditional almanac enhancement ready.
)

echo       Checking optional Tibetan Phugpa/Tsurphu engine...
"%VPY%" -c "import caltib" >nul 2>nul
if errorlevel 1 (
  "%VPY%" -m pip install --disable-pip-version-check "caltib==0.3.2" > tibetan-install.log 2>&1
  if errorlevel 1 "%VPY%" -m pip install --disable-pip-version-check --index-url https://pypi.org/simple "caltib==0.3.2" >> tibetan-install.log 2>&1
)
"%VPY%" -c "import caltib" >nul 2>nul
if errorlevel 1 (
  echo       Tibetan engine unavailable; the rest of the app continues normally.
  echo       Details: tibetan-install.log
) else (
  echo       Tibetan versioned engine ready.
)

echo       Checking optional SI-USTS RP1 time-scale engine...
"%VPY%" -c "import erfa" >nul 2>nul
if errorlevel 1 (
  "%VPY%" -m pip install --disable-pip-version-check --only-binary=:all: "pyerfa>=2.0" > si-usts-install.log 2>&1
  if errorlevel 1 "%VPY%" -m pip install --disable-pip-version-check --index-url https://pypi.org/simple --only-binary=:all: "pyerfa>=2.0" >> si-usts-install.log 2>&1
)
"%VPY%" -c "import erfa" >nul 2>nul
if errorlevel 1 (
  echo       SI-USTS RP1 unavailable; SI-USTS will use the clearly marked UI fallback.
  echo       Details: si-usts-install.log
) else (
  echo       SI-USTS RP1 time-scale engine ready.
)

"%VPY%" -c "import sxtwl,pythaidate,sys,importlib.util; d=sxtwl.fromSolar(2026,8,9); t=pythaidate.CsDate.fromjulianday(2461192); print('Engine self-test OK | Python',sys.version.split()[0],'| Chinese lunar',d.getLunarYear(),d.getLunarMonth(),d.getLunarDay(),'| Thai',t); print('Timezone resolver','OK' if importlib.util.find_spec('timezonefinder') else 'FALLBACK'); print('Traditional almanac','OK' if importlib.util.find_spec('lunar_python') else 'OPTIONAL/MISSING'); print('Tibetan engine','OK' if importlib.util.find_spec('caltib') else 'OPTIONAL/MISSING')"
if errorlevel 1 goto :engine_fail

echo [5/5] Starting Universal Civilization Calendar v1.4.0...
echo       A free local port will be selected automatically.
echo       This prevents an older calendar server on port 8765 from being reopened.
"%VPY%" server.py --port 0 --open-browser
exit /b 0

:find_py311
for /f "delims=" %%P in ('py -3.11 -c "import sys; print(sys.executable)" 2^>nul') do set "PY311=%%P"
if defined PY311 exit /b 0
if exist "%LocalAppData%\Programs\Python\Python311\python.exe" set "PY311=%LocalAppData%\Programs\Python\Python311\python.exe"
if defined PY311 exit /b 0
if exist "C:\Program Files\Python311\python.exe" set "PY311=C:\Program Files\Python311\python.exe"
exit /b 0

:venv_fail
echo.
echo ERROR: Could not create .venv311.
echo Delete the .venv311 folder if it is incomplete, then run this launcher again.
pause
exit /b 1

:pip_fail
echo.
echo ERROR: pip is unavailable inside .venv311.
echo Try deleting .venv311 and running this launcher again.
pause
exit /b 1

:engine_fail
echo.
echo ERROR: one or more calendar engines could not be installed or imported.
echo The launcher intentionally uses Python 3.11 because PyPI provides a Windows wheel for that version.
echo.
echo Diagnostic commands:
echo   "%VPY%" --version
echo   "%VPY%" -m pip install --only-binary=:all: sxtwl==2.0.7
echo   "%VPY%" -c "import sxtwl,pythaidate; print(sxtwl.__file__); print(pythaidate.__file__)"
echo.
pause
exit /b 1
