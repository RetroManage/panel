# RetroPanel

RetroPanel is an accounting-oriented control panel with a Go backend and a React/TypeScript frontend based on the PasarGuard dashboard shell.

Default deployment paths:

- Application root: `/opt/retropanel`
- Data directory: `/var/lib/retropanel`
- Database file: `/var/lib/retropanel/retropanel.db`

## Local Development

### Frontend build

```powershell
cd web
npm install
npm run build
cd ..
```

### Backend build

```powershell
cd backend
go mod tidy
go build -o ..\retropanel.exe .\cmd\retropanel
cd ..
```

### Run backend and serve frontend

```powershell
New-Item -ItemType Directory -Force .\data

$env:RETROPANEL_HTTP_ADDR=":8080"
$env:RETROPANEL_WEB_DIR="$PWD\web\dist"
$env:RETROPANEL_DB_PATH="$PWD\data\retropanel.db"
$env:RETROPANEL_ADMIN_USER="admin"
$env:RETROPANEL_ADMIN_PASSWORD="ChangeMe123!"
$env:RETROPANEL_SESSION_SECRET="dev-secret-change-later"

.\retropanel.exe
```

Open:

```text
http://localhost:8080
```

Default login:

```text
Username: admin
Password: ChangeMe123!
```

## Current Sections

- Dashboard
- Sales Status
- Admin Leaderboard
- Price & Variable Settings
- Panel & Telegram Bot Settings
