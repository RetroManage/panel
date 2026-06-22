package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

var ErrInvalidToken = errors.New("invalid token")

type Session struct {
	AdminID   string `json:"sub"`
	Username  string `json:"username"`
	ExpiresAt int64  `json:"exp"`
}

type Manager struct {
	secret []byte
	ttl    time.Duration
}

func NewManager(secret []byte, ttl time.Duration) *Manager {
	return &Manager{secret: secret, ttl: ttl}
}

func (m *Manager) Issue(adminID, username string) (string, time.Time, error) {
	expires := time.Now().Add(m.ttl).UTC()
	payload, err := json.Marshal(Session{AdminID: adminID, Username: username, ExpiresAt: expires.Unix()})
	if err != nil {
		return "", time.Time{}, err
	}
	body := base64.RawURLEncoding.EncodeToString(payload)
	sig := m.sign(body)
	return body + "." + sig, expires, nil
}

func (m *Manager) Parse(token string) (Session, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return Session{}, ErrInvalidToken
	}
	if !hmac.Equal([]byte(parts[1]), []byte(m.sign(parts[0]))) {
		return Session{}, ErrInvalidToken
	}
	raw, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return Session{}, ErrInvalidToken
	}
	var session Session
	if err := json.Unmarshal(raw, &session); err != nil {
		return Session{}, ErrInvalidToken
	}
	if time.Now().Unix() >= session.ExpiresAt {
		return Session{}, ErrInvalidToken
	}
	return session, nil
}

func (m *Manager) sign(body string) string {
	mac := hmac.New(sha256.New, m.secret)
	mac.Write([]byte(body))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
