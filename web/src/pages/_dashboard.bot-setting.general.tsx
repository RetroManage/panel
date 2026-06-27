import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { panelSettingsDefaults } from './bot-setting-form'
import { usePanelSettings, useSavePanelSettings } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { Bot, Loader2, Power, Save, ShieldCheck } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function BotSettingGeneral() {
  const queryClient = useQueryClient()
  const { data, isLoading } = usePanelSettings()
  const savePanel = useSavePanelSettings()
  const [enabled, setEnabled] = useState(false)
  const [token, setToken] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [dailyReportEnabled, setDailyReportEnabled] = useState(true)

  useEffect(() => {
    const settings = panelSettingsDefaults(data)
    setEnabled(Boolean(settings.botEnabled))
    setToken(settings.telegramBotToken)
    setOwnerId(settings.telegramOwnerId || settings.telegramAdminChat || '')
    setDailyReportEnabled(settings.dailyReportEnabled)
  }, [data])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = panelSettingsDefaults(data)
    await savePanel.mutateAsync({
      ...next,
      botEnabled: enabled,
      telegramBotToken: token.trim(),
      telegramOwnerId: ownerId.trim(),
      telegramAdminChat: ownerId.trim(),
      dailyReportEnabled,
    })
    queryClient.invalidateQueries({ queryKey: ['panel-settings'] })
    toast.success('Bot settings saved')
  }

  return (
    <div className="w-full space-y-4 px-4 py-5 pb-12">
      <Card className="mx-auto max-w-4xl border-primary/10 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Bot className="text-primary size-5" /> General</CardTitle>
              <CardDescription>Enable the bot only after the token and owner numeric ID are valid.</CardDescription>
            </div>
            <Badge variant={enabled ? 'green' : 'orange'}>{enabled ? 'Enabled' : 'Paused'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telegramBotToken" className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Bot token</Label>
                <Input id="telegramBotToken" value={token} onChange={event => setToken(event.target.value)} placeholder="123456:ABC-DEF..." disabled={isLoading || savePanel.isPending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegramOwnerId" className="flex items-center gap-2"><Power className="size-4 text-primary" /> Owner numeric ID</Label>
                <Input id="telegramOwnerId" value={ownerId} onChange={event => setOwnerId(event.target.value)} placeholder="Telegram numeric user ID" disabled={isLoading || savePanel.isPending} />
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-4">
                <div>
                  <p className="font-medium">Activate bot</p>
                  <p className="text-muted-foreground text-sm">Start or stop the live Telegram bot process.</p>
                </div>
                <Switch checked={enabled} onCheckedChange={setEnabled} disabled={isLoading || savePanel.isPending} />
              </div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-4">
                <div>
                  <p className="font-medium">Daily report</p>
                  <p className="text-muted-foreground text-sm">Allow daily operational summaries for the owner.</p>
                </div>
                <Switch checked={dailyReportEnabled} onCheckedChange={setDailyReportEnabled} disabled={isLoading || savePanel.isPending} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || savePanel.isPending}>
                {savePanel.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save bot settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
