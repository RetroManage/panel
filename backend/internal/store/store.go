package store

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
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

func (s *Store) Panel() domain.PanelSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.data.Panel
}

func (s *Store) SavePanel(next domain.PanelSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	next.UpdatedAt = time.Now().UTC()
	s.data.Panel = next
	s.data.UpdatedAt = next.UpdatedAt
	return s.flushLocked()
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
			GrossSales:       184500000,
			NetRevenue:       151200000,
			OpenInvoices:     12,
			ConversionRate:   37.8,
			ActiveAdmins:     4,
			Currency:         "IRR",
			LastReconciledAt: now.Format(time.RFC3339),
		},
		Sales: []domain.SalesPoint{
			{Label: "Mon", Amount: 18000000, Orders: 9},
			{Label: "Tue", Amount: 26500000, Orders: 13},
			{Label: "Wed", Amount: 31000000, Orders: 15},
			{Label: "Thu", Amount: 22700000, Orders: 11},
			{Label: "Fri", Amount: 39200000, Orders: 18},
			{Label: "Sat", Amount: 47100000, Orders: 21},
		},
		Leaderboard: []domain.AdminScore{
			{AdminID: "seed-1", DisplayName: "Nika Moradi", ClosedDeals: 42, Revenue: 68000000, CollectionPct: 96.2},
			{AdminID: "seed-2", DisplayName: "Arman Salehi", ClosedDeals: 38, Revenue: 61200000, CollectionPct: 92.4},
			{AdminID: "seed-3", DisplayName: "Sara Rahimi", ClosedDeals: 31, Revenue: 48500000, CollectionPct: 89.1},
		},
		Pricing: domain.PricingSettings{
			Currency:           "IRR",
			BasePlanPrice:      3200000,
			RenewalDiscountPct: 7.5,
			TaxPct:             9,
			CommissionPct:      12,
			Variables: map[string]string{
				"support_fee": "250000",
				"gateway_fee": "1.2%",
				"trial_days":  "3",
			},
			UpdatedAt: now,
		},
		Panel: domain.PanelSettings{
			PanelName:          "RetroPanel Accounting",
			PublicBaseURL:      "https://panel.example.com",
			TelegramBotToken:   "",
			TelegramAdminChat:  "",
			DailyReportEnabled: true,
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
