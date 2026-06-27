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
