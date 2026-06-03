#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────
# 豆服云 · 手动部署到阿里云 ECS（bash 版）
#
# 流程：npm ci → typecheck → build → scp dist/ 到服务器临时目录
#       → 服务器端：备份当前站点 → rsync --delete 同步 → chown 回 www 用户
#
# 用法：
#   1) cp scripts/deploy.env.example scripts/deploy.env   # 填好里面的值
#   2) bash scripts/deploy.sh
#
# 依赖：本机 node/npm/ssh/scp；服务器有 rsync（无则自动退回 cp）。
# 用密钥免密登录（ECS_SSH_KEY 指向私钥文件）。
# ───────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$SCRIPT_DIR/deploy.env" ]; then
  set -a; # shellcheck disable=SC1090
  source "$SCRIPT_DIR/deploy.env"; set +a
fi

: "${ECS_HOST:?✗ 缺少 ECS_HOST（请在 scripts/deploy.env 填写）}"
: "${ECS_USER:?✗ 缺少 ECS_USER}"
: "${ECS_DEPLOY_PATH:?✗ 缺少 ECS_DEPLOY_PATH}"
: "${ECS_SSH_KEY:?✗ 缺少 ECS_SSH_KEY（私钥文件路径）}"
ECS_PORT="${ECS_PORT:-22}"
ECS_WWW_USER="${ECS_WWW_USER:-www-data}"

[ -f "$ECS_SSH_KEY" ] || { echo "✗ 找不到私钥文件：$ECS_SSH_KEY"; exit 1; }

# 安全护栏：禁止危险的部署目录
case "$ECS_DEPLOY_PATH" in
  ""|"/"|"/root"|"/var"|"/var/www"|"/etc"|"/usr"|"/home"|"/boot")
    echo "✗ 危险的 ECS_DEPLOY_PATH='$ECS_DEPLOY_PATH'，已中止"; exit 1;;
esac

cd "$ROOT_DIR"
H="${ECS_USER}@${ECS_HOST}"
SSH=(ssh -i "$ECS_SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -p "$ECS_PORT")
SCP=(scp -i "$ECS_SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new -P "$ECS_PORT")
REMOTE_TMP="/tmp/dowsure_deploy_$(date +%s)"

if [ -d node_modules ]; then
  echo "▶ 1/4 依赖已存在，跳过安装（如需全新安装：rm -rf node_modules 后重跑）"
else
  echo "▶ 1/4 安装依赖（npm ci）"; npm ci
fi
echo "▶ 2/4 typecheck + 构建"; npm run typecheck; npm run build
[ -d dist ] || { echo "✗ 构建后没有 dist/"; exit 1; }

echo "▶ 3/4 上传 dist/ → ${H}:${REMOTE_TMP}"
"${SSH[@]}" "$H" "rm -rf '$REMOTE_TMP'"
"${SCP[@]}" -q -r dist "$H:$REMOTE_TMP"

echo "▶ 4/4 服务器端：备份 → 同步 → chown"
REMOTE_SCRIPT=$(cat <<EOF
set -e
TARGET='${ECS_DEPLOY_PATH}'
TMP='${REMOTE_TMP}'
WWW='${ECS_WWW_USER}'
STAMP=\$(date +%Y%m%d-%H%M%S)
if [ -d "\$TARGET" ]; then cp -a "\$TARGET" "\$TARGET.backup.\$STAMP"; echo "  备份 → \$TARGET.backup.\$STAMP"; fi
mkdir -p "\$TARGET"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "\$TMP/" "\$TARGET/"
else
  rm -rf "\$TARGET"/*; cp -a "\$TMP/." "\$TARGET/"
fi
chown -R "\$WWW:\$WWW" "\$TARGET" 2>/dev/null || true
rm -rf "\$TMP"
echo "  部署目录："; ls -la "\$TARGET"
EOF
)
"${SSH[@]}" "$H" "$REMOTE_SCRIPT"

echo ""
echo "✅ 部署完成 → http(s)://${ECS_HOST}"
echo "   验证：访问 http://${ECS_HOST}/seller/chat 刷新不应 404"
