import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { defaultBotStatus, panelSettingsDefaults } from './bot-setting-form'
import { usePanelSettings, useSavePanelSettings } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Save, ToggleLeft } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function BotSettingStatus() {
  const queryClient = useQueryClient()
  const { data, isLoading } = usePanelSettings()
  const savePanel = useSavePanelSettings()
  const [status, setStatus] = useState(defaultBotStatus)

  useEffect(() => setStatus(panelSettingsDefaults(data).botButtonStatus || defaultBotStatus), [data])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await savePanel.mutateAsync({ ...panelSettingsDefaults(data), botButtonStatus: status })
    queryClient.invalidateQueries({ queryKey: ['panel-settings'] })
    toast.success('Bot visibility saved')
  }

  return (
    <div className="w-full px-4 py-5 pb-12">
      <Card className="mx-auto max-w-4xl border-primary/10 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ToggleLeft className="text-primary size-5" /> Visibility</CardTitle>
          <CardDescription>Use key=true or key=false to show or hide bot actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botButtonStatus">Action status</Label>
              <Textarea id="botButtonStatus" value={status} onChange={event => setStatus(event.target.value)} className="min-h-56 font-mono text-sm" disabled={isLoading || savePanel.isPending} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || savePanel.isPending}>{savePanel.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save visibility</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
