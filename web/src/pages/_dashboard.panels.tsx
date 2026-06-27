import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { type PasarGuardPanel, useCreatePanel, useDeletePanel, usePanels, useTestPanelConnection, useUpdatePanel } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, PlugZap, Plus, RefreshCw, ServerCog, ShieldCheck, Trash2, XCircle } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

type PanelFormState = {
  id?: string
  name: string
  baseUrl: string
  username: string
  password: string
}

const emptyForm: PanelFormState = {
  name: '',
  baseUrl: '',
  username: '',
  password: '',
}

export default function PanelsPage() {
  const queryClient = useQueryClient()
  const { data: panels = [], isLoading } = usePanels()
  const testConnection = useTestPanelConnection()
  const createPanel = useCreatePanel()
  const updatePanel = useUpdatePanel()
  const deletePanel = useDeletePanel()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<PanelFormState>(emptyForm)
  const [lastTest, setLastTest] = useState<{ ok: boolean; message: string } | null>(null)

  const connected = useMemo(() => panels.filter(panel => panel.status === 'connected').length, [panels])

  useEffect(() => {
    if (!open) {
      setForm(emptyForm)
      setLastTest(null)
    }
  }, [open])

  const editPanel = (panel: PasarGuardPanel) => {
    setForm({
      id: panel.id,
      name: panel.name,
      baseUrl: panel.baseUrl,
      username: panel.username,
      password: '',
    })
    setLastTest(null)
    setOpen(true)
  }

  const runTest = async () => {
    try {
      const payload = { name: form.name, baseUrl: form.baseUrl, username: form.username, password: form.password || undefined }
      const result = form.id
        ? await updatePanel.mutateAsync({ id: form.id, ...payload })
        : await testConnection.mutateAsync(payload)
      setLastTest({ ok: result.ok, message: result.message || result.result?.message || 'Connection test completed' })
      if (form.id) await queryClient.invalidateQueries({ queryKey: ['panels'] })
      toast.success(result.message || 'Connection verified')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection test failed'
      setLastTest({ ok: false, message })
      toast.error(message)
    }
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      if (form.id) {
        await updatePanel.mutateAsync({ id: form.id, name: form.name, baseUrl: form.baseUrl, username: form.username, password: form.password || undefined })
        toast.success('Panel updated and verified')
      } else {
        await createPanel.mutateAsync({ name: form.name, baseUrl: form.baseUrl, username: form.username, password: form.password })
        toast.success('Panel connected and saved')
      }
      await queryClient.invalidateQueries({ queryKey: ['panels'] })
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save panel')
    }
  }

  const removePanel = async (panel: PasarGuardPanel) => {
    try {
      await deletePanel.mutateAsync(panel.id)
      await queryClient.invalidateQueries({ queryKey: ['panels'] })
      toast.success(`${panel.name} removed`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete panel')
    }
  }

  const pending = createPanel.isPending || updatePanel.isPending || testConnection.isPending

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="w-full animate-fade-in transform-gpu" style={{ animationDuration: '420ms' }}>
        <PageHeader title="Panels" description="Connect RetroPanel to real PasarGuard panels through the official REST API." tutorialUrl="https://github.com/PasarGuard/panel#readme" />
        <Separator />
      </div>

      <div className="w-full space-y-4 px-3 pt-4 pb-12 sm:px-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-primary/10 bg-card/95 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Total panels</CardDescription>
              <CardTitle className="flex items-center gap-2 text-3xl"><ServerCog className="text-primary size-6" /> {panels.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-primary/10 bg-card/95 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>Connected</CardDescription>
              <CardTitle className="flex items-center gap-2 text-3xl"><CheckCircle2 className="size-6 text-green-500" /> {connected}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-primary/10 bg-card/95 shadow-sm">
            <CardContent className="flex h-full items-center justify-end pt-6">
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="size-4" /> Add Panel
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-primary/10 bg-card/95 shadow-sm">
          <CardHeader className="border-b bg-muted/25">
            <CardTitle className="flex items-center gap-2"><PlugZap className="text-primary size-5" /> PasarGuard Connections</CardTitle>
            <CardDescription>Each saved panel is authenticated with `/api/admin/token` and validated with `/api/admin` before it is stored.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last test</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading panels...</TableCell></TableRow>
                ) : panels.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No PasarGuard panel has been connected yet.</TableCell></TableRow>
                ) : (
                  panels.map(panel => (
                    <TableRow key={panel.id}>
                      <TableCell className="font-medium">{panel.name}</TableCell>
                      <TableCell className="max-w-[280px] truncate font-mono text-xs">{panel.baseUrl}</TableCell>
                      <TableCell>{panel.username}</TableCell>
                      <TableCell>
                        <Badge variant={panel.status === 'connected' ? 'green' : 'orange'} className="gap-1">
                          {panel.status === 'connected' ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                          {panel.status || 'unknown'}
                        </Badge>
                        {panel.lastError ? <p className="mt-1 max-w-[260px] truncate text-xs text-destructive">{panel.lastError}</p> : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{panel.lastTestedAt ? new Date(panel.lastTestedAt).toLocaleString() : 'Never'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => editPanel(panel)}>Edit / Test</Button>
                          <Button size="icon" variant="ghost" onClick={() => removePanel(panel)} disabled={deletePanel.isPending} aria-label="Delete panel">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit PasarGuard Panel' : 'Add PasarGuard Panel'}</DialogTitle>
            <DialogDescription>RetroPanel supports PasarGuard only. Enter the admin credentials and base URL; the backend performs a real API login test.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="panelName">Panel name</Label>
                <Input id="panelName" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="Main PasarGuard" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panelUsername">Username</Label>
                <Input id="panelUsername" value={form.username} onChange={event => setForm(current => ({ ...current, username: event.target.value }))} autoComplete="username" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panelPassword">Password</Label>
                <Input id="panelPassword" value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} type="password" autoComplete="current-password" placeholder={form.id ? 'Leave empty to keep saved password' : ''} required={!form.id} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="panelBaseUrl">Base URL</Label>
                <Input id="panelBaseUrl" value={form.baseUrl} onChange={event => setForm(current => ({ ...current, baseUrl: event.target.value }))} placeholder="https://panel.example.com" required />
              </div>
            </div>

            {lastTest ? (
              <div className={`rounded-lg border p-3 text-sm ${lastTest.ok ? 'border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300' : 'border-destructive/25 bg-destructive/10 text-destructive'}`}>
                {lastTest.message}
              </div>
            ) : null}

            <DialogFooter className="gap-2 sm:justify-between">
              <Button type="button" variant="outline" onClick={runTest} disabled={pending || !form.baseUrl || !form.username || !form.password}>
                {testConnection.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Test Connection
              </Button>
              <Button type="submit" disabled={pending || !form.baseUrl || !form.username || (!form.id && !form.password)}>
                {createPanel.isPending || updatePanel.isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                Save Panel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
