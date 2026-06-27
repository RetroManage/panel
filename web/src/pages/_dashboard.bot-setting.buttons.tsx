import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { defaultBotButtons, panelSettingsDefaults } from './bot-setting-form'
import { usePanelSettings, useSavePanelSettings } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { Keyboard, Loader2, Save } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function BotSettingButtons() {
  const queryClient = useQueryClient()
  const { data, isLoading } = usePanelSettings()
  const savePanel = useSavePanelSettings()
  const [buttons, setButtons] = useState(defaultBotButtons)

  useEffect(() => setButtons(panelSettingsDefaults(data).botButtons || defaultBotButtons), [data])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await savePanel.mutateAsync({ ...panelSettingsDefaults(data), botButtons: buttons })
    queryClient.invalidateQueries({ queryKey: ['panel-settings'] })
    toast.success('Bot buttons saved')
  }

  return (
    <div className="w-full px-4 py-5 pb-12">
      <Card className="mx-auto max-w-4xl border-primary/10 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Keyboard className="text-primary size-5" /> Buttons</CardTitle>
          <CardDescription>Each line is one row. Separate buttons in a row with a pipe character.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botButtons">Keyboard layout</Label>
              <Textarea id="botButtons" value={buttons} onChange={event => setButtons(event.target.value)} className="min-h-56 font-mono text-sm" disabled={isLoading || savePanel.isPending} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || savePanel.isPending}>{savePanel.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save buttons</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
