# RetroPanel

RetroPanel is a Telegram-commerce control panel for PasarGuard. This build replaces the old single-server installation assumption with real PasarGuard REST API connections, live Telegram bot activation, and an English-only bot menu.

## What changed in this release

- Added a **Panels** section above **Products** in the sidebar.
- Removed the sidebar rail hover line that could overlap text.
- Added real PasarGuard panel connection management with `Username`, `Password`, and `Base URL`.
- Added a real **Test Connection** action. The backend logs in to PasarGuard through `POST /api/admin/token` and validates the token through `GET /api/admin`.
- Added backend support for creating PasarGuard users through `POST /api/user`.
- Activated Telegram bot settings through the real Telegram Bot API. When the bot is enabled, RetroPanel validates the token and starts long polling.
- Replaced the bot's default Persian menu with English buttons:
  - Buy Service / My Services
  - Trial Subscription / Wallet
  - Connection Guide / Support
  - Admin Panel for the configured owner ID

## Supported upstream panel

RetroPanel intentionally supports only PasarGuard. Do not ask users to choose a panel type. Use a PasarGuard base URL such as:

```text
https://pg.example.com
```

PasarGuard itself exposes a FastAPI REST backend and its repository documents it as a web interface with a fully REST API backend.

## VPS installation

Run this on a fresh Ubuntu/Debian VPS. Point your domain DNS A record to the VPS before starting.

```bash
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/RetroManage/panel/main/install.sh)"
```

The installer asks for:

- Domain name
- Let's Encrypt email, optional
- Owner admin username
- Owner admin password

The installer will:

- Install Node.js, Go, Nginx, Certbot, and build tools
- Clone `https://github.com/RetroManage/panel`
- Build the React dashboard
- Build the Go backend
- Create `/opt/retropanel/.env`
- Create a system user and systemd service
- Configure Nginx as a reverse proxy
- Request and install an HTTPS certificate
- Start RetroPanel

Default paths:

```text
Application: /opt/retropanel
Data:        /var/lib/retropanel
Env file:    /opt/retropanel/.env
Service:     retropanel.service
```

Useful commands:

```bash
systemctl status retropanel
journalctl -u retropanel -f
systemctl restart retropanel
```

## Manual local development

### Frontend

```bash
cd web
npm install
npm run build
```

### Backend

```bash
cd backend
go mod tidy
go build -o ../retropanel ./cmd/retropanel
```

### Run locally

```bash
mkdir -p data
export RETROPANEL_HTTP_ADDR=":8080"
export RETROPANEL_WEB_DIR="$PWD/web/dist"
export RETROPANEL_DB_PATH="$PWD/data/retropanel.db"
export RETROPANEL_ADMIN_USER="admin"
export RETROPANEL_ADMIN_PASSWORD="ChangeMe123!"
export RETROPANEL_SESSION_SECRET="dev-secret-change-later"
./retropanel
```

Open:

```text
http://localhost:8080
```

## Environment variables

```text
RETROPANEL_HTTP_ADDR=:8080
RETROPANEL_APP_DIR=/opt/retropanel
RETROPANEL_DATA_DIR=/var/lib/retropanel
RETROPANEL_DB_PATH=/var/lib/retropanel/retropanel.db
RETROPANEL_WEB_DIR=/opt/retropanel/web/dist
RETROPANEL_ADMIN_USER=admin
RETROPANEL_ADMIN_PASSWORD=ChangeMe123!
RETROPANEL_SESSION_SECRET=replace-with-a-long-random-secret
```

## API endpoints added by RetroPanel

```text
GET    /api/panels
POST   /api/panels/test
POST   /api/panels
PUT    /api/panels/{id}
DELETE /api/panels/{id}
POST   /api/pasarguard/users
```

## Telegram bot behavior

After saving a valid bot token and owner numeric ID in **Bot Setting**, RetroPanel starts the bot immediately. The owner receives the extra **Admin Panel** button. The current admin bot section is a placeholder for the next release, while the customer menu, trial creation, and service lookup are connected to the configured PasarGuard panel.
