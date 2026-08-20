#!/usr/bin/env bash
# ==============================================================================
# Bornat CV Maker — update an already-deployed VPS to the latest code.
#
# `deploy.sh` is the first-run installer (Node, PostgreSQL, nginx, PM2, the
# database, the .env). This script is the *update* path for a server that has
# already been through it: it refreshes the code, reinstalls dependencies,
# applies any schema changes, rebuilds, restarts PM2, and health-checks the
# result. It never touches .env, the database contents, or nginx.
#
# Usage, on the server as root:
#
#   # from a git checkout (the usual case):
#   bash update.sh https://github.com/<owner>/cv_maker.git <branch>
#
#   # or from a source tarball you copied up:
#   bash update.sh /root/bornat-src.tar.gz
#
# Safe to re-run. If the build fails, the previous build stays live — the app is
# only restarted after a successful build.
# ==============================================================================
set -euo pipefail

APP_DIR="/opt/bornat-cv-maker"
APP_USER="bornat"
SERVICE_NAME="bornat-cv-maker"
SOURCE="${1:-}"
BRANCH="${2:-main}"

log()  { printf '\n\033[1;32m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m!! %s\033[0m\n' "$1"; }
fail() { printf '\033[1;31mFATAL: %s\033[0m\n' "$1"; exit 1; }

[[ $EUID -eq 0 ]] || fail "Run as root."
[[ -d "$APP_DIR" ]] || fail "$APP_DIR does not exist — run deploy.sh first."
[[ -f "$APP_DIR/.env" ]] || fail "$APP_DIR/.env is missing — run deploy.sh first."
[[ -n "$SOURCE" ]] || fail "Pass a git URL (plus optional branch) or the path to a source tarball."

# ------------------------------------------------------------------------------
log "1/6  Fetching the new code"
# ------------------------------------------------------------------------------
STAGING="$(mktemp -d /tmp/bornat-update.XXXXXX)"
trap 'rm -rf "$STAGING"' EXIT

if [[ -f "$SOURCE" ]]; then
  log "  Unpacking $SOURCE"
  mkdir -p "$STAGING/src-tree"
  tar -xzf "$SOURCE" -C "$STAGING/src-tree"
  SRC="$STAGING/src-tree"
else
  command -v git >/dev/null || apt-get install -y -qq git >/dev/null
  log "  Cloning $SOURCE ($BRANCH)"
  git clone --depth 1 --branch "$BRANCH" "$SOURCE" "$STAGING/src-tree" >/dev/null 2>&1 ||
    fail "Could not clone $SOURCE (branch $BRANCH). For a private repo, use a URL that carries a token."
  SRC="$STAGING/src-tree"
fi

# Never carry the repository's own git history — or, defensively, an .env that
# happened to be inside a tarball — onto the server.
rm -rf "$SRC/.git" "$SRC/.env"

[[ -f "$SRC/package.json" ]] || fail "The source does not look like the app (no package.json)."

# ------------------------------------------------------------------------------
log "2/6  Backing up the current release"
# ------------------------------------------------------------------------------
BACKUP="/root/bornat-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP" -C "$APP_DIR" --exclude='node_modules' --exclude='.next' . 2>/dev/null || true
log "  Saved $BACKUP (code only — the database is untouched)."

# ------------------------------------------------------------------------------
log "3/6  Copying the new code over the release"
# ------------------------------------------------------------------------------
# .env is never overwritten: it holds the database URL and the secrets, which
# are specific to this server and must survive every update.
# The source trees are replaced wholesale so a file deleted upstream also
# disappears here; everything else (node_modules, .next, .env) is left in place.
rm -rf "$APP_DIR/src" "$APP_DIR/prisma" "$APP_DIR/public" "$APP_DIR/tests"
cp -a "$SRC"/. "$APP_DIR"/
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ------------------------------------------------------------------------------
log "4/6  Dependencies, schema, build"
# ------------------------------------------------------------------------------
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm ci --no-audit --no-fund"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npx prisma generate"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npx prisma db push --skip-generate"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm run build" ||
  fail "Build failed — the previously built app is still running, nothing was restarted."

# ------------------------------------------------------------------------------
log "5/6  Restarting the app"
# ------------------------------------------------------------------------------
if sudo -u "$APP_USER" pm2 describe "$SERVICE_NAME" >/dev/null 2>&1; then
  sudo -u "$APP_USER" pm2 restart "$SERVICE_NAME" --update-env
else
  warn "PM2 process not found — starting it."
  sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && NODE_ENV=production pm2 start node_modules/.bin/next \
    --name $SERVICE_NAME --cwd '$APP_DIR' -- start -p 3000 -H 127.0.0.1"
fi
sudo -u "$APP_USER" pm2 save >/dev/null

# ------------------------------------------------------------------------------
log "6/6  Health check"
# ------------------------------------------------------------------------------
HEALTH="fail"
for _ in $(seq 1 15); do
  if curl -sf --max-time 3 http://127.0.0.1:3000/ >/dev/null 2>&1; then HEALTH="ok"; break; fi
  sleep 2
done

echo
echo "=============================================================="
echo " Update complete"
echo "   app health : $HEALTH"
echo "   backup     : $BACKUP"
echo "   logs       : sudo -u $APP_USER pm2 logs $SERVICE_NAME"
echo "=============================================================="
[[ "$HEALTH" == "ok" ]] || fail "The app did not come back up — check the logs above."
