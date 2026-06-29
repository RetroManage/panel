package http

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"retropanel/backend/internal/domain"
	"retropanel/backend/internal/pasarguard"
)

const bytesPerGB = 1024 * 1024 * 1024

func (s *Server) panelToken(ctx context.Context) (domain.PasarGuardPanel, string, error) {
	panel, ok := s.store.ActivePanel()
	if !ok {
		return domain.PasarGuardPanel{}, "", errors.New("no connected panel is configured")
	}
	if panel.AccessToken != "" {
		return panel, panel.AccessToken, nil
	}
	if panel.Password == "" {
		return domain.PasarGuardPanel{}, "", errors.New("connected panel does not have a stored password")
	}
	token, err := s.pg.Login(ctx, pasarguard.Credentials{BaseURL: panel.BaseURL, Username: panel.Username, Password: panel.Password})
	if err != nil {
		return domain.PasarGuardPanel{}, "", err
	}
	return panel, token.AccessToken, nil
}

func (s *Server) livePanelUsers(ctx context.Context) ([]domain.BotUser, error) {
	panel, token, err := s.panelToken(ctx)
	if err != nil {
		return nil, err
	}
	rows, _, err := s.pg.Users(ctx, panel.BaseURL, token)
	if err != nil {
		return nil, err
	}
	users := make([]domain.BotUser, 0, len(rows))
	for i, row := range rows {
		users = append(users, mapPanelUser(row, i))
	}
	return users, nil
}

func (s *Server) liveDashboard(ctx context.Context) domain.DashboardSummary {
	summary := s.store.Dashboard()
	summary.Currency = "Toman"
	summary.LastReconciledAt = time.Now().UTC().Format(time.RFC3339)
	summary.Source = "upstream"
	grossSales, _ := s.store.ProductTotals()
	summary.GrossSales = grossSales
	summary.OpenInvoices = 0
	pricing := s.store.Pricing()
	deductions := (pricing.TaxPct + pricing.CommissionPct) / 100
	if deductions < 0 {
		deductions = 0
	}
	if deductions > 1 {
		deductions = 1
	}
	summary.NetRevenue = int64(float64(grossSales) * (1 - deductions))

	panel, token, err := s.panelToken(ctx)
	if err != nil {
		summary.PanelStatus = "not_connected"
		summary.RealData = false
		summary.Error = err.Error()
		return summary
	}
	summary.PanelName = panel.Name
	summary.PanelStatus = panel.Status

	if system, err := s.pg.SystemStats(ctx, panel.BaseURL, token); err == nil {
		applySystemStats(&summary, system)
	} else {
		summary.Error = err.Error()
	}

	if usersStats, err := s.pg.SystemUsersStats(ctx, panel.BaseURL, token); err == nil {
		applyUserStats(&summary, usersStats)
	} else if summary.Error == "" {
		summary.Error = err.Error()
	}

	if users, err := s.livePanelUsers(ctx); err == nil {
		if summary.TotalUsers == 0 {
			summary.TotalUsers = len(users)
		}
		if summary.ActiveUsers == 0 && summary.LimitedUsers == 0 && summary.DisabledUsers == 0 && summary.ExpiredUsers == 0 && summary.OnHoldUsers == 0 {
			for _, user := range users {
				switch strings.ToLower(user.Status) {
				case "active":
					summary.ActiveUsers++
				case "limited":
					summary.LimitedUsers++
				case "disabled":
					summary.DisabledUsers++
				case "expired":
					summary.ExpiredUsers++
				case "on_hold", "on hold", "hold":
					summary.OnHoldUsers++
				}
			}
		}
		var traffic float64
		for _, user := range users {
			traffic += user.UsedTrafficGB * bytesPerGB
		}
		if traffic > 0 {
			summary.TotalTrafficBytes = int64(traffic)
		}
	} else if summary.Error == "" {
		summary.Error = err.Error()
	}

	summary.RealData = summary.Error == ""
	if summary.PanelStatus == "" {
		summary.PanelStatus = "connected"
	}
	return summary
}

func applySystemStats(summary *domain.DashboardSummary, raw map[string]any) {
	summary.SystemVersion = stringFromKeys(raw, "version", "core_version", "panel_version")
	summary.UptimeSeconds = int64(numberFromKeys(raw, "uptime_seconds", "uptime"))
	summary.CPUUsage = round1(numberFromKeys(raw, "cpu_usage", "cpu_percent", "cpu"))
	summary.CPUCores = int(numberFromKeys(raw, "cpu_cores", "cores"))
	summary.MemoryTotalBytes = int64(numberFromKeys(raw, "mem_total", "memory_total", "ram_total"))
	summary.MemoryUsedBytes = int64(numberFromKeys(raw, "mem_used", "memory_used", "ram_used"))
	summary.DiskTotalBytes = int64(numberFromKeys(raw, "disk_total", "storage_total"))
	summary.DiskUsedBytes = int64(numberFromKeys(raw, "disk_used", "storage_used"))
	summary.IncomingBandwidth = int64(numberFromKeys(raw, "incoming_bandwidth", "incoming"))
	summary.OutgoingBandwidth = int64(numberFromKeys(raw, "outgoing_bandwidth", "outgoing"))
	applyUserStats(summary, raw)
}

func applyUserStats(summary *domain.DashboardSummary, raw map[string]any) {
	if total := int(numberFromKeys(raw, "total_user", "total_users", "users_total")); total > 0 {
		summary.TotalUsers = total
	}
	summary.OnlineUsers = int(numberFromKeys(raw, "online_users", "online_user"))
	summary.ActiveUsers = int(numberFromKeys(raw, "active_users", "active_user"))
	summary.LimitedUsers = int(numberFromKeys(raw, "limited_users", "limited_user"))
	summary.DisabledUsers = int(numberFromKeys(raw, "disabled_users", "disabled_user"))
	summary.ExpiredUsers = int(numberFromKeys(raw, "expired_users", "expired_user"))
	summary.OnHoldUsers = int(numberFromKeys(raw, "on_hold_users", "on_hold_user", "hold_users"))
}

func mapPanelUser(raw map[string]any, index int) domain.BotUser {
	username := stringFromKeys(raw, "username", "name", "email")
	id := stringFromKeys(raw, "id", "uuid", "username")
	if id == "" {
		id = fmt.Sprintf("user-%d", index+1)
	}
	status := stringFromKeys(raw, "status")
	if status == "" {
		status = "unknown"
	}
	used := numberFromKeys(raw, "used_traffic", "lifetime_used_traffic", "used", "traffic_used")
	limit := numberFromKeys(raw, "data_limit", "traffic_limit", "limit")
	created := timeFromKeys(raw, "created_at", "created", "createdAt")
	expires := timeFromKeys(raw, "expire", "expires_at", "expired_at", "expiresAt")
	plan := stringFromKeys(raw, "plan_name", "plan", "group", "data_limit_reset_strategy")
	if plan == "" {
		plan = "Panel user"
	}
	return domain.BotUser{
		ID:            id,
		Username:      username,
		TelegramID:    stringFromKeys(raw, "telegram_id", "telegramId"),
		PlanName:      plan,
		Status:        status,
		UsedTrafficGB: round1(used / bytesPerGB),
		DataLimitGB:   round1(limit / bytesPerGB),
		TotalPaid:     int64(numberFromKeys(raw, "total_paid", "paid", "revenue")),
		DiscountCodes: int(numberFromKeys(raw, "discount_codes", "discounts")),
		CreatedByBot:  true,
		CreatedAt:     created,
		ExpiresAt:     expires,
	}
}

func stringFromKeys(raw map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := raw[key]; ok {
			switch v := value.(type) {
			case string:
				return strings.TrimSpace(v)
			case fmt.Stringer:
				return strings.TrimSpace(v.String())
			case float64:
				if math.Trunc(v) == v {
					return strconv.FormatInt(int64(v), 10)
				}
				return strconv.FormatFloat(v, 'f', -1, 64)
			case bool:
				return strconv.FormatBool(v)
			}
		}
	}
	return ""
}

func numberFromKeys(raw map[string]any, keys ...string) float64 {
	for _, key := range keys {
		value, ok := raw[key]
		if !ok || value == nil {
			continue
		}
		switch v := value.(type) {
		case float64:
			return v
		case float32:
			return float64(v)
		case int:
			return float64(v)
		case int64:
			return float64(v)
		case jsonNumber:
			parsed, err := strconv.ParseFloat(string(v), 64)
			if err == nil {
				return parsed
			}
		case string:
			parsed, err := strconv.ParseFloat(strings.TrimSpace(v), 64)
			if err == nil {
				return parsed
			}
		}
	}
	return 0
}

type jsonNumber string

func timeFromKeys(raw map[string]any, keys ...string) time.Time {
	for _, key := range keys {
		value, ok := raw[key]
		if !ok || value == nil {
			continue
		}
		if parsed, ok := parseTime(value); ok {
			return parsed.UTC()
		}
	}
	return time.Time{}
}

func parseTime(value any) (time.Time, bool) {
	switch v := value.(type) {
	case string:
		text := strings.TrimSpace(v)
		if text == "" || text == "0" {
			return time.Time{}, false
		}
		for _, layout := range []string{time.RFC3339, "2006-01-02T15:04:05", "2006-01-02 15:04:05", "2006-01-02"} {
			if t, err := time.Parse(layout, text); err == nil {
				return t, true
			}
		}
		if n, err := strconv.ParseFloat(text, 64); err == nil {
			return unixTime(n)
		}
	case float64:
		return unixTime(v)
	case int64:
		return unixTime(float64(v))
	case int:
		return unixTime(float64(v))
	}
	return time.Time{}, false
}

func unixTime(value float64) (time.Time, bool) {
	if value <= 0 {
		return time.Time{}, false
	}
	if value > 1_000_000_000_000 {
		return time.UnixMilli(int64(value)), true
	}
	return time.Unix(int64(value), 0), true
}

func round1(value float64) float64 {
	return math.Round(value*10) / 10
}
