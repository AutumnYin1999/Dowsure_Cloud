<#
  Dowsure Cloud manual deploy to Aliyun ECS.

  Flow:
    npm ci -> typecheck -> build -> scp dist/ to a remote temp dir
    -> backup target -> sync -> chown

  Required config:
    Copy scripts/deploy.env.example to scripts/deploy.env and fill values.
#>

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$EnvFile = Join-Path $ScriptDir "deploy.env"

if (-not (Test-Path $EnvFile)) {
  Write-Error "Missing $EnvFile. Copy scripts/deploy.env.example to scripts/deploy.env first."
}

$Cfg = @{}
foreach ($Line in Get-Content $EnvFile) {
  $Text = $Line.Trim()
  if ($Text -eq "" -or $Text.StartsWith("#")) { continue }
  $Idx = $Text.IndexOf("=")
  if ($Idx -lt 1) { continue }
  $Cfg[$Text.Substring(0, $Idx).Trim()] = $Text.Substring($Idx + 1).Trim()
}

foreach ($Key in @("ECS_HOST", "ECS_USER", "ECS_DEPLOY_PATH", "ECS_SSH_KEY")) {
  if (-not $Cfg[$Key]) {
    Write-Error "deploy.env is missing $Key"
  }
}

$EcsHost = $Cfg["ECS_HOST"]
$EcsUser = $Cfg["ECS_USER"]
$EcsPort = if ($Cfg["ECS_PORT"]) { $Cfg["ECS_PORT"] } else { "22" }
$EcsDeployPath = $Cfg["ECS_DEPLOY_PATH"]
$EcsWwwUser = if ($Cfg["ECS_WWW_USER"]) { $Cfg["ECS_WWW_USER"] } else { "www-data" }
$EcsSshKey = $Cfg["ECS_SSH_KEY"]

# Convert git-bash style path /c/Users/... to Windows style path for ssh.exe.
if ($EcsSshKey -match "^/([a-zA-Z])/(.*)$") {
  $EcsSshKey = $Matches[1].ToUpper() + ":\" + ($Matches[2] -replace "/", "\")
}

if (-not (Test-Path $EcsSshKey)) {
  Write-Error "SSH key file not found: $EcsSshKey"
}

$DangerPaths = @("", "/", "/root", "/var", "/var/www", "/etc", "/usr", "/home", "/boot")
if ($DangerPaths -contains $EcsDeployPath) {
  Write-Error "Unsafe ECS_DEPLOY_PATH '$EcsDeployPath'. Aborted."
}

Set-Location $RootDir

$HostTarget = "${EcsUser}@${EcsHost}"
$SshArgs = @("-i", $EcsSshKey, "-o", "IdentitiesOnly=yes", "-o", "StrictHostKeyChecking=accept-new", "-p", $EcsPort)
$ScpArgs = @("-i", $EcsSshKey, "-o", "IdentitiesOnly=yes", "-o", "StrictHostKeyChecking=accept-new", "-P", $EcsPort)
$RemoteTmp = "/tmp/dowsure_deploy_" + [int][double]::Parse((Get-Date -UFormat %s))

Write-Host "1/5 Installing dependencies with npm ci" -ForegroundColor Cyan
npm ci
if (-not $?) { Write-Error "npm ci failed" }

Write-Host "2/5 Typecheck and build" -ForegroundColor Cyan
npm run typecheck
if (-not $?) { Write-Error "typecheck failed" }
npm run build
if (-not $?) { Write-Error "build failed" }
if (-not (Test-Path "dist")) { Write-Error "dist/ was not created" }

Write-Host "3/5 Uploading dist/ to ${HostTarget}:${RemoteTmp}" -ForegroundColor Cyan
& ssh @SshArgs $HostTarget "rm -rf '$RemoteTmp'"
if (-not $?) { Write-Error "failed to clean remote temp dir" }
& scp @ScpArgs "-q" "-r" "dist" "${HostTarget}:${RemoteTmp}"
if (-not $?) { Write-Error "scp upload failed" }

Write-Host "4/5 Remote backup, sync, chown" -ForegroundColor Cyan
$RemoteScript = @"
set -e
TARGET='${EcsDeployPath}'
TMP='${RemoteTmp}'
WWW='${EcsWwwUser}'
STAMP=`$(date +%Y%m%d-%H%M%S)
BACKUP="`${TARGET}.backup.`${STAMP}"
if [ -d "`$TARGET" ]; then
  cp -a "`$TARGET" "`$BACKUP"
  echo "backup `$BACKUP"
fi
mkdir -p "`$TARGET"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "`$TMP/" "`$TARGET/"
else
  rm -rf "`$TARGET"/*
  cp -a "`$TMP/." "`$TARGET/"
fi
chown -R "`$WWW:`$WWW" "`$TARGET" 2>/dev/null || true
rm -rf "`$TMP"
ls -la "`$TARGET"
"@

& ssh @SshArgs $HostTarget $RemoteScript
if (-not $?) { Write-Error "remote deploy failed" }

Write-Host "5/5 Smoke test: nginx -t + HTTP self-check" -ForegroundColor Cyan
$SmokeScript = @"
nginx -t 2>&1 | tail -1
echo "home: `$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/)"
echo "spa : `$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/seller/chat)"
curl -s http://127.0.0.1/ | grep -oE '<title>[^<]*</title>' | head -1
"@
& ssh @SshArgs $HostTarget $SmokeScript

Write-Host ""
Write-Host "Deploy complete." -ForegroundColor Green
Write-Host "Verify: http://${EcsHost}/seller"
