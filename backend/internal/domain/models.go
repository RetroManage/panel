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
	GrossSales        int64   `json:"grossSales"`
	NetRevenue        int64   `json:"netRevenue"`
	OpenInvoices      int     `json:"openInvoices"`
	ConversionRate    float64 `json:"conversionRate"`
	ActiveAdmins      int     `json:"activeAdmins"`
	Currency          string  `json:"currency"`
	LastReconciledAt  string  `json:"lastReconciledAt"`
	TotalUsers        int     `json:"totalUsers"`
	ActiveUsers       int     `json:"activeUsers"`
	OnlineUsers       int     `json:"onlineUsers"`
	LimitedUsers      int     `json:"limitedUsers"`
	ExpiredUsers      int     `json:"expiredUsers"`
	DisabledUsers     int     `json:"disabledUsers"`
	OnHoldUsers       int     `json:"onHoldUsers"`
	TotalTrafficBytes int64   `json:"totalTrafficBytes"`
	IncomingBandwidth int64   `json:"incomingBandwidth"`
	OutgoingBandwidth int64   `json:"outgoingBandwidth"`
	CPUUsage          float64 `json:"cpuUsage"`
	CPUCores          int     `json:"cpuCores"`
	MemoryUsedBytes   int64   `json:"memoryUsedBytes"`
	MemoryTotalBytes  int64   `json:"memoryTotalBytes"`
	DiskUsedBytes     int64   `json:"diskUsedBytes"`
	DiskTotalBytes    int64   `json:"diskTotalBytes"`
	UptimeSeconds     int64   `json:"uptimeSeconds"`
	SystemVersion     string  `json:"systemVersion"`
	PanelStatus       string  `json:"panelStatus"`
	PanelName         string  `json:"panelName"`
	Source            string  `json:"source"`
	RealData          bool    `json:"realData"`
	Error             string  `json:"error,omitempty"`
}

type SalesPoint struct {
	Label  string `json:"label"`
	Amount int64  `json:"amount"`
	Orders int    `json:"orders"`
}

// BotUser represents a user fetched from the connected upstream panel.
type BotUser struct {
	ID            string    `json:"id"`
	Username      string    `json:"username"`
	TelegramID    string    `json:"telegramId"`
	PlanName      string    `json:"planName"`
	Status        string    `json:"status"`
	UsedTrafficGB float64   `json:"usedTrafficGb"`
	DataLimitGB   float64   `json:"dataLimitGb"`
	TotalPaid     int64     `json:"totalPaid"`
	DiscountCodes int       `json:"discountCodes"`
	CreatedByBot  bool      `json:"createdByBot"`
	CreatedAt     time.Time `json:"createdAt"`
	ExpiresAt     time.Time `json:"expiresAt"`
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
	TelegramOwnerID    string    `json:"telegramOwnerId"`
	DailyReportEnabled bool      `json:"dailyReportEnabled"`
	BotEnabled         bool      `json:"botEnabled"`
	BotTexts           string    `json:"botTexts"`
	BotButtons         string    `json:"botButtons"`
	BotButtonStatus    string    `json:"botButtonStatus"`
	UpdatedAt          time.Time `json:"updatedAt"`
}

type GeneralSettings struct {
	PanelName     string    `json:"panelName"`
	PublicBaseURL string    `json:"publicBaseUrl"`
	AdminUsername string    `json:"adminUsername"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type GeneralSettingsUpdate struct {
	PanelName     string `json:"panelName"`
	PublicBaseURL string `json:"publicBaseUrl"`
	AdminUsername string `json:"adminUsername"`
	AdminPassword string `json:"adminPassword"`
}

type PasarGuardPanel struct {
	ID                 string    `json:"id"`
	Name               string    `json:"name"`
	BaseURL            string    `json:"baseUrl"`
	Username           string    `json:"username"`
	Password           string    `json:"-"`
	PasswordConfigured bool      `json:"passwordConfigured"`
	AccessToken        string    `json:"-"`
	TokenType          string    `json:"tokenType,omitempty"`
	Status             string    `json:"status"`
	LastError          string    `json:"lastError,omitempty"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
	LastTestedAt       time.Time `json:"lastTestedAt"`
}

type PasarGuardPanelInput struct {
	Name     string `json:"name"`
	BaseURL  string `json:"baseUrl"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type PasarGuardUserCreateRequest struct {
	PanelID                string `json:"panelId"`
	Username               string `json:"username"`
	Status                 string `json:"status"`
	Expire                 any    `json:"expire"`
	DataLimitGB            int64  `json:"dataLimitGb"`
	DataLimitBytes         int64  `json:"dataLimitBytes"`
	DataLimitResetStrategy string `json:"dataLimitResetStrategy"`
	Note                   string `json:"note"`
}

type Snapshot struct {
	Admins      []Admin           `json:"admins"`
	Dashboard   DashboardSummary  `json:"dashboard"`
	Sales       []SalesPoint      `json:"sales"`
	BotUsers    []BotUser         `json:"botUsers"`
	Leaderboard []AdminScore      `json:"leaderboard"`
	Pricing     PricingSettings   `json:"pricing"`
	Panel       PanelSettings     `json:"panel"`
	Panels      []PasarGuardPanel `json:"panels"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}
