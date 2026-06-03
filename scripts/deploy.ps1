<#
  豆服云 · 手动部署到阿里云 ECS（Windows PowerShell 版，与 deploy.sh 等价）
  流程：npm ci → typecheck → build → scp dist/ 到服务器临时目录
        → 服务器端：备份 → rsync --delete 同步 → chown 回 www 用户
  依赖：node/npm + 系统自带 OpenSSH 的 ssh/scp；用密钥免密登录。

  用法：
    1) 复制 scripts\deploy.env.example 为 scripts\deploy.env 并填好
    2) powershell -ExecutionPolicy Bypass -File scripts\deploy.ps1
#>
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

$envFile = Join-Path $ScriptDir "deploy.env"
if (-not (Test-Path $envFile)) {
  Write-Error "找不到 $envFile，请先复制 deploy.env.example 为 deploy.env 并填写。"
}
$cfg = @{}
foreach ($line in Get-Content $envFile) {
  $t = $line.Trim()
  if ($t -eq "" -or $t.StartsWith("#")) { continue }
  $idx = $t.IndexOf("=")
  if ($idx -lt 1) { continue }
  $cfg[$t.Substring(0, $idx).Trim()] = $t.Substring($idx + 1).Trim()
}
foreach ($k in @("ECS_HOST", "ECS_USER", "ECS_DEPLOY_PATH", "ECS_SSH_KEY")) {
  if (-not $cfg[$k]) { Write-Error "✗ deploy.env 缺少 $k" }
}

$ECS_HOST = $cfg["ECS_HOST"]
$ECS_USER = $cfg["ECS_USER"]
$ECS_PORT = if ($cfg["ECS_PORT"]) { $cfg["ECS_PORT"] } else { "22" }
$ECS_DEPLOY_PATH = $cfg["ECS_DEPLOY_PATH"]
$ECS_WWW_USER = if ($cfg["ECS_WWW_USER"]) { $cfg["ECS_WWW_USER"] } else { "www-data" }
# 把 git-bash 风格路径 /c/Users/... 转成 Windows 风格，供系统 ssh.exe 用
$ECS_SSH_KEY = $cfg["ECS_SSH_KEY"]
if ($ECS_SSH_KEY -match "^/([a-zA-Z])/(.*)$") {
  $ECS_SSH_KEY = ($Matches[1].ToUpper() + ":\" + ($Matches[2] -replace "/", "\"))
}
if (-not (Test-Path $ECS_SSH_KEY)) { Write-Error "✗ 找不到私钥文件：$ECS_SSH_KEY" }

$danger = @("", "/", "/root", "/var", "/var/www", "/etc", "/usr", "/home", "/boot")
if ($danger -contains $ECS_DEPLOY_PATH) {
  Write-Error "✗ 危险的 ECS_DEPLOY_PATH='$ECS_DEPLOY_PATH'，已中止。"
}

Set-Location $RootDir
$H = "${ECS_USER}@${ECS_HOST}"
$sshArgs = @("-i", $ECS_SSH_KEY, "-o", "IdentitiesOnly=yes", "-o", "StrictHostKeyChecking=accept-new", "-p", $ECS_PORT)
$scpArgs = @("-i", $ECS_SSH_KEY, "-o", "IdentitiesOnly=yes", "-o", "StrictHostKeyChecking=accept-new", "-P", $ECS_PORT)
$remoteTmp = "/tmp/dowsure_deploy_" + [int][double]::Parse((Get-Date -UFormat %s))

Write-Host "▶ 1/4 安装依赖（npm ci）" -ForegroundColor Cyan
npm ci; if (-not $?) { Write-Error "npm ci 失败" }
Write-Host "▶ 2/4 typecheck + 构建" -ForegroundColor Cyan
npm run typecheck; if (-not $?) { Write-Error "typecheck 失败" }
npm run build; if (-not $?) { Write-Error "build 失败" }
if (-not (Test-Path "dist")) { Write-Error "构建后没有 dist/" }

Write-Host "▶ 3/4 上传 dist/ → ${H}:${remoteTmp}" -ForegroundColor Cyan
& ssh @sshArgs $H "rm -rf '$remoteTmp'"; if (-not $?) { Write-Error "清理远端临时目录失败" }
& scp @scpArgs "-q" "-r" "dist" "${H}:${remoteTmp}"; if (-not $?) { Write-Error "scp 上传失败" }

Write-Host "▶ 4/4 服务器端：备份 → 同步 → chown" -ForegroundColor Cyan
$remoteScript = @"
set -e
TARGET='${ECS_DEPLOY_PATH}'
TMP='${remoteTmp}'
WWW='${ECS_WWW_USER}'
STAMP=`$(date +%Y%m%d-%H%M%S)
if [ -d "`$TARGET" ]; then cp -a "`$TARGET" "`$TARGET.backup.`$STAMP"; echo "  备份 -> `$TARGET.backup.`$STAMP"; fi
mkdir -p "`$TARGET"
if command -v rsync >/dev/null 2>&1; then rsync -a --delete "`$TMP/" "`$TARGET/"; else rm -rf "`$TARGET"/*; cp -a "`$TMP/." "`$TARGET/"; fi
chown -R "`$WWW:`$WWW" "`$TARGET" 2>/dev/null || true
rm -rf "`$TMP"
ls -la "`$TARGET"
"@
& ssh @sshArgs $H $remoteScript; if (-not $?) { Write-Error "服务器端部署失败" }

Write-Host ""
Write-Host "✅ 部署完成 → http(s)://${ECS_HOST}" -ForegroundColor Green
Write-Host "   验证：访问 http://${ECS_HOST}/seller/chat 刷新不应 404"
