import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { defaultBotButtons, panelSettingsDefaults, parseBotButtons, stringifyBotButtons } from './bot-setting-form'
import { usePanelSettings, useSavePanelSettings } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { Keyboard, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

export default function BotSettingButtons() {
  const queryClient = useQueryClient()
  const { data, isLoading } = usePanelSettings()
  const savePanel = useSavePanelSettings()
  const [buttons, setButtons] = useState(defaultBotButtons)
  const [newButton, setNewButton] = useState('')

  useEffect(() => setButtons(panelSettingsDefaults(data).botButtons || defaultBotButtons), [data])

  const rows = useMemo(() => parseBotButtons(buttons), [buttons])

  const updateRows = (nextRows: string[][]) => setButtons(stringifyBotButtons(nextRows))

  const addButton = () => {
    const label = newButton.trim()
    if (!label) return
    updateRows([...(rows.length ? rows : []), [label]])
    setNewButton('')
  }

  const removeButton = (rowIndex: number, buttonIndex: number) => {
    const nextRows = rows
      .map((row, index) => (index === rowIndex ? row.filter((_, innerIndex) => innerIndex !== buttonIndex) : row))
      .filter(row => row.length > 0)
    updateRows(nextRows)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await savePanel.mutateAsync({ ...panelSettingsDefaults(data), botButtons: stringifyBotButtons(rows) })
    queryClient.invalidateQueries({ queryKey: ['panel-settings'] })
    toast.success('Bot buttons saved')
  }

  return (
    <div className="w-full px-4 py-5 pb-12">
      <form onSubmit={onSubmit} className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="border-primary/10 bg-card/90 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="text-primary size-5" /> Buttons
            </CardTitle>
            <CardDescription>Each line is one keyboard row. Separate buttons in a row with a pipe character.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botButtons">Keyboard layout</Label>
              <Textarea id="botButtons" value={buttons} onChange={event => setButtons(event.target.value)} className="min-h-56 font-mono text-sm" disabled={isLoading || savePanel.isPending} />
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input value={newButton} onChange={event => setNewButton(event.target.value)} placeholder="New button label" disabled={isLoading || savePanel.isPending} />
              <Button type="button" variant="outline" onClick={addButton} disabled={isLoading || savePanel.isPending || !newButton.trim()}>
                <Plus className="size-4" /> Add row
              </Button>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || savePanel.isPending}>
                {savePanel.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save buttons
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-card/90 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Keyboard preview</CardTitle>
            <CardDescription>This preview is generated from the real saved layout format.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-[1.5rem] border bg-muted/20 p-4 shadow-inner">
              <div className="mx-auto max-w-sm rounded-[1.35rem] border bg-background p-3">
                <div className="mb-3 rounded-2xl bg-primary/10 px-3 py-2 text-sm">RetroPanel bot menu</div>
                <div className="space-y-2">
                  {rows.map((row, rowIndex) => (
                    <div key={`${row.join('-')}-${rowIndex}`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                      {row.map((label, buttonIndex) => (
                        <div key={`${label}-${buttonIndex}`} className="group flex items-center gap-1 rounded-xl border bg-card px-3 py-2 text-center text-sm shadow-sm">
                          <span className="min-w-0 flex-1 truncate">{label}</span>
                          <button type="button" className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" onClick={() => removeButton(rowIndex, buttonIndex)} aria-label={`Remove ${label}`}>
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                  {!rows.length && <div className="text-muted-foreground rounded-xl border border-dashed p-4 text-center text-sm">No buttons configured.</div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
