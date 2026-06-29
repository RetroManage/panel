import type { PanelSettings } from '@/service/api'

export const defaultBotTexts = `welcome=Welcome to RetroPanel
plans=Choose your product
profile=Your account status
support=Contact support
trial=Your trial subscription is being prepared
wallet=Wallet balance will be shown here
connection=Open the connection guide from your service details`

export const defaultBotButtons = `Buy Service | My Services
Trial Subscription | Wallet
Connection Guide | Support`

export const defaultBotStatus = `buy=true
services=true
trial=true
wallet=true
connection=true
support=true
admin_panel=true`

export const normalizeBotActionKey = (label: string) => {
  const key = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  if (key === 'start' || key === 'menu') return key
  if (key.includes('buy')) return 'buy'
  if (key.includes('my_service') || key === 'services' || key === 'service') return 'services'
  if (key.includes('trial')) return 'trial'
  if (key.includes('wallet')) return 'wallet'
  if (key.includes('connection')) return 'connection'
  if (key.includes('support')) return 'support'
  if (key.includes('admin') && key.includes('panel')) return 'admin_panel'
  return key
}

export const parseBotButtons = (layout: string): string[][] =>
  layout
    .split('\n')
    .map(row =>
      row
        .split('|')
        .map(button => button.trim())
        .filter(Boolean),
    )
    .filter(row => row.length > 0)

export const stringifyBotButtons = (rows: string[][]) => rows.map(row => row.map(button => button.trim()).filter(Boolean).join(' | ')).filter(Boolean).join('\n')

export const parseBotStatus = (input: string): Record<string, boolean> => {
  const output: Record<string, boolean> = {}
  input.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const [rawKey, ...rest] = trimmed.split('=')
    const key = rawKey.trim()
    if (!key) return
    const value = rest.join('=').trim().toLowerCase()
    output[key] = value === 'true' || value === 'on' || value === '1' || value === 'yes'
  })
  return output
}

export const stringifyBotStatus = (status: Record<string, boolean>, rows: string[][]) => {
  const keys = new Set<string>()
  rows.flat().forEach(label => {
    const key = normalizeBotActionKey(label)
    if (key) keys.add(key)
  })
  Object.keys(status).forEach(key => keys.add(key))
  return Array.from(keys)
    .filter(Boolean)
    .map(key => `${key}=${status[key] ?? true}`)
    .join('\n')
}

export const parseBotTexts = (input: string): Record<string, string> => {
  const output: Record<string, string> = {}
  input.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const [rawKey, ...rest] = trimmed.split('=')
    const key = rawKey.trim()
    if (!key) return
    output[key] = rest.join('=').trim()
  })
  return output
}

export const stringifyBotTexts = (texts: Record<string, string>) =>
  Object.entries(texts)
    .filter(([key]) => key.trim())
    .map(([key, value]) => `${key.trim()}=${value}`)
    .join('\n')

export const panelSettingsDefaults = (settings?: PanelSettings): PanelSettings => ({
  panelName: settings?.panelName || 'RetroPanel',
  publicBaseUrl: settings?.publicBaseUrl || '',
  telegramBotToken: settings?.telegramBotToken || '',
  telegramAdminChat: settings?.telegramAdminChat || settings?.telegramOwnerId || '',
  telegramOwnerId: settings?.telegramOwnerId || settings?.telegramAdminChat || '',
  dailyReportEnabled: settings?.dailyReportEnabled ?? true,
  botEnabled: settings?.botEnabled ?? false,
  botTexts: settings?.botTexts || defaultBotTexts,
  botButtons: settings?.botButtons || defaultBotButtons,
  botButtonStatus: settings?.botButtonStatus || defaultBotStatus,
  updatedAt: settings?.updatedAt,
})
