import type { Admin, AdminScore, DashboardSummary, PanelSettings, PricingSettings, SalesPoint } from './types'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`
    try {
      const body = await res.json()
      if (body.error) message = body.error
    } catch {
      // Keep the default message.
    }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

export const api = {
  login(username: string, password: string) {
    return request<{ admin: Admin; expiresAt: string }>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    })
  },
  logout() {
    return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
  },
  session() {
    return request<{ admin: Admin }>('/api/session')
  },
  dashboard() {
    return request<DashboardSummary>('/api/dashboard')
  },
  sales() {
    return request<{ items: SalesPoint[] }>('/api/sales')
  },
  leaderboard() {
    return request<{ items: AdminScore[] }>('/api/admins/leaderboard')
  },
  pricing() {
    return request<PricingSettings>('/api/settings/pricing')
  },
  savePricing(payload: PricingSettings) {
    return request<PricingSettings>('/api/settings/pricing', { method: 'PUT', body: payload })
  },
  panel() {
    return request<PanelSettings>('/api/settings/panel')
  },
  savePanel(payload: PanelSettings) {
    return request<PanelSettings>('/api/settings/panel', { method: 'PUT', body: payload })
  },
}
