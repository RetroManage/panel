package domain

import "time"

type Admin struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	DisplayName  string    `json:"displayName"`
	Role         string    `json:"role"`
	PasswordSalt string    `json:"-"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
}

type DashboardSummary struct {
	GrossSales       int64   `json:"grossSales"`
	NetRevenue       int64   `json:"netRevenue"`
	OpenInvoices     int     `json:"openInvoices"`
	ConversionRate   float64 `json:"conversionRate"`
	ActiveAdmins     int     `json:"activeAdmins"`
	Currency         string  `json:"currency"`
	LastReconciledAt string  `json:"lastReconciledAt"`
}

type SalesPoint struct {
	Label  string `json:"label"`
	Amount int64  `json:"amount"`
	Orders int    `json:"orders"`
}

type AdminScore struct {
	AdminID       string  `json:"adminId"`
	DisplayName   string  `json:"displayName"`
	ClosedDeals   int     `json:"closedDeals"`
	Revenue       int64   `json:"revenue"`
	CollectionPct float64 `json:"collectionPct"`
}

type PricingSettings struct {
	Currency           string            `json:"currency"`
	BasePlanPrice      int64             `json:"basePlanPrice"`
	RenewalDiscountPct float64           `json:"renewalDiscountPct"`
	TaxPct             float64           `json:"taxPct"`
	CommissionPct      float64           `json:"commissionPct"`
	Variables          map[string]string `json:"variables"`
	UpdatedAt          time.Time         `json:"updatedAt"`
}

type PanelSettings struct {
	PanelName          string    `json:"panelName"`
	PublicBaseURL      string    `json:"publicBaseUrl"`
	TelegramBotToken   string    `json:"telegramBotToken"`
	TelegramAdminChat  string    `json:"telegramAdminChat"`
	DailyReportEnabled bool      `json:"dailyReportEnabled"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type Snapshot struct {
	Admins      []Admin          `json:"admins"`
	Dashboard   DashboardSummary `json:"dashboard"`
	Sales       []SalesPoint     `json:"sales"`
	Leaderboard []AdminScore     `json:"leaderboard"`
	Pricing     PricingSettings  `json:"pricing"`
	Panel       PanelSettings    `json:"panel"`
	UpdatedAt   time.Time        `json:"updatedAt"`
}
