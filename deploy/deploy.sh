#!/usr/bin/env bash
# ==============================================================================
# Bornat CV Maker — VPS deploy script
#
# Run as root, from the same directory as this script AND bornat-src.tar.gz
# (a snapshot of the `main` branch, commit 3902b40).
#
#   scp deploy.sh bornat-src.tar.gz root@YOUR_VPS_IP:/root/
#   ssh root@YOUR_VPS_IP
#   bash deploy.sh
#
# What it does: installs Node 20, PostgreSQL, nginx, PM2 and Puppeteer's
# Chromium runtime libs; creates a dedicated `bornat` system user; unpacks the
# app to /opt/bornat-cv-maker; creates the database; generates fresh secrets
# into .env; builds; seeds an OWNER account; starts the app under PM2 (bound to
# 127.0.0.1:3000, reachable only through nginx); reverse-proxies nginx on :80;
# and prints a summary with the URL and credentials.
#
# Safe to re-run: an existing .env is NEVER touched or regenerated (so any
# manual changes you make later — a domain, Resend keys — survive a re-run),
# but code, dependencies and the build are always refreshed and the app is
# restarted. Re-running with a newer bornat-src.tar.gz is the update path.
#
# Targets Debian/Ubuntu (apt). No domain required; TLS/Resend are documented
# as follow-ups at the end, not done here.
# ==============================================================================
set -euo pipefail

APP_DIR="/opt/bornat-cv-maker"
APP_USER="bornat"
APP_DB="bornat_cv"
APP_DB_USER="bornat_cv"
SERVICE_NAME="bornat-cv-maker"
SUMMARY_FILE="/root/bornat-cv-maker-DEPLOY-SUMMARY.txt"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARBALL="$SCRIPT_DIR/bornat-src.tar.gz"

log()  { printf '\n\033[1;32m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m!! %s\033[0m\n' "$1"; }
fail() { printf '\033[1;31mFATAL: %s\033[0m\n' "$1"; exit 1; }

[[ $EUID -eq 0 ]] || fail "Run as root."
[[ -f "$TARBALL" ]] || fail "bornat-src.tar.gz must sit next to this script (same directory)."
command -v apt-get >/dev/null || fail "This script targets Debian/Ubuntu (apt-get not found)."

VPS_IP="$(curl -s -4 --max-time 5 ifconfig.me || curl -s -4 --max-time 5 icanhazip.com || hostname -I | awk '{print $1}')"
[[ -n "$VPS_IP" ]] || fail "Could not determine this server's public IP."
log "Detected public IP: $VPS_IP"

# ------------------------------------------------------------------------------
log "1/11  System packages"
# ------------------------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git ca-certificates gnupg openssl build-essential >/dev/null

# ------------------------------------------------------------------------------
log "2/11  Node.js 20"
# ------------------------------------------------------------------------------
if ! command -v node >/dev/null || [[ "$(node -v | sed 's/v//;s/\..*//')" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
log "Node $(node -v), npm $(npm -v)"

# ------------------------------------------------------------------------------
log "3/11  PostgreSQL"
# ------------------------------------------------------------------------------
if ! command -v psql >/dev/null; then
  apt-get install -y -qq postgresql postgresql-contrib >/dev/null
fi
systemctl enable --now postgresql >/dev/null 2>&1 || true

# ------------------------------------------------------------------------------
log "4/11  nginx + PM2"
# ------------------------------------------------------------------------------
command -v nginx >/dev/null || apt-get install -y -qq nginx >/dev/null
command -v pm2 >/dev/null || npm install -g pm2 --silent

# ------------------------------------------------------------------------------
log "5/11  Puppeteer / headless Chrome runtime libraries"
# ------------------------------------------------------------------------------
# Package names drift across Debian/Ubuntu releases (e.g. libasound2 vs
# libasound2t64). Installed one at a time with || true so an unknown name on
# this particular release doesn't abort the ones that do exist.
CHROME_DEPS=(
  fonts-liberation libasound2 libasound2t64 libatk-bridge2.0-0 libatk1.0-0
  libatspi2.0-0 libcairo2 libcups2 libdbus-1-3 libdrm2 libexpat1
  libfontconfig1 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3
  libpango-1.0-0 libpangocairo-1.0-0 libx11-6 libx11-xcb1 libxcb1
  libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6
  libxkbcommon0 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release
  wget xdg-utils
)
for pkg in "${CHROME_DEPS[@]}"; do
  apt-get install -y -qq "$pkg" >/dev/null 2>&1 || true
done

# ------------------------------------------------------------------------------
log "6/11  Swap (build headroom on small VPS instances)"
# ------------------------------------------------------------------------------
MEM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [[ "$MEM_MB" -lt 2048 ]] && [[ ! -f /swapfile ]]; then
  log "  RAM is ${MEM_MB}MB — adding a 2G swapfile so 'next build' doesn't OOM."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ------------------------------------------------------------------------------
log "7/11  Application user and files"
# ------------------------------------------------------------------------------
id -u "$APP_USER" >/dev/null 2>&1 || useradd -m -s /bin/bash "$APP_USER"
passwd -l "$APP_USER" >/dev/null 2>&1 || true   # no password login for this account

FIRST_RUN="no"
[[ -f "$APP_DIR/.env" ]] || FIRST_RUN="yes"

mkdir -p "$APP_DIR"
log "  Unpacking application source (main @ 3902b40) into $APP_DIR"
# Never overwrite a live .env with anything the tarball might contain (it
# doesn't ship one, but this keeps the guarantee explicit and future-proof).
tar -xzf "$TARBALL" -C "$APP_DIR" --exclude='.env'
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ------------------------------------------------------------------------------
log "8/11  Database & environment"
# ------------------------------------------------------------------------------
if [[ "$FIRST_RUN" == "yes" ]]; then
  DB_PASSWORD="$(openssl rand -hex 24)"
  NEXTAUTH_SECRET_VAL="$(openssl rand -base64 32)"
  OWNER_PASSWORD_VAL="$(openssl rand -base64 18 | tr -d '=+/' | cut -c1-20)"
  OWNER_EMAIL_VAL="jibreelebornat@gmail.com"

  sudo -u postgres psql -c "CREATE ROLE $APP_DB_USER LOGIN PASSWORD '$DB_PASSWORD';" >/dev/null
  sudo -u postgres psql -c "CREATE DATABASE $APP_DB OWNER $APP_DB_USER;" >/dev/null
  log "  Created database '$APP_DB' and role '$APP_DB_USER'."

  DB_URL="postgresql://$APP_DB_USER:$DB_PASSWORD@localhost:5432/$APP_DB"

  cat > "$APP_DIR/.env" <<EOF
DATABASE_URL="$DB_URL"
DIRECT_URL="$DB_URL"

NEXTAUTH_SECRET="$NEXTAUTH_SECRET_VAL"
NEXTAUTH_URL="http://$VPS_IP"

# nginx is the only thing in front of Next — one hop.
TRUSTED_PROXY_HOPS="1"

# No domain yet, so no Resend/TLS. Turn this on once both are set up (see
# README.md -> "Email verification (Resend)"); until then every new signup is
# usable immediately, which is the supported, documented configuration.
ENABLE_EMAIL_VERIFICATION="false"

OWNER_EMAIL="$OWNER_EMAIL_VAL"
OWNER_PASSWORD="$OWNER_PASSWORD_VAL"
OWNER_NAME="Jibreel Bornat"
EOF
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
else
  log "  Existing .env found — leaving it untouched (this is a re-run/update)."
  DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$APP_DB'" || true)
  [[ "$DB_EXISTS" == "1" ]] || warn "Expected database '$APP_DB' to already exist but it doesn't — check $APP_DIR/.env manually."
fi

# ------------------------------------------------------------------------------
log "9/11  Install, migrate, seed, build (as $APP_USER)"
# ------------------------------------------------------------------------------
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm ci --no-audit --no-fund"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npx prisma generate"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npx prisma db push --skip-generate"
# NODE_ENV=production makes the seed skip demo accounts deterministically —
# see prisma/seed.js. On a re-run this only touches role/name of the existing
# owner row, never the password (prisma/seed.js's upsert leaves passwordHash
# alone on update), so it can't undo a password you've since changed.
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && NODE_ENV=production node prisma/seed.js"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm run build"

# ------------------------------------------------------------------------------
log "10/11  Process manager (PM2) — bound to 127.0.0.1 only, nginx fronts it"
# ------------------------------------------------------------------------------
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && pm2 delete $SERVICE_NAME >/dev/null 2>&1 || true"
sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && NODE_ENV=production pm2 start node_modules/.bin/next \
  --name $SERVICE_NAME --cwd '$APP_DIR' -- start -p 3000 -H 127.0.0.1"
sudo -u "$APP_USER" pm2 save
# Register PM2 to survive reboots, running as $APP_USER. Best-effort: some
# init systems / minimal images behave differently, and the app is already
# running regardless of whether this succeeds.
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>/dev/null | tail -1 | bash >/dev/null 2>&1 || true

# ------------------------------------------------------------------------------
log "11/11  nginx reverse proxy on :80"
# ------------------------------------------------------------------------------
if ss -ltnp 2>/dev/null | grep -q ':80 ' && ! ss -ltnp 2>/dev/null | grep ':80 ' | grep -q nginx; then
  warn "Something other than nginx already appears to be listening on :80."
  warn "The site below may not be reachable until that's resolved — check with: ss -ltnp | grep :80"
fi

cat > /etc/nginx/sites-available/$SERVICE_NAME <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 2m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX
ln -sf /etc/nginx/sites-available/$SERVICE_NAME /etc/nginx/sites-enabled/$SERVICE_NAME
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx || systemctl restart nginx

# Open :80 only if ufw is already active — never enable/touch it otherwise,
# so this script cannot lock the operator out or surprise-firewall the box.
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp >/dev/null
  log "  ufw is active — opened 80/tcp (left everything else as-is, including :22)."
fi

# ------------------------------------------------------------------------------
log "Health check"
# ------------------------------------------------------------------------------
sleep 3
LOCAL_OK="fail"; PROXY_OK="fail"
for i in $(seq 1 10); do
  curl -sf --max-time 3 http://127.0.0.1:3000/ >/dev/null 2>&1 && LOCAL_OK="ok" && break
  sleep 2
done
curl -sf --max-time 5 http://127.0.0.1/ >/dev/null 2>&1 && PROXY_OK="ok"
DISK_LEFT="$(df -h / | awk 'NR==2{print $4}')"

# ------------------------------------------------------------------------------
{
  echo "=============================================================="
  echo " Bornat CV Maker — deployed"
  echo "=============================================================="
  echo " URL:                 http://$VPS_IP"
  echo " App (PM2) health:    $LOCAL_OK"
  echo " nginx proxy health:  $PROXY_OK"
  echo " Disk free on /:      $DISK_LEFT"
  echo ""
  if [[ "$FIRST_RUN" == "yes" ]]; then
    echo " Owner login (generated this run):"
    echo "   Email:    $OWNER_EMAIL_VAL"
    echo "   Password: $OWNER_PASSWORD_VAL"
  else
    echo " Owner login: unchanged from the first deploy."
    echo " (Re-runs never regenerate or print it — recover via /forgot-password"
    echo "  if it's been lost, or see the original summary if still on disk.)"
  fi
  echo ""
  echo " App directory:   $APP_DIR"
  echo " Env file:        $APP_DIR/.env  (chmod 600, owned by $APP_USER — never"
  echo "                  touched by this script after the first run)"
  echo " Database:        postgresql://$APP_DB_USER:***@localhost:5432/$APP_DB"
  echo ""
  echo " Useful commands:"
  echo "   sudo -u $APP_USER pm2 logs $SERVICE_NAME       # tail logs"
  echo "   sudo -u $APP_USER pm2 restart $SERVICE_NAME    # restart the app"
  echo "   sudo -u $APP_USER pm2 status                   # process status"
  echo ""
  echo " Still to do, whenever you're ready (not required for the app to work):"
  echo "   - Point a domain at $VPS_IP, then set up nginx + certbot for HTTPS."
  echo "   - Set RESEND_API_KEY + EMAIL_FROM + ENABLE_EMAIL_VERIFICATION=true"
  echo "     in $APP_DIR/.env once you have that domain (see README.md)."
  echo "   - This copy of the code is a static snapshot (no git on the server)."
  echo "     For updates: re-run this script with a fresh bornat-src.tar.gz, or"
  echo "     set up git + a deploy key on the server if you'd rather 'git pull'."
  echo "=============================================================="
} | tee "$SUMMARY_FILE"
chmod 600 "$SUMMARY_FILE"

if [[ "$LOCAL_OK" != "ok" ]]; then
  warn "The app did not respond on 127.0.0.1:3000 within 20s."
  warn "Check: sudo -u $APP_USER pm2 logs $SERVICE_NAME --lines 100"
  exit 1
fi
