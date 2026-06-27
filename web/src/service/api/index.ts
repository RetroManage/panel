import { useMutation, useQuery } from '@tanstack/react-query'

export type RoleDetails = {
  name: string
  is_owner: boolean
  permissions: Record<string, Record<string, boolean | { scope: number }>>
}

export type AdminDetails = {
  id?: string
  username: string
  displayName?: string
  display_name?: string
  role: RoleDetails
  status?: 'active' | 'limited' | 'disabled'
  is_limited?: boolean
  is_disabled?: boolean
  used_traffic?: number
  lifetime_used_traffic?: number
  total_users?: number
  data_limit?: number | null
  permission_overrides?: Record<string, any> | null
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

export type BotUser = {
  id: string
  username: string
  telegramId: string
  planName: string
  status: 'active' | 'limited' | 'expired' | 'disabled' | string
  usedTrafficGb: number
  dataLimitGb: number
  totalPaid: number
  discountCodes: number
  createdByBot: boolean
  createdAt: string
  expiresAt: string
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
  updatedAt?: string
}

export type PanelSettings = {
  panelName: string
  publicBaseUrl: string
  telegramBotToken: string
  telegramAdminChat: string
  telegramOwnerId?: string
  dailyReportEnabled: boolean
  botEnabled?: boolean
  botTexts?: string
  botButtons?: string
  botButtonStatus?: string
  updatedAt?: string
}

export type GeneralSettings = {
  panelName: string
  publicBaseUrl: string
  adminUsername: string
  updatedAt?: string
}


export type PasarGuardPanel = {
  id: string
  name: string
  baseUrl: string
  username: string
  passwordConfigured: boolean
  tokenType?: string
  status: 'connected' | 'failed' | string
  lastError?: string
  createdAt: string
  updatedAt: string
  lastTestedAt: string
}

export type PasarGuardPanelPayload = {
  name?: string
  baseUrl: string
  username: string
  password?: string
}

export type PanelConnectionResult = {
  ok: boolean
  message: string
  result?: {
    ok: boolean
    baseUrl: string
    username: string
    message: string
    admin?: { username?: string; status?: string }
  }
  panel?: PasarGuardPanel
  panels?: PasarGuardPanel[]
  error?: string
  testedAt: string
}

export type GeneralSettingsPayload = {
  panelName: string
  publicBaseUrl: string
  adminUsername: string
  adminPassword?: string
}

type LoginPayload = {
  username: string
  password: string
}

const request = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      message = body.error || body.message || message
    } catch {
      // keep default message
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

const normalizeAdmin = (admin: any): AdminDetails => ({
  id: admin.id,
  username: admin.username,
  displayName: admin.displayName || admin.display_name || admin.username,
  display_name: admin.displayName || admin.display_name || admin.username,
  status: 'active',
  is_disabled: false,
  is_limited: false,
  used_traffic: 0,
  lifetime_used_traffic: 0,
  total_users: 0,
  data_limit: null,
  permission_overrides: null,
  role: {
    name: admin.role || 'owner',
    is_owner: true,
    permissions: {
      system: { read: true },
      accounting: { read: true, update: true },
      settings: { read: true, update: true, read_general: true },
      admins: { read: true },
    },
  },
})

export const loginAdmin = async (payload: LoginPayload) => {
  const response = await request<{ admin: any; expiresAt: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return {
    access_token: response.expiresAt,
    admin: normalizeAdmin(response.admin),
  }
}

export const logoutAdmin = async () => {
  return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
}

export const getCurrentAdmin = async (): Promise<AdminDetails> => {
  const response = await request<{ admin: any }>('/api/session')
  return normalizeAdmin(response.admin)
}

export const getDashboardSummary = () => request<DashboardSummary>('/api/dashboard')
export const getSalesStatus = async () => {
  const response = await request<{ items: SalesPoint[] }>('/api/sales')
  return response.items
}
export const getBotUsers = async () => {
  const response = await request<{ items: BotUser[] }>('/api/bot/users')
  return response.items.filter(user => user.createdByBot)
}
export const getAdminLeaderboard = async () => {
  const response = await request<{ items: AdminScore[] }>('/api/admins/leaderboard')
  return response.items
}
export const getPricingSettings = () => request<PricingSettings>('/api/settings/pricing')
export const savePricingSettings = (payload: PricingSettings) =>
  request<PricingSettings>('/api/settings/pricing', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const getGeneralSettings = () => request<GeneralSettings>('/api/settings/general')
export const saveGeneralSettings = (payload: GeneralSettingsPayload) =>
  request<GeneralSettings>('/api/settings/general', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const getPanels = async () => {
  const response = await request<{ items: PasarGuardPanel[] }>('/api/panels')
  return response.items
}
export const testPanelConnection = (payload: PasarGuardPanelPayload) =>
  request<PanelConnectionResult>('/api/panels/test', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const createPanel = (payload: PasarGuardPanelPayload) =>
  request<PanelConnectionResult>('/api/panels', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const updatePanel = ({ id, ...payload }: PasarGuardPanelPayload & { id: string }) =>
  request<PanelConnectionResult>(`/api/panels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
export const deletePanel = (id: string) =>
  request<{ ok: boolean; items: PasarGuardPanel[] }>(`/api/panels/${id}`, {
    method: 'DELETE',
  })

export const getPanelSettings = () => request<PanelSettings>('/api/settings/panel')
export const savePanelSettings = (payload: PanelSettings) =>
  request<PanelSettings>('/api/settings/panel', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const useGetCurrentAdmin = (options?: any) =>
  useQuery({
    queryKey: ['current-admin'],
    queryFn: getCurrentAdmin,
    ...(options?.query || {}),
  })

export const useAdminToken = (options?: any) =>
  useMutation({
    mutationFn: ({ data }: { data: LoginPayload }) => loginAdmin(data),
    ...(options?.mutation || {}),
  })

export const useDashboardSummary = () => useQuery({ queryKey: ['dashboard-summary'], queryFn: getDashboardSummary })
export const useSalesStatus = () => useQuery({ queryKey: ['sales-status'], queryFn: getSalesStatus })
export const useBotUsers = () => useQuery({ queryKey: ['bot-users'], queryFn: getBotUsers })
export const useAdminLeaderboard = () => useQuery({ queryKey: ['admin-leaderboard'], queryFn: getAdminLeaderboard })
export const usePricingSettings = () => useQuery({ queryKey: ['pricing-settings'], queryFn: getPricingSettings })
export const useSavePricingSettings = () => useMutation({ mutationFn: savePricingSettings })
export const useGeneralSettings = () => useQuery({ queryKey: ['general-settings'], queryFn: getGeneralSettings })
export const useSaveGeneralSettings = () => useMutation({ mutationFn: saveGeneralSettings })

export const usePanels = () => useQuery({ queryKey: ['panels'], queryFn: getPanels })
export const useTestPanelConnection = () => useMutation({ mutationFn: testPanelConnection })
export const useCreatePanel = () => useMutation({ mutationFn: createPanel })
export const useUpdatePanel = () => useMutation({ mutationFn: updatePanel })
export const useDeletePanel = () => useMutation({ mutationFn: deletePanel })

export const usePanelSettings = () => useQuery({ queryKey: ['panel-settings'], queryFn: getPanelSettings })
export const useSavePanelSettings = () => useMutation({ mutationFn: savePanelSettings })
