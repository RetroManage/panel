import PageHeader from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { PanelSettings, usePanelSettings, useSavePanelSettings } from '@/service/api'
import { queryClient } from '@/utils/query-client'
import { Bot, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function PanelTelegramSettingsPage() {
  const { data } = usePanelSettings()
  const saveMutation = useSavePanelSettings()
  const [form, setForm] = useState<PanelSettings | null>(null)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const update = (key: keyof PanelSettings, value: string | boolean) => {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  const save = async () => {
    if (!form) return
    try {
      await saveMutation.mutateAsync(form)
      await queryClient.invalidateQueries({ queryKey: ['panel-settings'] })
      toast.success('Panel settings saved')
    } catch (err: any) {
      toast.error(err?.message || 'Could not save panel settings')
    }
  }

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '400ms' }}>
        <PageHeader title="Panel & Telegram Bot Settings" description="Manage panel identity and Telegram bot integration placeholders." tutorialUrl="https://github.com/RetroManage/panel#readme" />
        <Separator />
      </div>

      <div className="w-full px-3 pt-4 sm:px-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Panel Settings</CardTitle>
                  <CardDescription>Basic identity and public URL settings.</CardDescription>
                </div>
                <Button onClick={save} disabled={!form || saveMutation.isPending}>
                  <Save className="mr-2 size-4" />
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Panel Name</Label>
                <Input value={form?.panelName || ''} onChange={event => update('panelName', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Public Base URL</Label>
                <Input value={form?.publicBaseUrl || ''} onChange={event => update('publicBaseUrl', event.target.value)} placeholder="https://panel.example.com" />
              </div>
              <div className="space-y-2">
                <Label>Telegram Bot Token</Label>
                <Input value={form?.telegramBotToken || ''} onChange={event => update('telegramBotToken', event.target.value)} placeholder="123456:ABC..." />
              </div>
              <div className="space-y-2">
                <Label>Telegram Admin Chat</Label>
                <Input value={form?.telegramAdminChat || ''} onChange={event => update('telegramAdminChat', event.target.value)} placeholder="-100123456789" />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3 lg:col-span-2">
                <div>
                  <Label>Daily Report</Label>
                  <p className="text-muted-foreground text-xs">Prepare daily Telegram report delivery. Bot logic will be implemented later.</p>
                </div>
                <Switch checked={!!form?.dailyReportEnabled} onCheckedChange={checked => update('dailyReportEnabled', checked)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
                  <Bot className="size-5" />
                </div>
                <div>
                  <CardTitle>Telegram Bot</CardTitle>
                  <CardDescription>Integration placeholder</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="text-muted-foreground">Next steps:</p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Validate bot token</li>
                  <li>Send accounting alerts</li>
                  <li>Send daily sales report</li>
                  <li>Expose admin command rules</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
