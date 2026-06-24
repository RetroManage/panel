package http

import (
	"net/http"
	"time"

	"retropanel/backend/internal/domain"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var input loginRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid login payload")
		return
	}
	admin, ok := s.store.Authenticate(input.Username, input.Password)
	if !ok {
		writeError(w, http.StatusUnauthorized, "invalid username or password")
		return
	}
	token, expires, err := s.sessions.Issue(admin.ID, admin.Username)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create session")
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  expires,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
	writeJSON(w, http.StatusOK, map[string]any{"admin": admin, "expiresAt": expires})
}

func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: sessionCookieName, Path: "/", MaxAge: -1, Expires: time.Unix(0, 0)})
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (s *Server) session(w http.ResponseWriter, r *http.Request) {
	admin, _ := adminFromRequest(r)
	writeJSON(w, http.StatusOK, map[string]any{"admin": admin})
}

func (s *Server) dashboard(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.Dashboard())
}

func (s *Server) sales(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"items": s.store.Sales()})
}

func (s *Server) botUsers(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"items": s.store.BotUsers()})
}

func (s *Server) leaderboard(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"items": s.store.Leaderboard()})
}

func (s *Server) getPricing(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.Pricing())
}

func (s *Server) updatePricing(w http.ResponseWriter, r *http.Request) {
	var input domain.PricingSettings
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid pricing payload")
		return
	}
	if err := s.store.SavePricing(input); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save pricing settings")
		return
	}
	writeJSON(w, http.StatusOK, s.store.Pricing())
}

func (s *Server) getGeneral(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.General())
}

func (s *Server) updateGeneral(w http.ResponseWriter, r *http.Request) {
	var input domain.GeneralSettingsUpdate
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid general settings payload")
		return
	}
	settings, err := s.store.SaveGeneral(input)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not save general settings")
		return
	}
	writeJSON(w, http.StatusOK, settings)
}

func (s *Server) getPanel(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, s.store.Panel())
}

func (s *Server) updatePanel(w http.ResponseWriter, r *http.Request) {
	var input domain.PanelSettings
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid panel settings payload")
		return
	}
	if err := s.store.SavePanel(input); err != nil {
		writeError(w, http.StatusInternalServerError, "could not save panel settings")
		return
	}
	writeJSON(w, http.StatusOK, s.store.Panel())
}
