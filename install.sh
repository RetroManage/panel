#!/usr/bin/env bash
set -euo pipefail

APP_NAME="retropanel"
APP_DIR="${RETROPANEL_APP_DIR:-/opt/retropanel}"
DATA_DIR="${RETROPANEL_DATA_DIR:-/var/lib/retropanel}"
REPO_URL="${RETROPANEL_REPO_URL:-https://github.com/RetroManage/panel.git}"
SERVICE_USER="retropanel"
HTTP_ADDR="127.0.0.1:8080"

if [[ "${EUID}" -ne 0 ]]; then
  echo "This installer must be run as root. Use: sudo bash install.sh"
  exit 1
fi

read -rp "Domain for RetroPanel, e.g. panel.example.com: " DOMAIN
if [[ -z "${DOMAIN}" ]]; then
  echo "Domain is required."
  exit 1
fi
read -rp "Let's Encrypt email (optional): " LE_EMAIL
read -rp "Owner admin username: " ADMIN_USER
if [[ -z "${ADMIN_USER}" ]]; then
  ADMIN_USER="admin"
fi
while true; do
  read -rsp "Owner admin password: " ADMIN_PASSWORD
  echo
  read -rsp "Confirm owner admin password: " ADMIN_PASSWORD_CONFIRM
  echo
  if [[ -n "${ADMIN_PASSWORD}" && "${ADMIN_PASSWORD}" == "${ADMIN_PASSWORD_CONFIRM}" ]]; then
    break
  fi
  echo "Passwords did not match or were empty. Try again."
done

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git build-essential nginx certbot python3-certbot-nginx rsync openssl tar

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -Eq '^v(20|21|22|23|24)\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

if ! command -v go >/dev/null 2>&1 || ! go version | grep -Eq 'go1\.26'; then
  GO_VERSION="1.26.0"
  ARCH="amd64"
  if [[ "$(uname -m)" == "aarch64" || "$(uname -m)" == "arm64" ]]; then
    ARCH="arm64"
  fi
  curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-${ARCH}.tar.gz" -o /tmp/go.tgz
  rm -rf /usr/local/go
  tar -C /usr/local -xzf /tmp/go.tgz
  ln -sf /usr/local/go/bin/go /usr/local/bin/go
  ln -sf /usr/local/go/bin/gofmt /usr/local/bin/gofmt
fi

if ! id -u "${SERVICE_USER}" >/dev/null 2>&1; then
  useradd --system --home "${APP_DIR}" --shell /usr/sbin/nologin "${SERVICE_USER}"
fi

mkdir -p "${APP_DIR}" "${DATA_DIR}"
if [[ -d ./backend && -d ./web ]]; then
  rsync -a --delete --exclude '.git' --exclude 'web/node_modules' --exclude 'data' ./ "${APP_DIR}/"
else
  rm -rf "${APP_DIR}.tmp"
  git clone --depth=1 "${REPO_URL}" "${APP_DIR}.tmp"
  rsync -a --delete --exclude '.git' --exclude 'web/node_modules' --exclude 'data' "${APP_DIR}.tmp/" "${APP_DIR}/"
  rm -rf "${APP_DIR}.tmp"
fi

SESSION_SECRET="$(openssl rand -hex 48)"
cat > "${APP_DIR}/.env" <<ENV
RETROPANEL_HTTP_ADDR=${HTTP_ADDR}
RETROPANEL_APP_DIR=${APP_DIR}
RETROPANEL_DATA_DIR=${DATA_DIR}
RETROPANEL_DB_PATH=${DATA_DIR}/retropanel.db
RETROPANEL_WEB_DIR=${APP_DIR}/web/dist
RETROPANEL_ADMIN_USER=${ADMIN_USER}
RETROPANEL_ADMIN_PASSWORD=${ADMIN_PASSWORD}
RETROPANEL_SESSION_SECRET=${SESSION_SECRET}
ENV
chmod 640 "${APP_DIR}/.env"
chown root:"${SERVICE_USER}" "${APP_DIR}/.env"

cd "${APP_DIR}/web"
npm ci
npm run build

cd "${APP_DIR}/backend"
go mod tidy
go build -trimpath -ldflags "-s -w" -o "${APP_DIR}/retropanel" ./cmd/retropanel

chown -R "${SERVICE_USER}:${SERVICE_USER}" "${DATA_DIR}"
chown -R root:root "${APP_DIR}"
chown "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}/retropanel"
chmod 755 "${APP_DIR}/retropanel"

cat > /etc/systemd/system/retropanel.service <<SERVICE
[Unit]
Description=RetroPanel
After=network-online.target
Wants=network-online.target

[Service]
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
ExecStart=${APP_DIR}/retropanel
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ReadWritePaths=${DATA_DIR}

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable --now retropanel

cat > /etc/nginx/sites-available/retropanel <<NGINX
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://${HTTP_ADDR};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX
ln -sf /etc/nginx/sites-available/retropanel /etc/nginx/sites-enabled/retropanel
nginx -t
systemctl reload nginx

if [[ -n "${LE_EMAIL}" ]]; then
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --redirect --email "${LE_EMAIL}"
else
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --redirect --register-unsafely-without-email
fi
systemctl reload nginx

echo

echo "RetroPanel installation completed."
echo "URL: https://${DOMAIN}"
echo "Owner username: ${ADMIN_USER}"
echo "Service: systemctl status retropanel"
echo "Logs: journalctl -u retropanel -f"
