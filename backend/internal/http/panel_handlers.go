package http

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"retropanel/backend/internal/domain"
	"retropanel/backend/internal/pasarguard"
	"retropanel/backend/internal/store"
)

type panelConnectionPayload struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	BaseURL  string `json:"baseUrl"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type testPanelResponse struct {
	OK       bool                     `json:"ok"`
	Message  string                   `json:"message"`
	Result   pasarguard.TestResult    `json:"result,omitempty"`
	Panel    domain.PasarGuardPanel   `json:"panel,omitempty"`
	Panels   []domain.PasarGuardPanel `json:"panels,omitempty"`
	Error    string                   `json:"error,omitempty"`
	TestedAt time.Time                `json:"testedAt"`
}

func (s *Server) listPanels(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"items": s.store.Panels()})
}

func (s *Server) testPanelConnection(w http.ResponseWriter, r *http.Request) {
	var input panelConnectionPayload
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid panel payload")
		return
	}
	result, _, err := s.pg.Test(r.Context(), pasarguard.Credentials{
		BaseURL:  input.BaseURL,
		Username: input.Username,
		Password: input.Password,
	})
	if err != nil {
		writeJSON(w, http.StatusBadGateway, testPanelResponse{OK: false, Message: err.Error(), Result: result, Error: err.Error(), TestedAt: time.Now().UTC()})
		return
	}
	writeJSON(w, http.StatusOK, testPanelResponse{OK: true, Message: result.Message, Result: result, TestedAt: time.Now().UTC()})
}

func (s *Server) createPanel(w http.ResponseWriter, r *http.Request) {
	var input panelConnectionPayload
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid panel payload")
		return
	}
	if strings.TrimSpace(input.Password) == "" {
		writeError(w, http.StatusBadRequest, "password is required")
		return
	}
	result, token, err := s.pg.Test(r.Context(), pasarguard.Credentials{BaseURL: input.BaseURL, Username: input.Username, Password: input.Password})
	if err != nil {
		writeJSON(w, http.StatusBadGateway, testPanelResponse{OK: false, Message: err.Error(), Result: result, Error: err.Error(), TestedAt: time.Now().UTC()})
		return
	}
	panel, err := s.store.SavePanelConnection(domain.PasarGuardPanelInput{
		Name: input.Name, BaseURL: result.BaseURL, Username: input.Username, Password: input.Password,
	}, token.AccessToken, token.TokenType, "connected", "")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not save panel")
		return
	}
	writeJSON(w, http.StatusCreated, testPanelResponse{OK: true, Message: "Panel connected and saved", Result: result, Panel: panel, Panels: s.store.Panels(), TestedAt: time.Now().UTC()})
}

func (s *Server) updatePanelConnection(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var input panelConnectionPayload
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid panel payload")
		return
	}
	current, ok := s.store.PanelByID(id)
	if !ok {
		writeError(w, http.StatusNotFound, "panel not found")
		return
	}
	if input.BaseURL == "" {
		input.BaseURL = current.BaseURL
	}
	if input.Username == "" {
		input.Username = current.Username
	}
	password := input.Password
	if password == "" {
		password = current.Password
	}
	if password == "" {
		writeError(w, http.StatusBadRequest, "password is required")
		return
	}
	result, token, err := s.pg.Test(r.Context(), pasarguard.Credentials{BaseURL: input.BaseURL, Username: input.Username, Password: password})
	if err != nil {
		panel, saveErr := s.store.UpdatePanelConnection(id, domain.PasarGuardPanelInput{Name: input.Name, BaseURL: input.BaseURL, Username: input.Username, Password: input.Password}, "", "", "failed", err.Error())
		if saveErr != nil && !errors.Is(saveErr, store.ErrNotFound) {
			s.logger.Error("mark panel failed", "error", saveErr)
		}
		writeJSON(w, http.StatusBadGateway, testPanelResponse{OK: false, Message: err.Error(), Result: result, Panel: panel, Error: err.Error(), TestedAt: time.Now().UTC()})
		return
	}
	if input.Password == "" {
		input.Password = current.Password
	}
	panel, err := s.store.UpdatePanelConnection(id, domain.PasarGuardPanelInput{Name: input.Name, BaseURL: result.BaseURL, Username: input.Username, Password: input.Password}, token.AccessToken, token.TokenType, "connected", "")
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "panel not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not update panel")
		return
	}
	writeJSON(w, http.StatusOK, testPanelResponse{OK: true, Message: "Panel updated and verified", Result: result, Panel: panel, Panels: s.store.Panels(), TestedAt: time.Now().UTC()})
}

func (s *Server) deletePanel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := s.store.DeletePanelConnection(id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "panel not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "could not delete panel")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "items": s.store.Panels()})
}

func (s *Server) createPasarGuardUser(w http.ResponseWriter, r *http.Request) {
	var input domain.PasarGuardUserCreateRequest
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid user payload")
		return
	}
	panel, ok := domain.PasarGuardPanel{}, false
	if input.PanelID != "" {
		panel, ok = s.store.PanelByID(input.PanelID)
	} else {
		panel, ok = s.store.ActivePanel()
	}
	if !ok {
		writeError(w, http.StatusBadRequest, "no PasarGuard panel is configured")
		return
	}
	accessToken := panel.AccessToken
	if accessToken == "" && panel.Password != "" {
		token, err := s.pg.Login(r.Context(), pasarguard.Credentials{BaseURL: panel.BaseURL, Username: panel.Username, Password: panel.Password})
		if err != nil {
			writeError(w, http.StatusBadGateway, err.Error())
			return
		}
		accessToken = token.AccessToken
	}
	dataLimit := input.DataLimitBytes
	if dataLimit == 0 && input.DataLimitGB > 0 {
		dataLimit = input.DataLimitGB * 1024 * 1024 * 1024
	}
	payload := pasarguard.CreateUserPayload{
		Username:               input.Username,
		Status:                 input.Status,
		Expire:                 input.Expire,
		DataLimit:              dataLimit,
		DataLimitResetStrategy: input.DataLimitResetStrategy,
		Note:                   input.Note,
	}
	created, err := s.pg.CreateUser(r.Context(), panel.BaseURL, accessToken, payload)
	if err != nil {
		writeError(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"ok": true, "panel": panel.ID, "user": created})
}
