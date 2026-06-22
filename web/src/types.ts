export type Admin = {
  id: string
  username: string
  displayName: string
  role: string
  createdAt: string
}

export type DashboardSummary = {
  grossSales: number
  netRevenue: number
  openInvoices: number
  conversionRate: number
  activeAdmins: number
  currency: string
  lastReconciledAt: string
}

export type SalesPoint = {
  label: string
  amount: number
  orders: number
}

export type AdminScore = {
  adminId: string
  displayName: string
  closedDeals: number
  revenue: number
  collectionPct: number
}

export type PricingSettings = {
  currency: string
  basePlanPrice: number
  renewalDiscountPct: number
  taxPct: number
  commissionPct: number
  variables: Record<string, string>
  updatedAt: string
}

export type PanelSettings = {
  panelName: string
  publicBaseUrl: string
  telegramBotToken: string
  telegramAdminChat: string
  dailyReportEnabled: boolean
  updatedAt: string
}
