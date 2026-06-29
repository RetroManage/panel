import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { defaultBotButtons, defaultBotStatus, normalizeBotActionKey, panelSettingsDefaults, parseBotButtons, parseBotStatus, stringifyBotButtons, stringifyBotStatus } from './bot-setting-form'
import { usePanelSettings, useSavePanelSettings } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { GripVertical, Loader2, Plus, Save, ToggleLeft, Trash2 } from 'lucide-react'
import { DragEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

type DragTarget = {
  rowIndex: number
  buttonIndex: number
}

const ensureRows = (input: string) => {
  const rows = parseBotButtons(input)
  return rows.length ? rows : parseBotButtons(defaultBotButtons)
}

export default function BotSettingStatus() {
  const queryClient = useQueryClient()
  const { data, isLoading } = usePanelSettings()
  const savePanel = useSavePanelSettings()
  const [rows, setRows] = useState<string[][]>(ensureRows(defaultBotButtons))
  const [status, setStatus] = useState<Record<string, boolean>>(parseBotStatus(defaultBotStatus))
  const [newButton, setNewButton] = useState('')
  const [dragged, setDragged] = useState<DragTarget | null>(null)

  useEffect(() => {
    const settings = panelSettingsDefaults(data)
    setRows(ensureRows(settings.botButtons || defaultBotButtons))
    setStatus(parseBotStatus(settings.botButtonStatus || defaultBotStatus))
  }, [data])

  const statusOutput = useMemo(() => stringifyBotStatus(status, rows), [rows, status])
  const layoutOutput = useMemo(() => stringifyBotButtons(rows), [rows])

  const setButtonEnabled = (label: string, enabled: boolean) => {
    const key = normalizeBotActionKey(label)
    setStatus(prev => ({ ...prev, [key]: enabled }))
  }

  const removeButton = (rowIndex: number, buttonIndex: number) => {
    setRows(prev => prev.map((row, index) => (index === rowIndex ? row.filter((_, innerIndex) => innerIndex !== buttonIndex) : row)).filter(row => row.length > 0))
  }

  const addButton = () => {
    const label = newButton.trim()
    if (!label) return
    setRows(prev => (prev.length ? prev.map((row, index) => (index === prev.length - 1 ? [...row, label] : row)) : [[label]]))
    setButtonEnabled(label, true)
    setNewButton('')
  }

  const addRow = () => {
    const label = newButton.trim()
    if (!label) {
      toast.error('Enter a button label first')
      return
    }
    setRows(prev => [...prev, [label]])
    setButtonEnabled(label, true)
    setNewButton('')
  }

  const swapButtons = (target: DragTarget) => {
    if (!dragged) return
    if (dragged.rowIndex === target.rowIndex && dragged.buttonIndex === target.buttonIndex) return
    setRows(prev => {
      const next = prev.map(row => [...row])
      const sourceLabel = next[dragged.rowIndex]?.[dragged.buttonIndex]
      const targetLabel = next[target.rowIndex]?.[target.buttonIndex]
      if (!sourceLabel || !targetLabel) return prev
      next[dragged.rowIndex][dragged.buttonIndex] = targetLabel
      next[target.rowIndex][target.buttonIndex] = sourceLabel
      return next
    })
    setDragged(null)
  }

  const onDropButton = (event: DragEvent<HTMLDivElement>, target: DragTarget) => {
    event.preventDefault()
    swapButtons(target)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await savePanel.mutateAsync({ ...panelSettingsDefaults(data), botButtons: layoutOutput, botButtonStatus: statusOutput })
    queryClient.invalidateQueries({ queryKey: ['panel-settings'] })
    toast.success('Bot visibility saved')
  }

  return (
    <div className="w-full px-4 py-5 pb-12">
      <form onSubmit={onSubmit} className="mx-auto grid max-w-6xl gap-4 xl:grid-cols-[minmax(360px,0.95fr)_minmax(0,1.05fr)]">
        <Card className="border-primary/10 bg-card/90 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ToggleLeft className="text-primary size-5" /> Visibility
            </CardTitle>
            <CardDescription>Toggle, remove, add, and reorder live Telegram bot buttons. Drag a button onto another button to swap their positions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
              <Input value={newButton} onChange={event => setNewButton(event.target.value)} placeholder="Button label" disabled={isLoading || savePanel.isPending} />
              <Button type="button" variant="outline" onClick={addButton} disabled={isLoading || savePanel.isPending || !newButton.trim()}>
                <Plus className="size-4" /> Add button
              </Button>
              <Button type="button" variant="outline" onClick={addRow} disabled={isLoading || savePanel.isPending}>
                <Plus className="size-4" /> Add row
              </Button>
            </div>

            <div className="space-y-2">
              {rows.map((row, rowIndex) => (
                <div key={`${rowIndex}-${row.join('|')}`} className="rounded-2xl border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs font-medium">Row {rowIndex + 1}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setRows(prev => prev.filter((_, index) => index !== rowIndex))} disabled={isLoading || savePanel.isPending}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {row.map((label, buttonIndex) => {
                      const key = normalizeBotActionKey(label)
                      const enabled = status[key] ?? true
                      return (
                        <div
                          key={`${label}-${buttonIndex}`}
                          draggable={!isLoading && !savePanel.isPending}
                          onDragStart={() => setDragged({ rowIndex, buttonIndex })}
                          onDragOver={event => event.preventDefault()}
                          onDrop={event => onDropButton(event, { rowIndex, buttonIndex })}
                          onDragEnd={() => setDragged(null)}
                          className={cn(
                            'flex items-center gap-2 rounded-xl border bg-background p-2 shadow-sm transition-all duration-200',
                            dragged?.rowIndex === rowIndex && dragged?.buttonIndex === buttonIndex && 'scale-[0.98] opacity-60',
                            !enabled && 'border-dashed opacity-55',
                          )}
                        >
                          <GripVertical className="text-muted-foreground size-4 shrink-0 cursor-grab" />
                          <Input value={label} onChange={event => setRows(prev => prev.map((currentRow, currentIndex) => (currentIndex === rowIndex ? currentRow.map((currentLabel, innerIndex) => (innerIndex === buttonIndex ? event.target.value : currentLabel)) : currentRow)))} />
                          <Switch checked={enabled} onCheckedChange={checked => setButtonEnabled(label, checked)} disabled={isLoading || savePanel.isPending} />
                          <Button type="button" variant="ghost" size="icon-md" onClick={() => removeButton(rowIndex, buttonIndex)} disabled={isLoading || savePanel.isPending}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || savePanel.isPending}>
                {savePanel.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save visibility
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-card/90 shadow-sm backdrop-blur">
          <CardHeader>
            <CardTitle>Live keyboard preview</CardTitle>
            <CardDescription>Disabled buttons stay visible here with a faded style so you can manage them before saving.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[1.5rem] border bg-muted/20 p-4 shadow-inner">
              <div className="mx-auto max-w-md rounded-[1.35rem] border bg-background p-3">
                <div className="mb-3 rounded-2xl bg-primary/10 px-3 py-2 text-sm">Preview: Telegram reply keyboard</div>
                <div className="space-y-2">
                  {rows.map((row, rowIndex) => (
                    <div key={`${rowIndex}-${row.join('-')}`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                      {row.map((label, buttonIndex) => {
                        const enabled = status[normalizeBotActionKey(label)] ?? true
                        return (
                          <div
                            key={`${label}-${buttonIndex}`}
                            onDragOver={event => event.preventDefault()}
                            onDrop={event => onDropButton(event, { rowIndex, buttonIndex })}
                            className={cn('rounded-xl border bg-card px-3 py-2 text-center text-sm shadow-sm transition-all duration-200', !enabled && 'border-dashed opacity-45 grayscale')}
                          >
                            <span className="block truncate">{label}</span>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="botButtonsGenerated">Generated layout</Label>
                <Textarea id="botButtonsGenerated" value={layoutOutput} readOnly className="min-h-44 font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="botButtonStatusGenerated">Generated visibility</Label>
                <Textarea id="botButtonStatusGenerated" value={statusOutput} readOnly className="min-h-44 font-mono text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
