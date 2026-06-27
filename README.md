# RetroPanel

RetroPanel is a compact web control panel for running a Telegram-based sales bot on top of a connected panel API. The project ships as one Go backend, one React/Vite frontend, a local JSON data store, and production scripts for install and update.

The current build focuses on clean operations: verified panel connections, live dashboard statistics, real user lists, Telegram bot activation, and Toman-based pricing/accounting fields.

## What is included

- Real panel connection management with base URL, username, password, token validation, and connection status.
- Live dashboard data sourced from the upstream API instead of seeded placeholder numbers.
- Real user listing through the connected panel user endpoint.
- CPU, memory, disk, traffic, online-user and status cards on the dashboard.
- Telegram bot settings split into clear sections: General, Texts, Buttons, and Visibility.
- Toman-first money formatting across sales, revenue, pricing, and dashboard cards.
- A quieter modern UI with softer hover states, reduced glow, and cleaner dashboard layout.
- `install.sh` for first-time deployment and `update.sh` for safe upgrades with automatic backup.

## Requirements

A fresh Ubuntu/Debian server is recommended.

Minimum runtime requirements:

- Node.js 20 or newer
- Go 1.22 or newer
- Nginx
- systemd
- A domain pointed to the server if you want automatic TLS

The installer can install the required system packages on a clean server.

## Installation

Run as root or with `sudo`:

```bash
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/RetroManage/panel/main/install.sh)"
```

The installer asks for:

- Dashboard domain
- Optional Let's Encrypt email
- Owner username
- Owner password

After installation:

```bash
systemctl status retropanel
journalctl -u retropanel -f
```

Default paths:

```text
Application: /opt/retropanel
Data:        /var/lib/retropanel
Env file:    /opt/retropanel/.env
Service:     retropanel.service
```

## Update

Use the updater to pull the latest release, rebuild the frontend/backend, keep the existing `.env` and data directory, and create a backup before replacing files.

```bash
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/RetroManage/panel/main/update.sh)"
```

To update from a local checkout instead:

```bash
sudo RETROPANEL_APP_DIR=/opt/retropanel bash ./update.sh
```

Backups are written to:

```text
/var/backups/retropanel
```

## Configuration

Environment values live in `/opt/retropanel/.env`:

```env
RETROPANEL_HTTP_ADDR=127.0.0.1:8080
RETROPANEL_APP_DIR=/opt/retropanel
RETROPANEL_DATA_DIR=/var/lib/retropanel
RETROPANEL_DB_PATH=/var/lib/retropanel/retropanel.db
RETROPANEL_WEB_DIR=/opt/retropanel/web/dist
RETROPANEL_ADMIN_USER=admin
RETROPANEL_ADMIN_PASSWORD=change-this
RETROPANEL_SESSION_SECRET=change-this-long-random-value
```

Restart after manual changes:

```bash
sudo systemctl restart retropanel
```

## Panel connection

Open **Panels** in the dashboard and add the upstream panel credentials:

- Base URL
- Admin username
- Admin password
- Optional connection name

The backend tests the connection before saving it. A connected panel is then used for dashboard statistics and user lists.

## Bot settings

Open **Bot Setting**. The sidebar and header tabs expose four sections:

- **General**: activate/pause the Telegram bot, save the bot token, set owner numeric ID, and enable daily reports.
- **Texts**: edit customer-facing message keys.
- **Buttons**: edit keyboard rows with pipe-separated buttons.
- **Visibility**: enable or disable bot actions with `key=true` or `key=false` lines.

The bot starts immediately after a valid token and owner ID are saved while activation is enabled.

## API surface

RetroPanel exposes its own authenticated API for the frontend:

```text
GET    /api/dashboard
GET    /api/sales
GET    /api/bot/users
GET    /api/settings/general
PUT    /api/settings/general
GET    /api/settings/panel
PUT    /api/settings/panel
GET    /api/panels
POST   /api/panels/test
POST   /api/panels
PUT    /api/panels/{id}
DELETE /api/panels/{id}
POST   /api/pasarguard/users
```

The dashboard bridge reads live upstream data from the connected panel, including users, system stats and user statistics. If the upstream panel is not connected, the frontend shows an empty live state instead of fake business numbers.

## Development

Backend:

```bash
cd backend
go run ./cmd/retropanel
```

Frontend:

```bash
cd web
npm ci
npm run dev
```

Build manually:

```bash
cd web && npm ci && npm run build
cd ../backend && go build -trimpath -ldflags "-s -w" -o ../retropanel ./cmd/retropanel
```

## Operational notes

- Keep `/var/lib/retropanel` backed up. It contains the local data store.
- Keep `/opt/retropanel/.env` private. It contains the session secret and owner bootstrap values.
- Use the built-in updater for production upgrades so a rollback backup is created first.
- Money values in the interface are displayed in Toman.
