#!/usr/bin/env bash
set -euo pipefail

APP_NAME="retropanel"
APP_DIR="${RETROPANEL_APP_DIR:-/opt/retropanel}"
DATA_DIR="${RETROPANEL_DATA_DIR:-/var/lib/retropanel}"
REPO_URL="${RETROPANEL_REPO_URL:-https://github.com/RetroManage/panel.git}"
SERVICE_NAME="${RETROPANEL_SERVICE_NAME:-retropanel}"
SERVICE_USER="${RETROPANEL_SERVICE_USER:-retropanel}"
BACKUP_DIR="${RETROPANEL_BACKUP_DIR:-/var/backups/retropanel}"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
RELEASE_DIR="/tmp/${APP_NAME}-update-${STAMP}"
BACKUP_FILE="${BACKUP_DIR}/${APP_NAME}-${STAMP}.tar.gz"

log() { printf '\033[1;34m%s\033[0m %s\n' "==>" "$*"; }
fail() { printf '\033[1;31m%s\033[0m %s\n' "ERROR:" "$*" >&2; exit 1; }

if [[ "${EUID}" -ne 0 ]]; then
  fail "This updater must be run as root. Use: sudo bash update.sh"
fi

command -v rsync >/dev/null 2>&1 || fail "rsync is required"
command -v npm >/dev/null 2>&1 || fail "npm is required"
command -v go >/dev/null 2>&1 || fail "Go is required"

[[ -d "${APP_DIR}" ]] || fail "Application directory not found: ${APP_DIR}"
[[ -f "${APP_DIR}/.env" ]] || fail "Environment file not found: ${APP_DIR}/.env"

mkdir -p "${BACKUP_DIR}"
log "Creating backup at ${BACKUP_FILE}"
tar -czf "${BACKUP_FILE}" \
  --ignore-failed-read \
  -C "$(dirname "${APP_DIR}")" "$(basename "${APP_DIR}")/.env" \
  -C "$(dirname "${DATA_DIR}")" "$(basename "${DATA_DIR}")"
chmod 600 "${BACKUP_FILE}"

cleanup() {
  rm -rf "${RELEASE_DIR}"
}
trap cleanup EXIT

log "Preparing release source"
if [[ -d ./backend && -d ./web ]]; then
  mkdir -p "${RELEASE_DIR}"
  rsync -a --delete --exclude '.git' --exclude 'web/node_modules' --exclude 'web/dist' --exclude 'data' ./ "${RELEASE_DIR}/"
else
  command -v git >/dev/null 2>&1 || fail "git is required when update.sh is not run from a source checkout"
  git clone --depth=1 "${REPO_URL}" "${RELEASE_DIR}"
fi

log "Building frontend"
cd "${RELEASE_DIR}/web"
npm ci
npm run build

log "Building backend"
cd "${RELEASE_DIR}/backend"
go mod tidy
go build -trimpath -ldflags "-s -w" -o "${RELEASE_DIR}/${APP_NAME}" ./cmd/retropanel

log "Stopping service"
systemctl stop "${SERVICE_NAME}" || true

log "Installing new files"
rsync -a --delete \
  --exclude '.git' \
  --exclude 'web/node_modules' \
  --exclude '.env' \
  --exclude 'data' \
  "${RELEASE_DIR}/" "${APP_DIR}/"
install -m 755 "${RELEASE_DIR}/${APP_NAME}" "${APP_DIR}/${APP_NAME}"

chown -R root:root "${APP_DIR}"
chown -R "${SERVICE_USER}:${SERVICE_USER}" "${DATA_DIR}"
chown "${SERVICE_USER}:${SERVICE_USER}" "${APP_DIR}/${APP_NAME}"
chmod 755 "${APP_DIR}/${APP_NAME}"
chmod 640 "${APP_DIR}/.env"
chown root:"${SERVICE_USER}" "${APP_DIR}/.env"

log "Restarting service"
systemctl daemon-reload
systemctl start "${SERVICE_NAME}"
systemctl --no-pager --full status "${SERVICE_NAME}" | sed -n '1,12p'

log "Update completed"
echo "Backup: ${BACKUP_FILE}"
echo "Logs: journalctl -u ${SERVICE_NAME} -f"
