import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { defaultBotTexts, panelSettingsDefaults, parseBotTexts, stringifyBotTexts } from './bot-setting-form'
import { usePanelSettings, useSavePanelSettings } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, MessageSquareText, Plus, Save, Trash2 } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

type TextItem = {
  key: string
  value: string
}

const toItems = (input: string): TextItem[] => Object.entries(parseBotTexts(input)).map(([key, value]) => ({ key, value }))

export default function BotSettingTexts() {
  const queryClient = useQueryClient()
  const { data, isLoading } = usePanelSettings()
  const savePanel = useSavePanelSettings()
  const [items, setItems] = useState<TextItem[]>(toItems(defaultBotTexts))
  const [newKey, setNewKey] = useState('')

  useEffect(() => setItems(toItems(panelSettingsDefaults(data).botTexts || defaultBotTexts)), [data])

  const rawTexts = useMemo(() => stringifyBotTexts(Object.fromEntries(items.map(item => [item.key, item.value]))), [items])

  const updateItem = (index: number, patch: Partial<TextItem>) => setItems(prev => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))

  const removeItem = (index: number) => setItems(prev => prev.filter((_, itemIndex) => itemIndex !== index))

  const addItem = () => {
    const key = newKey.trim()
    if (!key) return
    if (items.some(item => item.key === key)) {
      toast.error('This text key already exists')
      return
    }
    setItems(prev => [...prev, { key, value: '' }])
    setNewKey('')
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await savePanel.mutateAsync({ ...panelSettingsDefaults(data), botTexts: rawTexts })
    queryClient.invalidateQueries({ queryKey: ['panel-settings'] })
    toast.success('Bot texts saved')
  }

  return (
    <div className="w-full px-4 py-5 pb-12">
      <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-4">
        <Card className="border-primary/10 bg-card/90 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="text-primary size-5" /> Texts
            </CardTitle>
            <CardDescription>Manage customer-facing bot messages by key. These values are saved in the existing key=value format used by the backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((item, index) => (
                <div key={`${item.key}-${index}`} className="rounded-2xl border bg-muted/20 p-3 shadow-sm transition-colors hover:bg-muted/30">
                  <div className="mb-2 flex items-center gap-2">
                    <Input value={item.key} onChange={event => updateItem(index, { key: event.target.value.trim() })} placeholder="key" disabled={isLoading || savePanel.isPending} />
                    <Button type="button" variant="ghost" size="icon-md" onClick={() => removeItem(index)} disabled={isLoading || savePanel.isPending}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <Textarea value={item.value} onChange={event => updateItem(index, { value: event.target.value })} placeholder="Message text" className="min-h-24 resize-y" disabled={isLoading || savePanel.isPending} />
                </div>
              ))}
            </div>

            <div className="grid gap-2 rounded-2xl border border-dashed bg-muted/20 p-3 sm:grid-cols-[1fr_auto]">
              <Input value={newKey} onChange={event => setNewKey(event.target.value)} placeholder="New text key, e.g. renewal" disabled={isLoading || savePanel.isPending} />
              <Button type="button" variant="outline" onClick={addItem} disabled={isLoading || savePanel.isPending || !newKey.trim()}>
                <Plus className="size-4" /> Add text
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="botTextsRaw">Generated key=value output</Label>
              <Textarea id="botTextsRaw" value={rawTexts} readOnly className="min-h-32 font-mono text-sm" />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || savePanel.isPending}>
                {savePanel.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save texts
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
