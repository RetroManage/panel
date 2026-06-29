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
  totalUsers?: number
  activeUsers?: number
  onlineUsers?: number
  limitedUsers?: number
  expiredUsers?: number
  disabledUsers?: number
  onHoldUsers?: number
  totalTrafficBytes?: number
  incomingBandwidth?: number
  outgoingBandwidth?: number
  cpuUsage?: number
  cpuCores?: number
  memoryUsedBytes?: number
  memoryTotalBytes?: number
  diskUsedBytes?: number
  diskTotalBytes?: number
  uptimeSeconds?: number
  systemVersion?: string
  panelStatus?: string
  panelName?: string
  source?: string
  realData?: boolean
  error?: string
}

export type SalesPoint = {
  label: string
  amount: number
  orders: number
}

export type Product = {
  id: string
  name: string
  description: string
  price: number
  currency: string
  dataLimitGb: number
  durationDays: number
  isActive: boolean
  soldCount: number
  revenue: number
  createdAt: string
  updatedAt: string
}

export type ProductPayload = {
  name: string
  description?: string
  price: number
  currency?: string
  dataLimitGb?: number
  durationDays?: number
  isActive?: boolean
  soldCount?: number
  revenue?: number
}

export type SystemResourceStats = {
  cpu_usage: number
  cpu_cores: number
  mem_used: number
  mem_total: number
  disk_used: number
  disk_total: number
  uptime_seconds: number
}

export type SystemUsersStats = {
  total_user: number
  active_users: number
  online_users: number
  limited_users: number
  expired_users: number
  disabled_users: number
  incoming_bandwidth: number
  outgoing_bandwidth: number
}

export type PasarGuardUserCreatePayload = {
  panelId?: string
  username: string
  status?: string
  expire?: string | number | null
  dataLimitGb?: number
  dataLimitBytes?: number
  dataLimitResetStrategy?: string
  note?: string
}

export type PasarGuardUserCreateResult = {
  ok: boolean
  panel: string
  user: unknown
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


export type PanelConnection = {
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

export type PanelConnectionPayload = {
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
  panel?: PanelConnection
  panels?: PanelConnection[]
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
export const getProducts = async () => {
  const response = await request<{ items: Product[] }>('/api/products')
  return response.items
}
export const saveProduct = (payload: ProductPayload & { id?: string }) => {
  const { id, ...body } = payload
  return request<Product>(id ? `/api/products/${id}` : '/api/products', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ currency: 'Toman', isActive: true, ...body }),
  })
}
export const deleteProduct = (id: string) =>
  request<{ ok: boolean; items: Product[] }>(`/api/products/${id}`, {
    method: 'DELETE',
  })

const dashboardToResourceStats = (summary: DashboardSummary): SystemResourceStats => ({
  cpu_usage: summary.cpuUsage || 0,
  cpu_cores: summary.cpuCores || 0,
  mem_used: summary.memoryUsedBytes || 0,
  mem_total: summary.memoryTotalBytes || 0,
  disk_used: summary.diskUsedBytes || 0,
  disk_total: summary.diskTotalBytes || 0,
  uptime_seconds: summary.uptimeSeconds || 0,
})

const dashboardToUsersStats = (summary: DashboardSummary): SystemUsersStats => ({
  total_user: summary.totalUsers || 0,
  active_users: summary.activeUsers || 0,
  online_users: summary.onlineUsers || 0,
  limited_users: summary.limitedUsers || 0,
  expired_users: summary.expiredUsers || 0,
  disabled_users: summary.disabledUsers || 0,
  incoming_bandwidth: summary.incomingBandwidth || 0,
  outgoing_bandwidth: summary.outgoingBandwidth || summary.totalTrafficBytes || 0,
})

export const getSystemResourceStats = async () => dashboardToResourceStats(await getDashboardSummary())
export const getSystemUsersStats = async () => dashboardToUsersStats(await getDashboardSummary())

export const createPasarGuardUser = (payload: PasarGuardUserCreatePayload) =>
  request<PasarGuardUserCreateResult>('/api/pasarguard/users', {
    method: 'POST',
    body: JSON.stringify({
      status: 'active',
      dataLimitResetStrategy: 'no_reset',
      ...payload,
      dataLimitGb: payload.dataLimitGb ? Math.round(payload.dataLimitGb) : undefined,
    }),
  })
export const getBotUsers = async () => {
  const response = await request<{ items: BotUser[]; error?: string }>('/api/bot/users')
  return response.items
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
  const response = await request<{ items: PanelConnection[] }>('/api/panels')
  return response.items
}
export const testPanelConnection = (payload: PanelConnectionPayload) =>
  request<PanelConnectionResult>('/api/panels/test', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const createPanel = (payload: PanelConnectionPayload) =>
  request<PanelConnectionResult>('/api/panels', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const updatePanel = ({ id, ...payload }: PanelConnectionPayload & { id: string }) =>
  request<PanelConnectionResult>(`/api/panels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
export const deletePanel = (id: string) =>
  request<{ ok: boolean; items: PanelConnection[] }>(`/api/panels/${id}`, {
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
export const useProducts = () => useQuery({ queryKey: ['products'], queryFn: getProducts })
export const useSaveProduct = () => useMutation({ mutationFn: saveProduct })
export const useDeleteProduct = () => useMutation({ mutationFn: deleteProduct })
export const useGetSystemResourceStats = (options?: any) =>
  useQuery({ queryKey: ['system-resource-stats'], queryFn: getSystemResourceStats, ...(options?.query || {}) })
export const useGetSystemUsersStats = (_params?: any, options?: any) =>
  useQuery({ queryKey: ['system-users-stats'], queryFn: getSystemUsersStats, ...(options?.query || {}) })
export const useCreatePasarGuardUser = () => useMutation({ mutationFn: createPasarGuardUser })
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
