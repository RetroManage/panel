package pasarguard

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Credentials struct {
	BaseURL  string
	Username string
	Password string
}

type Token struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
}

type AdminDetails struct {
	ID       any    `json:"id,omitempty"`
	Username string `json:"username"`
	Status   string `json:"status,omitempty"`
}

type TestResult struct {
	OK       bool         `json:"ok"`
	BaseURL  string       `json:"baseUrl"`
	Username string       `json:"username"`
	Admin    AdminDetails `json:"admin,omitempty"`
	Message  string       `json:"message"`
}

type CreateUserPayload struct {
	Username               string         `json:"username"`
	Status                 string         `json:"status,omitempty"`
	Expire                 any            `json:"expire,omitempty"`
	DataLimit              int64          `json:"data_limit,omitempty"`
	DataLimitResetStrategy string         `json:"data_limit_reset_strategy,omitempty"`
	GroupIDs               []int          `json:"group_ids,omitempty"`
	Note                   string         `json:"note,omitempty"`
	ProxySettings          map[string]any `json:"proxy_settings,omitempty"`
}

type Client struct {
	http *http.Client
}

func NewClient() *Client {
	return &Client{http: &http.Client{Timeout: 20 * time.Second}}
}

func NormalizeBaseURL(raw string) (string, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return "", errors.New("base URL is required")
	}
	if !strings.HasPrefix(value, "http://") && !strings.HasPrefix(value, "https://") {
		value = "https://" + value
	}
	parsed, err := url.Parse(value)
	if err != nil || parsed.Host == "" {
		return "", errors.New("invalid base URL")
	}
	parsed.Path = strings.TrimRight(parsed.Path, "/")
	parsed.RawQuery = ""
	parsed.Fragment = ""
	return strings.TrimRight(parsed.String(), "/"), nil
}

func (c *Client) Login(ctx context.Context, cred Credentials) (Token, error) {
	baseURL, err := NormalizeBaseURL(cred.BaseURL)
	if err != nil {
		return Token{}, err
	}
	if strings.TrimSpace(cred.Username) == "" || cred.Password == "" {
		return Token{}, errors.New("username and password are required")
	}

	form := url.Values{}
	form.Set("username", cred.Username)
	form.Set("password", cred.Password)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/api/admin/token", strings.NewReader(form.Encode()))
	if err != nil {
		return Token{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	var token Token
	if err := c.doJSON(req, &token); err != nil {
		return Token{}, err
	}
	if token.AccessToken == "" {
		return Token{}, errors.New("PasarGuard returned an empty access token")
	}
	if token.TokenType == "" {
		token.TokenType = "bearer"
	}
	return token, nil
}

func (c *Client) CurrentAdmin(ctx context.Context, baseURL, accessToken string) (AdminDetails, error) {
	baseURL, err := NormalizeBaseURL(baseURL)
	if err != nil {
		return AdminDetails{}, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+"/api/admin", nil)
	if err != nil {
		return AdminDetails{}, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	var admin AdminDetails
	if err := c.doJSON(req, &admin); err != nil {
		return AdminDetails{}, err
	}
	if admin.Username == "" {
		return AdminDetails{}, errors.New("PasarGuard admin validation response is missing username")
	}
	return admin, nil
}

func (c *Client) Test(ctx context.Context, cred Credentials) (TestResult, Token, error) {
	baseURL, err := NormalizeBaseURL(cred.BaseURL)
	if err != nil {
		return TestResult{OK: false, Message: err.Error()}, Token{}, err
	}
	cred.BaseURL = baseURL
	token, err := c.Login(ctx, cred)
	if err != nil {
		return TestResult{OK: false, BaseURL: baseURL, Username: cred.Username, Message: err.Error()}, Token{}, err
	}
	admin, err := c.CurrentAdmin(ctx, baseURL, token.AccessToken)
	if err != nil {
		return TestResult{OK: false, BaseURL: baseURL, Username: cred.Username, Message: err.Error()}, Token{}, err
	}
	return TestResult{OK: true, BaseURL: baseURL, Username: cred.Username, Admin: admin, Message: "Connection verified successfully"}, token, nil
}

func (c *Client) CreateUser(ctx context.Context, baseURL, accessToken string, payload CreateUserPayload) (map[string]any, error) {
	baseURL, err := NormalizeBaseURL(baseURL)
	if err != nil {
		return nil, err
	}
	if payload.Username == "" {
		return nil, errors.New("username is required")
	}
	if payload.Status == "" {
		payload.Status = "active"
	}
	if payload.DataLimitResetStrategy == "" {
		payload.DataLimitResetStrategy = "no_reset"
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/api/user", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	var result map[string]any
	if err := c.doJSON(req, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func (c *Client) GetUser(ctx context.Context, baseURL, accessToken, username string) (map[string]any, error) {
	baseURL, err := NormalizeBaseURL(baseURL)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(username) == "" {
		return nil, errors.New("username is required")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+"/api/user/by-username/"+url.PathEscape(username), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	var result map[string]any
	if err := c.doJSON(req, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func (c *Client) Users(ctx context.Context, baseURL, accessToken string) ([]map[string]any, int, error) {
	baseURL, err := NormalizeBaseURL(baseURL)
	if err != nil {
		return nil, 0, err
	}
	var raw any
	if err := c.authenticatedGet(ctx, baseURL+"/api/users", accessToken, &raw); err != nil {
		return nil, 0, err
	}
	users := extractAnyMapSlice(raw, "users", "items", "data", "results")
	total := len(users)
	if object, ok := raw.(map[string]any); ok {
		if declared := int(numberFromKeys(object, "total", "count", "total_users")); declared > 0 {
			total = declared
		}
	}
	return users, total, nil
}

func extractAnyMapSlice(raw any, keys ...string) []map[string]any {
	switch value := raw.(type) {
	case []any:
		items := make([]map[string]any, 0, len(value))
		for _, row := range value {
			if item, ok := row.(map[string]any); ok {
				items = append(items, item)
			}
		}
		return items
	case map[string]any:
		return extractMapSlice(value, keys...)
	default:
		return nil
	}
}

func (c *Client) SystemStats(ctx context.Context, baseURL, accessToken string) (map[string]any, error) {
	baseURL, err := NormalizeBaseURL(baseURL)
	if err != nil {
		return nil, err
	}
	var raw map[string]any
	if err := c.authenticatedGet(ctx, baseURL+"/api/system", accessToken, &raw); err != nil {
		return nil, err
	}
	return raw, nil
}

func (c *Client) SystemUsersStats(ctx context.Context, baseURL, accessToken string) (map[string]any, error) {
	baseURL, err := NormalizeBaseURL(baseURL)
	if err != nil {
		return nil, err
	}
	var raw map[string]any
	if err := c.authenticatedGet(ctx, baseURL+"/api/system/users", accessToken, &raw); err != nil {
		return nil, err
	}
	return raw, nil
}

func (c *Client) authenticatedGet(ctx context.Context, endpoint, accessToken string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	return c.doJSON(req, out)
}

func extractMapSlice(raw map[string]any, keys ...string) []map[string]any {
	for _, key := range keys {
		value, ok := raw[key]
		if !ok {
			continue
		}
		if rows, ok := value.([]any); ok {
			items := make([]map[string]any, 0, len(rows))
			for _, row := range rows {
				if item, ok := row.(map[string]any); ok {
					items = append(items, item)
				}
			}
			return items
		}
		if nested, ok := value.(map[string]any); ok {
			items := extractMapSlice(nested, "users", "items", "data", "results")
			if len(items) > 0 {
				return items
			}
		}
	}
	return nil
}

func numberFromKeys(raw map[string]any, keys ...string) float64 {
	for _, key := range keys {
		if value, ok := raw[key]; ok {
			if number, ok := asNumber(value); ok {
				return number
			}
		}
	}
	return 0
}

func asNumber(value any) (float64, bool) {
	switch v := value.(type) {
	case float64:
		return v, true
	case float32:
		return float64(v), true
	case int:
		return float64(v), true
	case int64:
		return float64(v), true
	case json.Number:
		parsed, err := v.Float64()
		return parsed, err == nil
	}
	return 0, false
}

func (c *Client) doJSON(req *http.Request, out any) error {
	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	raw, _ := io.ReadAll(io.LimitReader(res.Body, 1<<20))
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("PasarGuard request failed: %s: %s", res.Status, extractAPIError(raw))
	}
	if out == nil {
		return nil
	}
	if len(raw) == 0 {
		return errors.New("empty response from PasarGuard")
	}
	if err := json.Unmarshal(raw, out); err != nil {
		return fmt.Errorf("decode PasarGuard response: %w", err)
	}
	return nil
}

func extractAPIError(raw []byte) string {
	if len(raw) == 0 {
		return "empty response"
	}
	var obj map[string]any
	if err := json.Unmarshal(raw, &obj); err == nil {
		for _, key := range []string{"detail", "error", "message"} {
			if value, ok := obj[key]; ok {
				return fmt.Sprint(value)
			}
		}
	}
	text := strings.TrimSpace(string(raw))
	if len(text) > 400 {
		text = text[:400]
	}
	return text
}
