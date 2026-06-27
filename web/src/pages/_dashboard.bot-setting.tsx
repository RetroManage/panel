import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { usePanelSettings, useSavePanelSettings } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { Bot, CheckCircle2, Keyboard, Loader2, MessageSquareText, Power, Save, Settings2, ShieldCheck, ToggleLeft } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

type BotTab = 'texts' | 'buttons' | 'status'

const defaultTexts = `welcome=Welcome to RetroPanel\nplans=Choose your product\nprofile=Your account status\nsupport=Contact support\ntrial=Your trial subscription is being prepared\nwallet=Wallet balance will be shown here\nconnection=Open the connection guide from your service details`
const defaultButtons = `Buy Service | My Services\nTrial Subscription | Wallet\nConnection Guide | Support`
const defaultStatus = `buy=true\nservices=true\ntrial=true\nwallet=true\nconnection=true\nsupport=true\nadmin_panel=true`

export default function BotSettingPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = usePanelSettings()
  const savePanel = useSavePanelSettings()
  const [activeTab, setActiveTab] = useState<BotTab>('texts')
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramOwnerId, setTelegramOwnerId] = useState('')
  const [botEnabled, setBotEnabled] = useState(false)
  const [botTexts, setBotTexts] = useState(defaultTexts)
  const [botButtons, setBotButtons] = useState(defaultButtons)
  const [botButtonStatus, setBotButtonStatus] = useState(defaultStatus)

  useEffect(() => {
    if (!data) return
    setTelegramBotToken(data.telegramBotToken || '')
    setTelegramOwnerId(data.telegramOwnerId || data.telegramAdminChat || '')
    setBotEnabled(Boolean(data.botEnabled))
    setBotTexts(data.botTexts || defaultTexts)
    setBotButtons(data.botButtons || defaultButtons)
    setBotButtonStatus(data.botButtonStatus || defaultStatus)
  }, [data])

  const completion = useMemo(() => {
    let score = 0
    if (telegramBotToken.trim()) score += 35
    if (telegramOwnerId.trim()) score += 25
    if (botEnabled) score += 20
    if (botTexts.trim() && botButtons.trim()) score += 20
    return score
  }, [botButtons, botEnabled, botTexts, telegramBotToken, telegramOwnerId])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await savePanel.mutateAsync({
        panelName: data?.panelName || 'RetroPanel Accounting',
        publicBaseUrl: data?.publicBaseUrl || '',
        telegramBotToken,
        telegramAdminChat: telegramOwnerId,
        telegramOwnerId,
        dailyReportEnabled: data?.dailyReportEnabled ?? true,
        botEnabled,
        botTexts,
        botButtons,
        botButtonStatus,
      })
      queryClient.invalidateQueries({ queryKey: ['panel-settings'] })
      toast.success(botEnabled ? 'Bot settings saved and activated' : 'Bot settings saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save bot settings')
    }
  }

  const tabs = [
    { id: 'texts' as const, label: 'Bot Texts', icon: MessageSquareText },
    { id: 'buttons' as const, label: 'Menu Buttons', icon: Keyboard },
    { id: 'status' as const, label: 'Button Status', icon: ToggleLeft },
  ]

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="w-full animate-fade-in transform-gpu" style={{ animationDuration: '520ms' }}>
        <PageHeader title="Bot Setting" description="Telegram bot activation, owner identity, texts, buttons, and button availability." />
        <Separator />
      </div>

      <form onSubmit={onSubmit} className="w-full space-y-4 px-3 pt-4 pb-12 sm:px-4">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <Card className="relative overflow-hidden border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            <div className="from-primary/15 pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent" />
            <CardHeader className="relative border-b bg-primary/5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Bot className="text-primary size-5" /> Telegram Bot</CardTitle>
                  <CardDescription>Token, numeric owner ID, and live activation state.</CardDescription>
                </div>
                <Badge variant={botEnabled ? 'green' : 'orange'}>{botEnabled ? 'Active' : 'Inactive'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-5 pt-5">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-end">
                <div className="space-y-2">
                  <Label htmlFor="telegramBotToken" className="flex items-center gap-2"><ShieldCheck className="text-primary size-4" /> Bot token</Label>
                  <Input id="telegramBotToken" value={telegramBotToken} onChange={event => setTelegramBotToken(event.target.value)} placeholder="123456789:AA..." disabled={isLoading || savePanel.isPending} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegramOwnerId">Owner numeric ID</Label>
                  <Input id="telegramOwnerId" value={telegramOwnerId} onChange={event => setTelegramOwnerId(event.target.value)} placeholder="123456789" disabled={isLoading || savePanel.isPending} />
                </div>
                <div className="border-border/70 flex h-10 items-center justify-between gap-3 rounded-md border bg-muted/30 px-3">
                  <div className="flex items-center gap-2 text-sm font-medium"><Power className="text-primary size-4" /> Active</div>
                  <Switch checked={botEnabled} onCheckedChange={setBotEnabled} disabled={isLoading || savePanel.isPending} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
            <CardHeader>
              <CardTitle>Readiness</CardTitle>
              <CardDescription>Configuration completion for the live Telegram bot backend.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${completion}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ready</span>
                <span className="font-semibold">{completion}%</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between"><span>Token</span>{telegramBotToken ? <CheckCircle2 className="size-4 text-green-500" /> : <span className="text-muted-foreground">Pending</span>}</div>
                <div className="flex items-center justify-between"><span>Owner ID</span>{telegramOwnerId ? <CheckCircle2 className="size-4 text-green-500" /> : <span className="text-muted-foreground">Pending</span>}</div>
                <div className="flex items-center justify-between"><span>Activation</span><Badge variant={botEnabled ? 'green' : 'orange'}>{botEnabled ? 'On' : 'Off'}</Badge></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
          <CardHeader className="border-b bg-muted/25">
            <CardTitle className="flex items-center gap-2"><Settings2 className="text-primary size-5" /> Bot Sections</CardTitle>
            <CardDescription>Configure the live Telegram bot copy, keyboard rows, and button availability.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
<div className="flex border-b px-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="size-4" />
                  {tab.label}
                  <span className={`bg-primary absolute inset-x-2 bottom-0 h-0.5 origin-center rounded-full transition-all duration-300 ${activeTab === tab.id ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`} />
                </button>
              ))}
            </div>
            <div className="p-4">
              {activeTab === 'texts' && (
                <div className="space-y-2">
                  <Label>Bot texts</Label>
                  <Textarea value={botTexts} onChange={event => setBotTexts(event.target.value)} className="min-h-64 font-mono text-sm" />
                  <p className="text-muted-foreground text-xs">Each line must be a key=value pair. Example: welcome=Welcome to RetroPanel</p>
                </div>
              )}
              {activeTab === 'buttons' && (
                <div className="space-y-2">
                  <Label>Button layout</Label>
                  <Textarea value={botButtons} onChange={event => setBotButtons(event.target.value)} className="min-h-64 font-mono text-sm" />
                  <p className="text-muted-foreground text-xs">Each line is a keyboard row. Separate buttons with |.</p>
                </div>
              )}
              {activeTab === 'status' && (
                <div className="space-y-2">
                  <Label>Button availability</Label>
                  <Textarea value={botButtonStatus} onChange={event => setBotButtonStatus(event.target.value)} className="min-h-64 font-mono text-sm" />
                  <p className="text-muted-foreground text-xs">Use true/false values to enable or disable each button.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || savePanel.isPending}>
            {savePanel.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Bot Setting
          </Button>
        </div>
      </form>
    </div>
  )
}
