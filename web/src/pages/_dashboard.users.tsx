import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CountUp } from '@/components/ui/count-up'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatNumber } from '@/features/accounting/format'
import useDirDetection from '@/hooks/use-dir-detection'
import { cn } from '@/lib/utils'
import { BotUser, useBotUsers, useCreatePasarGuardUser, useDashboardSummary, useProducts } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { Activity, HardDrive, Plus, RefreshCcw, Search, UserCheck, Users as UsersIcon, Wifi, type LucideIcon } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'

const bytesPerGb = 1024 * 1024 * 1024

const formatDate = (value?: string) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(value))
}

const usagePercent = (user: BotUser) => {
  if (!user.dataLimitGb) return 0
  return Math.min(100, Math.round((user.usedTrafficGb / user.dataLimitGb) * 100))
}

const statusVariant = (status?: string): 'green' | 'orange' | 'yellow' | 'red' | 'blue' => {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return 'green'
    case 'limited':
      return 'orange'
    case 'expired':
      return 'yellow'
    case 'disabled':
      return 'red'
    default:
      return 'blue'
  }
}

const StatCard = ({ title, value, icon: Icon, dot, delay }: { title: string; value: number; icon?: LucideIcon; dot?: boolean; delay: string }) => {
  const dir = useDirDetection()

  return (
    <div className="animate-fade-in w-full" style={{ animationDuration: '600ms', animationDelay: delay }}>
      <Card dir={dir} className="group relative w-full overflow-hidden rounded-md px-4 py-6 transition-all duration-500">
        <div className="from-primary/10 absolute inset-0 bg-gradient-to-r to-transparent opacity-0 transition-opacity duration-500 dark:from-primary/5 group-hover:opacity-100" />
        <CardTitle className="relative z-10 flex min-w-0 items-center justify-between gap-x-4 overflow-hidden">
          <div className="flex min-h-8 min-w-0 flex-1 items-center gap-x-4 overflow-hidden">
            {dot ? <div className="min-h-[10px] min-w-[10px] shrink-0 rounded-full bg-green-500 shadow-sm" /> : Icon ? <Icon className="h-5 w-5 shrink-0" /> : null}
            <span>{title}</span>
          </div>
          <span dir="ltr" className="mx-2 shrink-0 text-3xl transition-all duration-500">
            <CountUp end={value} />
          </span>
        </CardTitle>
      </Card>
    </div>
  )
}

type UserFormState = {
  username: string
  productId: string
  dataLimitGb: string
  durationDays: string
  note: string
}

const emptyUserForm: UserFormState = {
  username: '',
  productId: '',
  dataLimitGb: '',
  durationDays: '',
  note: '',
}

export default function UsersPage() {
  const dir = useDirDetection()
  const queryClient = useQueryClient()
  const { data: users = [] } = useBotUsers()
  const { data: summary } = useDashboardSummary()
  const { data: products = [] } = useProducts()
  const createUser = useCreatePasarGuardUser()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<UserFormState>(emptyUserForm)

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter(user => [user.username, user.id, user.telegramId, user.planName, user.status].some(value => String(value || '').toLowerCase().includes(query)))
  }, [search, users])

  const totals = useMemo(
    () => ({
      total: summary?.totalUsers ?? users.length,
      active: summary?.activeUsers ?? users.filter(user => user.status === 'active').length,
      online: summary?.onlineUsers ?? 0,
      limited: summary?.limitedUsers ?? users.filter(user => user.status === 'limited').length,
      expired: summary?.expiredUsers ?? users.filter(user => user.status === 'expired').length,
      disabled: summary?.disabledUsers ?? users.filter(user => user.status === 'disabled').length,
      traffic: users.reduce((total, user) => total + user.usedTrafficGb, 0),
    }),
    [summary, users],
  )

  const selectedProduct = products.find(product => product.id === form.productId)

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['bot-users'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    queryClient.invalidateQueries({ queryKey: ['system-users-stats'] })
  }

  const handleProductChange = (productId: string) => {
    const product = products.find(item => item.id === productId)
    setForm(prev => ({
      ...prev,
      productId,
      dataLimitGb: product?.dataLimitGb ? String(product.dataLimitGb) : prev.dataLimitGb,
      durationDays: product?.durationDays ? String(product.durationDays) : prev.durationDays,
      note: product ? `Created from product: ${product.name}` : prev.note,
    }))
  }

  const handleCreate = () => {
    setForm(emptyUserForm)
    setOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const durationDays = Number(form.durationDays || selectedProduct?.durationDays || 0)
    const expire = durationDays > 0 ? Math.floor((Date.now() + durationDays * 86400 * 1000) / 1000) : undefined
    const dataLimitGb = Number(form.dataLimitGb || selectedProduct?.dataLimitGb || 0)
    try {
      await createUser.mutateAsync({
        username: form.username.trim(),
        status: 'active',
        expire,
        dataLimitGb: dataLimitGb > 0 ? Math.round(dataLimitGb) : undefined,
        dataLimitBytes: dataLimitGb > 0 ? Math.round(dataLimitGb * bytesPerGb) : undefined,
        dataLimitResetStrategy: 'no_reset',
        note: form.note.trim() || selectedProduct?.name || undefined,
      })
      toast.success('User created on the connected PasarGuard panel')
      setOpen(false)
      setForm(emptyUserForm)
      refresh()
    } catch (error: any) {
      toast.error(error?.message || 'Could not create user')
    }
  }

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '400ms' }}>
        <PageHeader title="users" description="manageAccounts" buttonIcon={Plus} buttonText="createUser" onButtonClick={handleCreate} />
        <Separator />
      </div>

      <div className="w-full px-4 pt-2 pb-12">
        <div className="animate-slide-up transform-gpu" style={{ animationDuration: '500ms', animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className={cn('grid w-full auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3', dir === 'rtl' && 'lg:grid-flow-col-reverse')}>
            <StatCard title="Online Users" value={totals.online} dot delay="50ms" />
            <StatCard title="Active Users" value={totals.active} icon={UserCheck} delay="150ms" />
            <StatCard title="Users" value={totals.total} icon={UsersIcon} delay="250ms" />
          </div>
        </div>

        <div className="animate-slide-up transform-gpu" style={{ animationDuration: '500ms', animationDelay: '250ms', animationFillMode: 'both' }}>
          <Card className="mt-4 overflow-hidden border-primary/10 bg-card/95 shadow-sm">
            <CardHeader className="border-b bg-primary/5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Panel Users</CardTitle>
                  <CardDescription>Live list from the configured PasarGuard panel, styled for fast account management.</CardDescription>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative min-w-64">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search users" className="pl-9" />
                  </div>
                  <Button variant="outline" onClick={refresh} className="gap-2">
                    <RefreshCcw className="h-4 w-4" /> Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>User</TableHead>
                    <TableHead>Plan / group</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => {
                    const percent = usagePercent(user)
                    return (
                      <TableRow key={user.id} className="transition-colors duration-200 hover:bg-muted/35">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.username || user.id}</span>
                            <span className="text-muted-foreground text-xs">ID: {user.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.planName || '-'}</TableCell>
                        <TableCell>
                          <div className="min-w-40 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>
                                {user.usedTrafficGb.toFixed(1)} / {user.dataLimitGb ? user.dataLimitGb.toFixed(0) : '∞'} GB
                              </span>
                              <span className="text-muted-foreground">{percent}%</span>
                            </div>
                            <div className="bg-muted h-2 overflow-hidden rounded-full">
                              <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${user.dataLimitGb ? Math.max(4, percent) : 0}%` }} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>{formatDate(user.expiresAt)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(user.status)}>{user.status || 'unknown'}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {!filteredUsers.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground h-32 text-center">
                        No live users were returned. Connect and verify a PasarGuard panel first.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-muted-foreground text-sm">Used Traffic</p>
                <p className="text-2xl font-semibold">{totals.traffic.toFixed(1)} GB</p>
              </div>
              <HardDrive className="text-primary h-6 w-6" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-muted-foreground text-sm">Status Breakdown</p>
                <p className="text-sm">
                  Limited {formatNumber(totals.limited)} · Expired {formatNumber(totals.expired)} · Disabled {formatNumber(totals.disabled)}
                </p>
              </div>
              <Activity className="text-primary h-6 w-6" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create PasarGuard User</DialogTitle>
            <DialogDescription>Creates a real account on the connected upstream panel. Product selection fills traffic and expiry automatically.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={form.username} onChange={event => setForm(prev => ({ ...prev, username: event.target.value }))} placeholder="customer_001" required />
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={form.productId} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products
                    .filter(product => product.isActive)
                    .map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} · {product.dataLimitGb || 0} GB · {product.durationDays || 0} days
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data Limit / GB</Label>
                <Input type="number" min="0" step="0.1" value={form.dataLimitGb} onChange={event => setForm(prev => ({ ...prev, dataLimitGb: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Duration / days</Label>
                <Input type="number" min="0" value={form.durationDays} onChange={event => setForm(prev => ({ ...prev, durationDays: event.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea value={form.note} onChange={event => setForm(prev => ({ ...prev, note: event.target.value }))} placeholder="Optional note" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
