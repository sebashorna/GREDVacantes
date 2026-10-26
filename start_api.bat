@echo off
setlocal
cd /d "%~dp0"

set "PG_BIN=%USERPROFILE%\pg17\pgsql\bin"
set "PG_DATA=%USERPROFILE%\pg17\data"

if not exist "%PG_BIN%\pg_ctl.exe" (
  echo ERROR: No se encontro PostgreSQL en "%PG_BIN%".
  exit /b 1
)
if not exist "%PG_DATA%\PG_VERSION" (
  echo ERROR: No se encontro el directorio de datos en "%PG_DATA%".
  exit /b 1
)

"%PG_BIN%\pg_isready.exe" -h localhost -p 5433 -U postgres -d educa_lambayeque >nul 2>&1
if errorlevel 1 (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 5433 -State Listen -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }"
  if errorlevel 1 (
    echo ERROR: El puerto 5433 esta ocupado, pero PostgreSQL no responde.
    exit /b 1
  )
  echo Iniciando PostgreSQL en el puerto 5433...
  "%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" -l "%USERPROFILE%\pg17\server.log" -w -t 30 start
  if errorlevel 1 (
    echo ERROR: No se pudo iniciar PostgreSQL. Revisa "%USERPROFILE%\pg17\server.log".
    exit /b 1
  )
)

"%PG_BIN%\pg_isready.exe" -h localhost -p 5433 -U postgres -d educa_lambayeque
if errorlevel 1 (
  echo ERROR: PostgreSQL no responde en localhost:5433.
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-RestMethod -Uri 'http://localhost:3000/health' -TimeoutSec 3; if ($r.estado -eq 'ok') { exit 0 } } catch {}; exit 1" >nul 2>&1
if not errorlevel 1 (
  echo La base de datos y la API ya estan funcionando.
  exit /b 0
)

echo Iniciando la API...
cd /d "%~dp0apps\api"
call npm run dev
