package store

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"retropanel/backend/internal/domain"
)

var ErrNotFound = errors.New("not found")

type Store struct {
	path string
	mu   sync.RWMutex
	data domain.Snapshot
}

func Open(path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o750); err != nil {
		return nil, err
	}

	s := &Store{path: path}
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		s.data = defaultSnapshot()
		return s, s.flush()
	}
	if err := s.load(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *Store) EnsureOwner(username, password string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if len(s.data.Admins) > 0 {
		if s.data.Admins[0].PasswordSalt == "" || s.data.Admins[0].PasswordHash == "" {
			salt, err := randomBytes(16)
			if err != nil {
				return err
			}
			if strings.TrimSpace(username) != "" {
				s.data.Admins[0].Username = strings.TrimSpace(username)
			}
			s.data.Admins[0].PasswordSalt = base64.RawStdEncoding.EncodeToString(salt)
			s.data.Admins[0].PasswordHash = hashPassword(password, salt)
			s.data.UpdatedAt = time.Now().UTC()
			return s.flushLocked()
		}
		return nil
	}
	admin, err := newAdmin(username, "Owner", "owner", password)
	if err != nil {
		return err
	}
	s.data.Admins = append(s.data.Admins, admin)
	s.data.UpdatedAt = time.Now().UTC()
	return s.flushLocked()
}

func (s *Store) Authenticate(username, password string) (domain.Admin, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, admin := range s.data.Admins {
		if admin.Username == username && verifyPassword(password, admin.PasswordSalt, admin.PasswordHash) {
			return publicAdmin(admin), true
		}
	}
	return domain.Admin{}, false
}

func (s *Store) AdminByID(id string) (domain.Admin, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, admin := range s.data.Admins {
		if admin.ID == id {
			return publicAdmin(admin), true
		}
	}
	return domain.Admin{}, false
}

func (s *Store) Dashboard() domain.DashboardSummary {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data.Dashboard
}

func (s *Store) Sales() []domain.SalesPoint {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]domain.SalesPoint(nil), s.data.Sales...)
}

func (s *Store) BotUsers() []domain.BotUser {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]domain.BotUser(nil), s.data.BotUsers...)
}

func (s *Store) Leaderboard() []domain.AdminScore {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return append([]domain.AdminScore(nil), s.data.Leaderboard...)
}

func (s *Store) Pricing() domain.PricingSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data.Pricing
}

func (s *Store) SavePricing(next domain.PricingSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if next.Currency == "" {
		next.Currency = s.data.Pricing.Currency
	}
	if next.Variables == nil {
		next.Variables = map[string]string{}
	}
	next.UpdatedAt = time.Now().UTC()
	s.data.Pricing = next
	s.data.UpdatedAt = next.UpdatedAt
	return s.flushLocked()
}

func (s *Store) General() domain.GeneralSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()

	username := "admin"
	if len(s.data.Admins) > 0 {
		username = s.data.Admins[0].Username
	}
	return domain.GeneralSettings{
		PanelName:     s.data.Panel.PanelName,
		PublicBaseURL: s.data.Panel.PublicBaseURL,
		AdminUsername: username,
		UpdatedAt:     s.data.UpdatedAt,
	}
}

func (s *Store) SaveGeneral(next domain.GeneralSettingsUpdate) (domain.GeneralSettings, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if next.PanelName != "" {
		s.data.Panel.PanelName = next.PanelName
	}
	if next.PublicBaseURL != "" {
		s.data.Panel.PublicBaseURL = next.PublicBaseURL
	}
	if len(s.data.Admins) == 0 {
		admin, err := newAdmin("admin", "Owner", "owner", "ChangeMe123!")
		if err != nil {
			return domain.GeneralSettings{}, err
		}
		s.data.Admins = append(s.data.Admins, admin)
	}
	if next.AdminUsername != "" {
		s.data.Admins[0].Username = next.AdminUsername
	}
	if next.AdminPassword != "" {
		salt, err := randomBytes(16)
		if err != nil {
			return domain.GeneralSettings{}, err
		}
		s.data.Admins[0].PasswordSalt = base64.RawStdEncoding.EncodeToString(salt)
		s.data.Admins[0].PasswordHash = hashPassword(next.AdminPassword, salt)
	}
	now := time.Now().UTC()
	s.data.Panel.UpdatedAt = now
	s.data.UpdatedAt = now
	if err := s.flushLocked(); err != nil {
		return domain.GeneralSettings{}, err
	}
	return domain.GeneralSettings{
		PanelName:     s.data.Panel.PanelName,
		PublicBaseURL: s.data.Panel.PublicBaseURL,
		AdminUsername: s.data.Admins[0].Username,
		UpdatedAt:     s.data.UpdatedAt,
	}, nil
}

func (s *Store) Panel() domain.PanelSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data.Panel
}

func (s *Store) SavePanel(next domain.PanelSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if next.PanelName == "" {
		next.PanelName = s.data.Panel.PanelName
	}
	if next.TelegramOwnerID == "" {
		next.TelegramOwnerID = next.TelegramAdminChat
	}
	next.UpdatedAt = time.Now().UTC()
	s.data.Panel = next
	s.data.UpdatedAt = next.UpdatedAt
	return s.flushLocked()
}

func (s *Store) Panels() []domain.PasarGuardPanel {
	s.mu.RLock()
	defer s.mu.RUnlock()

	panels := make([]domain.PasarGuardPanel, 0, len(s.data.Panels))
	for _, panel := range s.data.Panels {
		panels = append(panels, publicPanel(panel))
	}
	return panels
}

func (s *Store) PanelByID(id string) (domain.PasarGuardPanel, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, panel := range s.data.Panels {
		if panel.ID == id {
			return panel, true
		}
	}
	return domain.PasarGuardPanel{}, false
}

func (s *Store) ActivePanel() (domain.PasarGuardPanel, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, panel := range s.data.Panels {
		if panel.Status == "connected" && panel.AccessToken != "" {
			return panel, true
		}
	}
	if len(s.data.Panels) > 0 {
		return s.data.Panels[0], true
	}
	return domain.PasarGuardPanel{}, false
}

func (s *Store) SavePanelConnection(input domain.PasarGuardPanelInput, accessToken, tokenType, statusText, lastError string) (domain.PasarGuardPanel, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	baseURL := strings.TrimRight(strings.TrimSpace(input.BaseURL), "/")
	name := strings.TrimSpace(input.Name)
	if name == "" {
		name = panelDisplayName(baseURL, input.Username)
	}

	panel := domain.PasarGuardPanel{
		Name:               name,
		BaseURL:            baseURL,
		Username:           strings.TrimSpace(input.Username),
		Password:           input.Password,
		PasswordConfigured: input.Password != "",
		AccessToken:        accessToken,
		TokenType:          tokenType,
		Status:             statusText,
		LastError:          lastError,
		UpdatedAt:          now,
		LastTestedAt:       now,
	}

	newID, err := randomID()
	if err != nil {
		return domain.PasarGuardPanel{}, err
	}
	panel.ID = newID
	panel.CreatedAt = now
	s.data.Panels = append(s.data.Panels, panel)
	s.data.UpdatedAt = now
	return publicPanel(panel), s.flushLocked()
}

func (s *Store) UpdatePanelConnection(id string, input domain.PasarGuardPanelInput, accessToken, tokenType, statusText, lastError string) (domain.PasarGuardPanel, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	for i, panel := range s.data.Panels {
		if panel.ID != id {
			continue
		}
		if strings.TrimSpace(input.Name) != "" {
			panel.Name = strings.TrimSpace(input.Name)
		}
		if strings.TrimSpace(input.BaseURL) != "" {
			panel.BaseURL = strings.TrimRight(strings.TrimSpace(input.BaseURL), "/")
		}
		if strings.TrimSpace(input.Username) != "" {
			panel.Username = strings.TrimSpace(input.Username)
		}
		if input.Password != "" {
			panel.Password = input.Password
			panel.PasswordConfigured = true
		}
		if accessToken != "" {
			panel.AccessToken = accessToken
		}
		if tokenType != "" {
			panel.TokenType = tokenType
		}
		panel.Status = statusText
		panel.LastError = lastError
		panel.UpdatedAt = now
		panel.LastTestedAt = now
		s.data.Panels[i] = panel
		s.data.UpdatedAt = now
		return publicPanel(panel), s.flushLocked()
	}
	return domain.PasarGuardPanel{}, ErrNotFound
}

func (s *Store) DeletePanelConnection(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i, panel := range s.data.Panels {
		if panel.ID == id {
			s.data.Panels = append(s.data.Panels[:i], s.data.Panels[i+1:]...)
			s.data.UpdatedAt = time.Now().UTC()
			return s.flushLocked()
		}
	}
	return ErrNotFound
}

func (s *Store) MarkBotUser(username, telegramID, planName, status string, dataLimitGB float64, expiresAt time.Time) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	for i, user := range s.data.BotUsers {
		if user.Username == username || user.TelegramID == telegramID {
			user.Username = username
			user.TelegramID = telegramID
			user.PlanName = planName
			user.Status = status
			user.DataLimitGB = dataLimitGB
			user.CreatedByBot = true
			user.ExpiresAt = expiresAt
			if user.CreatedAt.IsZero() {
				user.CreatedAt = now
			}
			s.data.BotUsers[i] = user
			s.data.UpdatedAt = now
			return s.flushLocked()
		}
	}
	s.data.BotUsers = append(s.data.BotUsers, domain.BotUser{
		ID:           "bot-" + username,
		Username:     username,
		TelegramID:   telegramID,
		PlanName:     planName,
		Status:       status,
		DataLimitGB:  dataLimitGB,
		CreatedByBot: true,
		CreatedAt:    now,
		ExpiresAt:    expiresAt,
	})
	s.data.UpdatedAt = now
	return s.flushLocked()
}

func publicPanel(panel domain.PasarGuardPanel) domain.PasarGuardPanel {
	panel.PasswordConfigured = panel.Password != ""
	panel.Password = ""
	panel.AccessToken = ""
	return panel
}

func panelDisplayName(baseURL, username string) string {
	parsed, err := url.Parse(baseURL)
	if err == nil && parsed.Host != "" {
		if username != "" {
			return username + " @ " + parsed.Host
		}
		return parsed.Host
	}
	if username != "" {
		return username + " panel"
	}
	return "Connected Panel"
}

func (s *Store) load() error {
	raw, err := os.ReadFile(s.path)
	if err != nil {
		return err
	}
	if len(raw) == 0 {
		s.data = defaultSnapshot()
		return s.flush()
	}
	if err := json.Unmarshal(raw, &s.data); err != nil {
		return fmt.Errorf("decode database: %w", err)
	}
	return nil
}

func (s *Store) flush() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.flushLocked()
}

func (s *Store) flushLocked() error {
	tmp := s.path + ".tmp"
	raw, err := json.MarshalIndent(s.data, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(tmp, raw, 0o640); err != nil {
		return err
	}
	return os.Rename(tmp, s.path)
}

func defaultSnapshot() domain.Snapshot {
	now := time.Now().UTC()
	return domain.Snapshot{
		Dashboard: domain.DashboardSummary{
			Currency:         "Toman",
			LastReconciledAt: now.Format(time.RFC3339),
			PanelStatus:      "not_connected",
			Source:           "local",
		},
		Sales:       []domain.SalesPoint{},
		BotUsers:    []domain.BotUser{},
		Leaderboard: []domain.AdminScore{},
		Pricing: domain.PricingSettings{
			Currency:           "Toman",
			BasePlanPrice:      0,
			RenewalDiscountPct: 0,
			TaxPct:             0,
			CommissionPct:      0,
			Variables:          map[string]string{},
			UpdatedAt:          now,
		},
		Panel: domain.PanelSettings{
			PanelName:          "RetroPanel",
			PublicBaseURL:      "",
			TelegramBotToken:   "",
			TelegramAdminChat:  "",
			TelegramOwnerID:    "",
			DailyReportEnabled: true,
			BotEnabled:         false,
			BotTexts:           "welcome=Welcome to RetroPanel\nplans=Choose your product\nprofile=Your account status\nsupport=Contact support\ntrial=Your trial subscription is being prepared\nwallet=Wallet balance will be shown here\nconnection=Open the connection guide from your service details",
			BotButtons:         "Buy Service | My Services\nTrial Subscription | Wallet\nConnection Guide | Support",
			BotButtonStatus:    "buy=true\nservices=true\ntrial=true\nwallet=true\nconnection=true\nsupport=true\nadmin_panel=true",
			UpdatedAt:          now,
		},
		UpdatedAt: now,
	}
}

func newAdmin(username, displayName, role, password string) (domain.Admin, error) {
	salt, err := randomBytes(16)
	if err != nil {
		return domain.Admin{}, err
	}
	id, err := randomID()
	if err != nil {
		return domain.Admin{}, err
	}
	return domain.Admin{
		ID:           id,
		Username:     username,
		DisplayName:  displayName,
		Role:         role,
		PasswordSalt: base64.RawStdEncoding.EncodeToString(salt),
		PasswordHash: hashPassword(password, salt),
		CreatedAt:    time.Now().UTC(),
	}, nil
}

func publicAdmin(admin domain.Admin) domain.Admin {
	admin.PasswordHash = ""
	admin.PasswordSalt = ""
	return admin
}

func randomID() (string, error) {
	b, err := randomBytes(16)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func randomBytes(size int) ([]byte, error) {
	buf := make([]byte, size)
	_, err := rand.Read(buf)
	return buf, err
}

func hashPassword(password string, salt []byte) string {
	key := pbkdf2SHA256([]byte(password), salt, 120000, 32)
	return base64.RawStdEncoding.EncodeToString(key)
}

func verifyPassword(password, saltText, expectedText string) bool {
	salt, err := base64.RawStdEncoding.DecodeString(saltText)
	if err != nil {
		return false
	}
	actual := hashPassword(password, salt)
	return hmac.Equal([]byte(actual), []byte(expectedText))
}

func pbkdf2SHA256(password, salt []byte, iterations, keyLen int) []byte {
	hLen := sha256.Size
	numBlocks := (keyLen + hLen - 1) / hLen
	out := make([]byte, 0, numBlocks*hLen)
	for block := 1; block <= numBlocks; block++ {
		mac := hmac.New(sha256.New, password)
		mac.Write(salt)
		mac.Write([]byte{byte(block >> 24), byte(block >> 16), byte(block >> 8), byte(block)})
		u := mac.Sum(nil)
		t := append([]byte(nil), u...)
		for i := 1; i < iterations; i++ {
			mac = hmac.New(sha256.New, password)
			mac.Write(u)
			u = mac.Sum(nil)
			for j := range t {
				t[j] ^= u[j]
			}
		}
		out = append(out, t...)
	}
	return out[:keyLen]
}
