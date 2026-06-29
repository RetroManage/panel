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
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode"

	"retropanel/backend/internal/domain"
	"retropanel/backend/internal/pasarguard"
	"retropanel/backend/internal/store"

	tele "gopkg.in/telebot.v4"
)

type Manager struct {
	store  *store.Store
	logger *slog.Logger
	client *http.Client
	pg     *pasarguard.Client

	mu       sync.Mutex
	bot      *tele.Bot
	settings domain.PanelSettings
	running  bool
}

type apiResponse struct {
	OK          bool            `json:"ok"`
	Description string          `json:"description"`
	Result      json.RawMessage `json:"result"`
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
	bot, err := m.newBot(settings.TelegramBotToken)
	if err != nil {
		return err
	}
	m.registerHandlers(bot)
	m.bot = bot
	m.settings = settings
	m.running = true

	go func() {
		m.logger.Info("telegram bot polling started")
		bot.Start()
		m.logger.Info("telegram bot polling stopped")
	}()

	return nil
}

func (m *Manager) Stop() {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.stopLocked()
}

func (m *Manager) stopLocked() {
	if m.bot != nil {
		m.bot.Stop()
		m.bot = nil
	}
	m.running = false
}

func (m *Manager) newBot(token string) (*tele.Bot, error) {
	return tele.NewBot(tele.Settings{
		Token:  strings.TrimSpace(token),
		Client: m.client,
		Poller: &tele.LongPoller{Timeout: 30 * time.Second},
	})
}

func (m *Manager) registerHandlers(bot *tele.Bot) {
	bot.Handle(tele.OnText, func(c tele.Context) error {
		if err := m.handleMessage(c); err != nil {
			m.logger.Warn("telegram message handler failed", "error", err)
			return err
		}
		return nil
	})
}

func (m *Manager) clearWebhook(ctx context.Context, token string) error {
	payload := map[string]any{"drop_pending_updates": false}
	return m.call(ctx, token, "deleteWebhook", payload, nil)
}

func (m *Manager) handleMessage(c tele.Context) error {
	chat := c.Chat()
	if chat == nil {
		return nil
	}
	text := strings.TrimSpace(c.Text())
	settings := m.snapshotSettings()
	action := canonicalButtonKey(text)

	switch {
	case text == "" || text == "/start" || strings.EqualFold(text, "start") || strings.EqualFold(text, "menu"):
		return m.sendMenu(c, textValue(settings, "welcome", "Welcome to RetroPanel. Choose an option:"), settings)
	case action == "trial":
		return m.createTrial(c, settings)
	case action == "services":
		return m.showService(c, settings)
	case action == "buy":
		return m.sendMenu(c, textValue(settings, "plans", "Product purchase is ready for the next release. Contact support to complete your order."), settings)
	case action == "wallet":
		return m.sendMenu(c, textValue(settings, "wallet", "Wallet balance will be shown here."), settings)
	case action == "connection":
		return m.sendMenu(c, textValue(settings, "connection", "Open your service details to receive the connection guide."), settings)
	case action == "support":
		return m.sendMenu(c, textValue(settings, "support", "Support will contact you soon."), settings)
	case action == "admin_panel":
		if isOwner(settings, chat.ID) {
			return m.sendMenu(c, "Admin Panel\nUsers, orders, broadcasts, payments, and panel actions are reserved for the next admin-bot release.", settings)
		}
		return m.sendMenu(c, "This section is available only for the bot owner.", settings)
	default:
		return m.sendMenu(c, "Command not recognized. Choose an option from the menu.", settings)
	}
}

func (m *Manager) createTrial(c tele.Context, settings domain.PanelSettings) error {
	chat := c.Chat()
	if chat == nil {
		return nil
	}
	panel, ok := m.store.ActivePanel()
	if !ok || panel.Password == "" {
		return m.sendMenu(c, "No connected PasarGuard panel is configured yet.", settings)
	}
	username := fmt.Sprintf("tg_%d", chat.ID)
	expiresAt := time.Now().UTC().Add(24 * time.Hour)
	pgToken, err := m.pg.Login(context.Background(), pasarguard.Credentials{BaseURL: panel.BaseURL, Username: panel.Username, Password: panel.Password})
	if err != nil {
		return m.sendMenu(c, "PasarGuard login failed: "+err.Error(), settings)
	}
	_, err = m.pg.CreateUser(context.Background(), panel.BaseURL, pgToken.AccessToken, pasarguard.CreateUserPayload{
		Username:               username,
		Status:                 "active",
		Expire:                 expiresAt.Format(time.RFC3339),
		DataLimit:              1 * 1024 * 1024 * 1024,
		DataLimitResetStrategy: "no_reset",
		Note:                   "Created by RetroPanel Telegram bot trial flow",
	})
	if err != nil {
		if strings.Contains(err.Error(), "409") || strings.Contains(strings.ToLower(err.Error()), "already") {
			return m.sendMenu(c, "Your trial account already exists. Use My Services to view it.", settings)
		}
		return m.sendMenu(c, "Could not create trial user: "+err.Error(), settings)
	}
	_ = m.store.MarkBotUser(username, strconv.FormatInt(chat.ID, 10), "24H Trial", "active", 1, expiresAt)
	return m.sendMenu(c, "Trial subscription created successfully. Username: "+username, settings)
}

func (m *Manager) showService(c tele.Context, settings domain.PanelSettings) error {
	chat := c.Chat()
	if chat == nil {
		return nil
	}
	panel, ok := m.store.ActivePanel()
	if !ok || panel.Password == "" {
		return m.sendMenu(c, "No connected PasarGuard panel is configured yet.", settings)
	}
	username := fmt.Sprintf("tg_%d", chat.ID)
	pgToken, err := m.pg.Login(context.Background(), pasarguard.Credentials{BaseURL: panel.BaseURL, Username: panel.Username, Password: panel.Password})
	if err != nil {
		return m.sendMenu(c, "PasarGuard login failed: "+err.Error(), settings)
	}
	user, err := m.pg.GetUser(context.Background(), panel.BaseURL, pgToken.AccessToken, username)
	if err != nil {
		return m.sendMenu(c, "No service was found for this Telegram account. Use Trial Subscription first.", settings)
	}
	status := fmt.Sprint(user["status"])
	expire := fmt.Sprint(user["expire"])
	dataLimit := fmt.Sprint(user["data_limit"])
	message := fmt.Sprintf("Your service\nUsername: %s\nStatus: %s\nExpire: %s\nData limit: %s bytes", username, status, expire, dataLimit)
	return m.sendMenu(c, message, settings)
}

func (m *Manager) sendMenu(c tele.Context, text string, settings domain.PanelSettings) error {
	chat := c.Chat()
	if chat == nil {
		return nil
	}
	markup := m.keyboardMarkup(settings, chat.ID)
	return c.Send(text, markup)
}

func (m *Manager) keyboardMarkup(settings domain.PanelSettings, chatID int64) *tele.ReplyMarkup {
	markup := &tele.ReplyMarkup{
		ResizeKeyboard:  true,
		OneTimeKeyboard: false,
	}
	labels := keyboardRows(settings)
	if isOwner(settings, chatID) && statusEnabled(settings, "admin_panel") {
		labels = append(labels, []string{"Admin Panel"})
	}
	rows := make([]tele.Row, 0, len(labels))
	for _, rowLabels := range labels {
		buttons := make([]tele.Btn, 0, len(rowLabels))
		for _, label := range rowLabels {
			buttons = append(buttons, markup.Text(label))
		}
		if len(buttons) > 0 {
			rows = append(rows, markup.Row(buttons...))
		}
	}
	markup.Reply(rows...)
	return markup
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

func keyboardRows(settings domain.PanelSettings) [][]string {
	layout := strings.TrimSpace(settings.BotButtons)
	if layout == "" {
		layout = "Buy Service | My Services\nTrial Subscription | Wallet\nConnection Guide | Support"
	}
	rows := [][]string{}
	for _, line := range strings.Split(layout, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		row := []string{}
		for _, label := range strings.Split(line, "|") {
			label = strings.TrimSpace(label)
			if label == "" {
				continue
			}
			if !buttonLabelEnabled(settings, label) {
				continue
			}
			row = append(row, label)
		}
		if len(row) > 0 {
			rows = append(rows, row)
		}
	}
	return rows
}

func buttonLabelEnabled(settings domain.PanelSettings, label string) bool {
	key := canonicalButtonKey(label)
	if key == "" {
		return true
	}
	return statusEnabled(settings, key)
}

func canonicalButtonKey(label string) string {
	key := normalizeKey(label)
	switch {
	case key == "start" || key == "menu":
		return key
	case strings.Contains(key, "buy"):
		return "buy"
	case strings.Contains(key, "my_service") || key == "services" || key == "service":
		return "services"
	case strings.Contains(key, "trial"):
		return "trial"
	case strings.Contains(key, "wallet"):
		return "wallet"
	case strings.Contains(key, "connection"):
		return "connection"
	case strings.Contains(key, "support"):
		return "support"
	case strings.Contains(key, "admin") && strings.Contains(key, "panel"):
		return "admin_panel"
	default:
		return key
	}
}

func normalizeKey(input string) string {
	input = strings.ToLower(strings.TrimSpace(input))
	var builder strings.Builder
	lastUnderscore := false
	for _, r := range input {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			builder.WriteRune(r)
			lastUnderscore = false
			continue
		}
		if !lastUnderscore {
			builder.WriteByte('_')
			lastUnderscore = true
		}
	}
	return strings.Trim(builder.String(), "_")
}

func statusEnabled(settings domain.PanelSettings, key string) bool {
	statuses := parseKeyValues(settings.BotButtonStatus)
	value, ok := statuses[key]
	if !ok {
		return true
	}
	return strings.EqualFold(value, "true") || strings.EqualFold(value, "on") || value == "1" || strings.EqualFold(value, "yes")
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
