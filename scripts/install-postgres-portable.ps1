# Instalacion portable de PostgreSQL 17 (sin privilegios de administrador).
# Postgres en Windows se niega a correr como servicio sin admin, pero
# `pg_ctl start` funciona como proceso de usuario normal.
$ErrorActionPreference = "Stop"

$Version  = "17.11-5"
$Url      = "https://get.enterprisedb.com/postgresql/postgresql-$Version-windows-x64-binaries.zip"
$Zip      = "C:\Users\LENOVO\Downloads\pg17-binaries.zip"
$Root     = "C:\Users\LENOVO\pg17"
$Data     = "$Root\data"
$Port     = 5432
$SuperUsr = "postgres"
$SuperPwd = "postgres"

function Say($m) { Write-Output "[$(Get-Date -Format HH:mm:ss)] $m" }

if (-not (Test-Path $Zip)) {
    Say "Descargando binarios PostgreSQL $Version (~120 MB)..."
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    $wc.DownloadFile($Url, $Zip)
}
Say "Descarga lista: $((Get-Item $Zip).Length) bytes"

if (-not (Test-Path "$Root\bin\initdb.exe")) {
    Say "Extrayendo en $Root ..."
    New-Item -ItemType Directory -Force -Path $Root | Out-Null
    Expand-Archive -Path $Zip -DestinationPath $Root -Force
}

# El zip de EDB puede traer el contenido en <root>\pgsql\bin o directo en <root>\bin.
$Bin = if (Test-Path "$Root\bin\initdb.exe") { "$Root\bin" } else { "$Root\pgsql\bin" }
if (-not (Test-Path "$Bin\initdb.exe")) { throw "No se encontro initdb.exe en $Root" }
Say "Binarios en: $Bin"
$env:PATH = "$Bin;$env:PATH"

if (-not (Test-Path "$Data\PG_VERSION")) {
    Say "Inicializando cluster en $Data (initdb)..."
    $pwFile = "$Root\.superpwd"
    [System.IO.File]::WriteAllText($pwFile, $SuperPwd)
    & "$Bin\initdb.exe" -D $Data -U $SuperUsr -A md5 -E UTF8 --locale=C --pwfile="$pwFile" 2>&1 | ForEach-Object { Say "  $_" }
    Remove-Item $pwFile -ErrorAction SilentlyContinue
    if (-not (Test-Path "$Data\PG_VERSION")) { throw "initdb fallo: no se creo PG_VERSION" }
    Say "postgresql.conf -> listen_addresses/port"
    Add-Content -Path "$Data\postgresql.conf" -Value "`nlisten_addresses = 'localhost'`nport = $Port`nmax_connections = 100"
}
Say "Cluster OK (version $((Get-Content "$Data\PG_VERSION")))"

# Detener una instancia previa si existiera
& "$Bin\pg_ctl.exe" -D $Data status 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Say "Deteniendo instancia previa..."
    & "$Bin\pg_ctl.exe" -D $Data -m fast stop 2>&1 | Out-Null
    Start-Sleep -Seconds 3
}

Say "Arrancando PostgreSQL en puerto $Port ..."
& "$Bin\pg_ctl.exe" -D $Data -l "$Root\server.log" -w -t 60 start 2>&1 | ForEach-Object { Say "  $_" }
if ($LASTEXITCODE -ne 0) {
    Say "pg_ctl start devolvio $LASTEXITCODE. server.log:"
    Get-Content "$Root\server.log" -Tail 30 | ForEach-Object { Say "  $_" }
    throw "No se pudo arrancar PostgreSQL"
}
Say "PostgreSQL arrancado correctamente."

# Crear base de datos
$env:PGPASSWORD = $SuperPwd
$exists = & "$Bin\psql.exe" -h localhost -p $Port -U $SuperUsr -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='educa_lambayeque'" 2>&1
if ($exists -match '1') {
    Say "Base 'educa_lambayeque' ya existe."
} else {
    & "$Bin\createdb.exe" -h localhost -p $Port -U $SuperUsr "educa_lambayeque" 2>&1 | ForEach-Object { Say "  $_" }
    Say "Base 'educa_lambayeque' creada."
}
& "$Bin\psql.exe" -h localhost -p $Port -U $SuperUsr -d educa_lambayeque -c "SELECT version();" 2>&1 | ForEach-Object { Say "  $_" }
Say "LISTO. DATABASE_URL=postgresql://postgres:postgres@localhost:$Port/educa_lambayeque?schema=public"
