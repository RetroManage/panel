package http

import (
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"retropanel/backend/internal/auth"
	"retropanel/backend/internal/config"
	"retropanel/backend/internal/store"
)

const sessionCookieName = "retropanel_session"

type Server struct {
	cfg      config.Config
	store    *store.Store
	sessions *auth.Manager
	logger   *slog.Logger
	mux      *http.ServeMux
}

func NewServer(cfg config.Config, db *store.Store, logger *slog.Logger) http.Handler {
	s := &Server{
		cfg:      cfg,
		store:    db,
		sessions: auth.NewManager(cfg.SessionSecret, 24*time.Hour),
		logger:   logger,
		mux:      http.NewServeMux(),
	}
	s.routes()
	return s.recover(s.cors(s.mux))
}

func (s *Server) routes() {
	s.mux.HandleFunc("GET /healthz", s.health)
	s.mux.HandleFunc("POST /api/auth/login", s.login)
	s.mux.HandleFunc("POST /api/auth/logout", s.logout)
	s.mux.Handle("GET /api/session", s.requireAuth(http.HandlerFunc(s.session)))
	s.mux.Handle("GET /api/dashboard", s.requireAuth(http.HandlerFunc(s.dashboard)))
	s.mux.Handle("GET /api/sales", s.requireAuth(http.HandlerFunc(s.sales)))
	s.mux.Handle("GET /api/admins/leaderboard", s.requireAuth(http.HandlerFunc(s.leaderboard)))
	s.mux.Handle("GET /api/settings/pricing", s.requireAuth(http.HandlerFunc(s.getPricing)))
	s.mux.Handle("PUT /api/settings/pricing", s.requireAuth(http.HandlerFunc(s.updatePricing)))
	s.mux.Handle("GET /api/settings/panel", s.requireAuth(http.HandlerFunc(s.getPanel)))
	s.mux.Handle("PUT /api/settings/panel", s.requireAuth(http.HandlerFunc(s.updatePanel)))
	s.mux.HandleFunc("/", s.frontend)
}

func (s *Server) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(sessionCookieName)
		if err != nil || cookie.Value == "" {
			writeError(w, http.StatusUnauthorized, "authentication required")
			return
		}
		session, err := s.sessions.Parse(cookie.Value)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid session")
			return
		}
		admin, ok := s.store.AdminByID(session.AdminID)
		if !ok {
			writeError(w, http.StatusUnauthorized, "admin not found")
			return
		}
		next.ServeHTTP(w, withAdmin(r, admin))
	})
}

func (s *Server) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && (strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:")) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				s.logger.Error("panic", "error", err)
				writeError(w, http.StatusInternalServerError, "internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func (s *Server) frontend(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.URL.Path, "/api/") {
		writeError(w, http.StatusNotFound, "endpoint not found")
		return
	}

	index := filepath.Join(s.cfg.WebDir, "index.html")
	if _, err := os.Stat(index); err != nil {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`<html><body style="font-family:system-ui;background:#07111f;color:#e2e8f0;padding:48px"><h1>RetroPanel API is running</h1><p>Build the frontend and place it at RETROPANEL_WEB_DIR to enable the dashboard.</p></body></html>`))
		return
	}

	path := filepath.Join(s.cfg.WebDir, filepath.Clean(r.URL.Path))
	if info, err := os.Stat(path); err == nil && !info.IsDir() {
		http.ServeFile(w, r, path)
		return
	}
	http.ServeFile(w, r, index)
}
