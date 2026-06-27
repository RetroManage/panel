package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"retropanel/backend/internal/domain"
	"retropanel/backend/internal/pasarguard"
	"retropanel/backend/internal/store"
)

type Manager struct {
	store  *store.Store
	logger *slog.Logger
	client *http.Client
	pg     *pasarguard.Client

	mu       sync.Mutex
	cancel   context.CancelFunc
	settings domain.PanelSettings
	running  bool
}

type apiResponse struct {
	OK          bool            `json:"ok"`
	Description string          `json:"description"`
	Result      json.RawMessage `json:"result"`
}

type update struct {
	UpdateID int64    `json:"update_id"`
	Message  *message `json:"message"`
}

type message struct {
	MessageID int64  `json:"message_id"`
	Chat      chat   `json:"chat"`
	From      *user  `json:"from"`
	Text      string `json:"text"`
}

type chat struct {
	ID        int64  `json:"id"`
	Type      string `json:"type"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
}

type user struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
}

func NewManager(db *store.Store, logger *slog.Logger, pg *pasarguard.Client) *Manager {
	return &Manager{
		store:  db,
		logger: logger,
		pg:     pg,
		client: &http.Client{Timeout: 35 * time.Second},
	}
}

func ValidateToken(ctx context.Context, token string) error {
	token = strings.TrimSpace(token)
	if token == "" {
		return errors.New("telegram bot token is required")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint(token, "getMe"), nil)
	if err != nil {
		return err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	var decoded apiResponse
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return fmt.Errorf("telegram response decode failed: %w", err)
	}
	if !decoded.OK {
		if decoded.Description != "" {
			return errors.New(decoded.Description)
		}
		return fmt.Errorf("telegram token validation failed: %s", res.Status)
	}
	return nil
}

func (m *Manager) Apply(settings domain.PanelSettings) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !settings.BotEnabled || strings.TrimSpace(settings.TelegramBotToken) == "" {
		m.stopLocked()
		m.settings = settings
		return nil
	}
	if err := ValidateToken(context.Background(), settings.TelegramBotToken); err != nil {
		return err
	}
	if err := m.clearWebhook(context.Background(), settings.TelegramBotToken); err != nil {
		return err
	}
	if m.running && settings.TelegramBotToken == m.settings.TelegramBotToken {
		m.settings = settings
		return nil
	}
	m.stopLocked()
	ctx, cancel := context.WithCancel(context.Background())
	m.cancel = cancel
	m.settings = settings
	m.running = true
	go m.run(ctx, settings.TelegramBotToken)
	return nil
}

func (m *Manager) Stop() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.stopLocked()
}

func (m *Manager) stopLocked() {
	if m.cancel != nil {
		m.cancel()
		m.cancel = nil
	}
	m.running = false
}

func (m *Manager) run(ctx context.Context, token string) {
	m.logger.Info("telegram bot polling started")
	defer m.logger.Info("telegram bot polling stopped")

	var offset int64
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}
		updates, err := m.getUpdates(ctx, token, offset)
		if err != nil {
			m.logger.Warn("telegram getUpdates failed", "error", err)
			select {
			case <-ctx.Done():
				return
			case <-time.After(5 * time.Second):
			}
			continue
		}
		for _, item := range updates {
			if item.UpdateID >= offset {
				offset = item.UpdateID + 1
			}
			if item.Message != nil {
				m.handleMessage(ctx, token, *item.Message)
			}
		}
	}
}

func (m *Manager) clearWebhook(ctx context.Context, token string) error {
	payload := map[string]any{"drop_pending_updates": false}
	return m.call(ctx, token, "deleteWebhook", payload, nil)
}

func (m *Manager) getUpdates(ctx context.Context, token string, offset int64) ([]update, error) {
	values := url.Values{}
	values.Set("timeout", "30")
	if offset > 0 {
		values.Set("offset", strconv.FormatInt(offset, 10))
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint(token, "getUpdates")+"?"+values.Encode(), nil)
	if err != nil {
		return nil, err
	}
	res, err := m.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(res.Body, 2<<20))
	var decoded apiResponse
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return nil, err
	}
	if !decoded.OK {
		return nil, errors.New(decoded.Description)
	}
	var updates []update
	if err := json.Unmarshal(decoded.Result, &updates); err != nil {
		return nil, err
	}
	return updates, nil
}

func (m *Manager) handleMessage(ctx context.Context, token string, msg message) {
	text := strings.TrimSpace(msg.Text)
	chatID := msg.Chat.ID
	settings := m.snapshotSettings()

	switch strings.ToLower(text) {
	case "/start", "start", "menu", "":
		m.sendMenu(ctx, token, chatID, textValue(settings, "welcome", "Welcome to RetroPanel. Choose an option:"), settings)
	case "trial subscription":
		m.createTrial(ctx, token, msg, settings)
	case "my services":
		m.showService(ctx, token, msg, settings)
	case "buy service":
		m.sendMenu(ctx, token, chatID, textValue(settings, "plans", "Product purchase is ready for the next release. Contact support to complete your order."), settings)
	case "wallet":
		m.sendMenu(ctx, token, chatID, textValue(settings, "wallet", "Wallet balance will be shown here."), settings)
	case "connection guide":
		m.sendMenu(ctx, token, chatID, textValue(settings, "connection", "Open your service details to receive the connection guide."), settings)
	case "support":
		m.sendMenu(ctx, token, chatID, textValue(settings, "support", "Support will contact you soon."), settings)
	case "admin panel":
		if isOwner(settings, chatID) {
			m.sendMenu(ctx, token, chatID, "Admin Panel\nUsers, orders, broadcasts, payments, and panel actions are reserved for the next admin-bot release.", settings)
		} else {
			m.sendMenu(ctx, token, chatID, "This section is available only for the bot owner.", settings)
		}
	default:
		m.sendMenu(ctx, token, chatID, "Command not recognized. Choose an option from the menu.", settings)
	}
}

func (m *Manager) createTrial(ctx context.Context, token string, msg message, settings domain.PanelSettings) {
	panel, ok := m.store.ActivePanel()
	if !ok || panel.Password == "" {
		m.sendMenu(ctx, token, msg.Chat.ID, "No connected PasarGuard panel is configured yet.", settings)
		return
	}
	username := fmt.Sprintf("tg_%d", msg.Chat.ID)
	expiresAt := time.Now().UTC().Add(24 * time.Hour)
	pgToken, err := m.pg.Login(ctx, pasarguard.Credentials{BaseURL: panel.BaseURL, Username: panel.Username, Password: panel.Password})
	if err != nil {
		m.sendMenu(ctx, token, msg.Chat.ID, "PasarGuard login failed: "+err.Error(), settings)
		return
	}
	_, err = m.pg.CreateUser(ctx, panel.BaseURL, pgToken.AccessToken, pasarguard.CreateUserPayload{
		Username:               username,
		Status:                 "active",
		Expire:                 expiresAt.Format(time.RFC3339),
		DataLimit:              1 * 1024 * 1024 * 1024,
		DataLimitResetStrategy: "no_reset",
		Note:                   "Created by RetroPanel Telegram bot trial flow",
	})
	if err != nil {
		if strings.Contains(err.Error(), "409") || strings.Contains(strings.ToLower(err.Error()), "already") {
			m.sendMenu(ctx, token, msg.Chat.ID, "Your trial account already exists. Use My Services to view it.", settings)
			return
		}
		m.sendMenu(ctx, token, msg.Chat.ID, "Could not create trial user: "+err.Error(), settings)
		return
	}
	_ = m.store.MarkBotUser(username, strconv.FormatInt(msg.Chat.ID, 10), "24H Trial", "active", 1, expiresAt)
	m.sendMenu(ctx, token, msg.Chat.ID, "Trial subscription created successfully. Username: "+username, settings)
}

func (m *Manager) showService(ctx context.Context, token string, msg message, settings domain.PanelSettings) {
	panel, ok := m.store.ActivePanel()
	if !ok || panel.Password == "" {
		m.sendMenu(ctx, token, msg.Chat.ID, "No connected PasarGuard panel is configured yet.", settings)
		return
	}
	username := fmt.Sprintf("tg_%d", msg.Chat.ID)
	pgToken, err := m.pg.Login(ctx, pasarguard.Credentials{BaseURL: panel.BaseURL, Username: panel.Username, Password: panel.Password})
	if err != nil {
		m.sendMenu(ctx, token, msg.Chat.ID, "PasarGuard login failed: "+err.Error(), settings)
		return
	}
	user, err := m.pg.GetUser(ctx, panel.BaseURL, pgToken.AccessToken, username)
	if err != nil {
		m.sendMenu(ctx, token, msg.Chat.ID, "No service was found for this Telegram account. Use Trial Subscription first.", settings)
		return
	}
	status := fmt.Sprint(user["status"])
	expire := fmt.Sprint(user["expire"])
	dataLimit := fmt.Sprint(user["data_limit"])
	message := fmt.Sprintf("Your service\nUsername: %s\nStatus: %s\nExpire: %s\nData limit: %s bytes", username, status, expire, dataLimit)
	m.sendMenu(ctx, token, msg.Chat.ID, message, settings)
}

func (m *Manager) sendMenu(ctx context.Context, token string, chatID int64, text string, settings domain.PanelSettings) {
	rows := keyboardRows(settings)
	if isOwner(settings, chatID) && statusEnabled(settings, "admin_panel") {
		rows = append(rows, []map[string]string{{"text": "Admin Panel"}})
	}
	payload := map[string]any{
		"chat_id": chatID,
		"text":    text,
		"reply_markup": map[string]any{
			"keyboard":          rows,
			"resize_keyboard":   true,
			"one_time_keyboard": false,
		},
	}
	if err := m.call(ctx, token, "sendMessage", payload, nil); err != nil {
		m.logger.Warn("telegram sendMessage failed", "error", err)
	}
}

func (m *Manager) call(ctx context.Context, token, method string, payload any, out any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint(token, method), bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	res, err := m.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	var decoded apiResponse
	if err := json.Unmarshal(raw, &decoded); err != nil {
		return err
	}
	if !decoded.OK {
		return errors.New(decoded.Description)
	}
	if out != nil {
		return json.Unmarshal(decoded.Result, out)
	}
	return nil
}

func (m *Manager) snapshotSettings() domain.PanelSettings {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.settings
}

func endpoint(token, method string) string {
	return "https://api.telegram.org/bot" + strings.TrimSpace(token) + "/" + method
}

func keyboardRows(settings domain.PanelSettings) [][]map[string]string {
	layout := strings.TrimSpace(settings.BotButtons)
	if layout == "" {
		layout = "Buy Service | My Services\nTrial Subscription | Wallet\nConnection Guide | Support"
	}
	rows := [][]map[string]string{}
	for _, line := range strings.Split(layout, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		row := []map[string]string{}
		for _, label := range strings.Split(line, "|") {
			label = strings.TrimSpace(label)
			if label == "" {
				continue
			}
			if !buttonLabelEnabled(settings, label) {
				continue
			}
			row = append(row, map[string]string{"text": label})
		}
		if len(row) > 0 {
			rows = append(rows, row)
		}
	}
	return rows
}

func buttonLabelEnabled(settings domain.PanelSettings, label string) bool {
	key := strings.ToLower(strings.ReplaceAll(label, " ", "_"))
	key = strings.ReplaceAll(key, "subscription", "")
	key = strings.Trim(key, "_")
	switch label {
	case "Buy Service":
		key = "buy"
	case "My Services":
		key = "services"
	case "Trial Subscription":
		key = "trial"
	case "Connection Guide":
		key = "connection"
	}
	return statusEnabled(settings, key)
}

func statusEnabled(settings domain.PanelSettings, key string) bool {
	statuses := parseKeyValues(settings.BotButtonStatus)
	value, ok := statuses[key]
	if !ok {
		return true
	}
	return strings.EqualFold(value, "true") || strings.EqualFold(value, "on") || value == "1"
}

func textValue(settings domain.PanelSettings, key, fallback string) string {
	texts := parseKeyValues(settings.BotTexts)
	if value := strings.TrimSpace(texts[key]); value != "" {
		return value
	}
	return fallback
}

func parseKeyValues(input string) map[string]string {
	out := map[string]string{}
	for _, line := range strings.Split(input, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		out[strings.TrimSpace(key)] = strings.TrimSpace(value)
	}
	return out
}

func isOwner(settings domain.PanelSettings, chatID int64) bool {
	owner := strings.TrimSpace(settings.TelegramOwnerID)
	if owner == "" {
		owner = strings.TrimSpace(settings.TelegramAdminChat)
	}
	return owner == strconv.FormatInt(chatID, 10)
}
