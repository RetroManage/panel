package config

import (
	"crypto/rand"
	"encoding/base64"
	"os"
	"path/filepath"
)

type Config struct {
	HTTPAddr      string
	AppDir        string
	DataDir       string
	DatabasePath  string
	WebDir        string
	AdminUser     string
	AdminPassword string
	SessionSecret []byte
}

func Load() Config {
	appDir := env("RETROPANEL_APP_DIR", "/opt/retropanel")
	dataDir := env("RETROPANEL_DATA_DIR", "/var/lib/retropanel")
	secret := os.Getenv("RETROPANEL_SESSION_SECRET")
	if secret == "" {
		secret = randomSecret()
	}

	return Config{
		HTTPAddr:      env("RETROPANEL_HTTP_ADDR", ":8080"),
		AppDir:        appDir,
		DataDir:       dataDir,
		DatabasePath:  env("RETROPANEL_DB_PATH", filepath.Join(dataDir, "retropanel.db")),
		WebDir:        env("RETROPANEL_WEB_DIR", filepath.Join(appDir, "web", "dist")),
		AdminUser:     env("RETROPANEL_ADMIN_USER", "admin"),
		AdminPassword: env("RETROPANEL_ADMIN_PASSWORD", "ChangeMe123!"),
		SessionSecret: []byte(secret),
	}
}

func env(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func randomSecret() string {
	buf := make([]byte, 48)
	if _, err := rand.Read(buf); err != nil {
		return "retropanel-development-session-secret"
	}
	return base64.RawURLEncoding.EncodeToString(buf)
}
