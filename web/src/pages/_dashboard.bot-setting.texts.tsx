import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { defaultBotTexts, panelSettingsDefaults } from './bot-setting-form'
import { usePanelSettings, useSavePanelSettings } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, MessageSquareText, Save } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function BotSettingTexts() {
  const queryClient = useQueryClient()
  const { data, isLoading } = usePanelSettings()
  const savePanel = useSavePanelSettings()
  const [texts, setTexts] = useState(defaultBotTexts)

  useEffect(() => setTexts(panelSettingsDefaults(data).botTexts || defaultBotTexts), [data])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await savePanel.mutateAsync({ ...panelSettingsDefaults(data), botTexts: texts })
    queryClient.invalidateQueries({ queryKey: ['panel-settings'] })
    toast.success('Bot texts saved')
  }

  return (
    <div className="w-full px-4 py-5 pb-12">
      <Card className="mx-auto max-w-4xl border-primary/10 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquareText className="text-primary size-5" /> Texts</CardTitle>
          <CardDescription>Use key=value lines. Keep customer messages short and clear.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botTexts">Message map</Label>
              <Textarea id="botTexts" value={texts} onChange={event => setTexts(event.target.value)} className="min-h-72 font-mono text-sm" disabled={isLoading || savePanel.isPending} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || savePanel.isPending}>{savePanel.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save texts</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
