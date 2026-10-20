@echo off
REM Arranca la BD portatil (si no esta corriendo) y luego la API.
cd /d "c:\Users\LENOVO\Documents\GORE 2"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$l = Get-NetTCPConnection -LocalPort 5433 -State Listen -ErrorAction SilentlyContinue; if (-not $l) { & 'C:\Users\LENOVO\pg17\pgsql\bin\pg_ctl.exe' -D 'C:\Users\LENOVO\pg17\data' -l 'C:\Users\LENOVO\pg17\server.log' -w -t 30 start | Out-Null }; if (Get-NetTCPConnection -LocalPort 5433 -State Listen -ErrorAction SilentlyContinue) { Write-Output 'BD OK en 5433' } else { Write-Output 'BD NO ARRANCO' }"
cd apps
cd api
npx tsx src/server.ts