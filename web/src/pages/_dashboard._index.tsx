import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MetricCard } from '@/features/accounting/metric-card'
import { formatMoney, formatNumber } from '@/features/accounting/format'
import { useBotUsers, useDashboardSummary, useSalesStatus } from '@/service/api'
import { Activity, Banknote, CircleDollarSign, Clock3, Cpu, Database, HardDrive, LineChart, RadioTower, Users } from 'lucide-react'

const bytesToGB = (value?: number) => ((value || 0) / 1024 / 1024 / 1024)
const percent = (used?: number, total?: number) => {
  if (!used || !total) return 0
  return Math.min(100, Math.round((used / total) * 100))
}
const formatBytes = (value?: number) => {
  const gb = bytesToGB(value)
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`
  return `${gb.toFixed(1)} GB`
}
const formatUptime = (seconds?: number) => {
  if (!seconds) return '-'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  return days ? `${days}d ${hours}h` : `${hours}h`
}
const statusVariant = (status?: string): 'green' | 'orange' | 'yellow' | 'red' | 'blue' => {
  switch ((status || '').toLowerCase()) {
    case 'connected':
    case 'active':
      return 'green'
    case 'limited':
      return 'orange'
    case 'expired':
      return 'yellow'
    case 'failed':
    case 'disabled':
    case 'not_connected':
      return 'red'
    default:
      return 'blue'
  }
}

export default function Dashboard() {
  const { data } = useDashboardSummary()
  const { data: sales = [] } = useSalesStatus()
  const { data: users = [] } = useBotUsers()

  const currency = data?.currency || 'Toman'
  const totalUsers = data?.totalUsers ?? users.length
  const activeUsers = data?.activeUsers ?? users.filter(user => user.status === 'active').length
  const onlineUsers = data?.onlineUsers ?? 0
  const limitedUsers = data?.limitedUsers ?? users.filter(user => user.status === 'limited').length
  const expiredUsers = data?.expiredUsers ?? users.filter(user => user.status === 'expired').length
  const disabledUsers = data?.disabledUsers ?? users.filter(user => user.status === 'disabled').length
  const totalTraffic = data?.totalTrafficBytes || users.reduce((total, user) => total + user.usedTrafficGb * 1024 * 1024 * 1024, 0)
  const totalOrders = sales.reduce((total, item) => total + item.orders, 0)
  const salesTotal = sales.reduce((total, item) => total + item.amount, 0)
  const maxAmount = Math.max(...sales.map(item => item.amount), 1)
  const recentUsers = users.slice(0, 6)
  const memoryPercent = percent(data?.memoryUsedBytes, data?.memoryTotalBytes)
  const diskPercent = percent(data?.diskUsedBytes, data?.diskTotalBytes)

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="w-full animate-fade-in transform-gpu" style={{ animationDuration: '360ms' }}>
        <PageHeader title="Dashboard" description="Live sales, users, traffic and resource overview from the connected panel." />
        <Separator />
      </div>

      <div className="w-full space-y-4 px-3 pt-4 pb-12 sm:px-4">
        {data?.error && (
          <Card className="border-orange-500/20 bg-orange-500/5 shadow-sm">
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Live data is not available yet</p>
                <p className="text-muted-foreground text-sm">Connect and verify a panel to replace this empty state with real numbers.</p>
              </div>
              <Badge variant={statusVariant(data.panelStatus)}>{data.panelStatus || 'not connected'}</Badge>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Gross Sales" value={formatMoney(data?.grossSales || salesTotal, currency)} helper="Real product sales in Toman" icon={CircleDollarSign} />
          <MetricCard title="Net Revenue" value={formatMoney(data?.netRevenue || 0, currency)} helper="After discount and fee records" icon={Banknote} />
          <MetricCard title="Users" value={formatNumber(totalUsers)} helper={`${activeUsers} active · ${onlineUsers} online`} icon={Users} />
          <MetricCard title="Used Traffic" value={formatBytes(totalTraffic)} helper="Summed from real user usage" icon={HardDrive} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-primary/10 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><LineChart className="text-primary size-5" /> Sales Trend</CardTitle>
                <CardDescription>Shows real product sales after product and payment records exist.</CardDescription>
              </div>
              <Badge variant="blue">{formatNumber(totalOrders)} orders</Badge>
            </CardHeader>
            <CardContent>
              {sales.length ? (
                <div className="flex h-64 items-end gap-3 rounded-2xl border bg-muted/20 p-4">
                  {sales.map(item => (
                    <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                      <div className="bg-primary/75 hover:bg-primary min-h-3 rounded-t-xl transition-all duration-300" style={{ height: `${Math.max(8, (item.amount / maxAmount) * 100)}%` }} />
                      <div className="text-muted-foreground text-center text-xs">{item.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border bg-muted/20 text-center">
                  <LineChart className="text-muted-foreground mb-3 size-9" />
                  <p className="font-medium">No real sales records yet</p>
                  <p className="text-muted-foreground max-w-md text-sm">Define products and let the bot register payments; placeholder chart data is no longer shown.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><RadioTower className="text-primary size-5" /> Live Status</CardTitle>
              <CardDescription>Current upstream connection and machine health.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-3"><span className="text-sm">Panel</span><Badge variant={statusVariant(data?.panelStatus)}>{data?.panelStatus || 'not connected'}</Badge></div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-3"><span className="text-sm">CPU</span><span className="text-sm font-medium">{(data?.cpuUsage || 0).toFixed(1)}% · {data?.cpuCores || 0} cores</span></div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-3"><span className="text-sm">Memory</span><span className="text-sm font-medium">{formatBytes(data?.memoryUsedBytes)} / {formatBytes(data?.memoryTotalBytes)} ({memoryPercent}%)</span></div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-3"><span className="text-sm">Disk</span><span className="text-sm font-medium">{formatBytes(data?.diskUsedBytes)} / {formatBytes(data?.diskTotalBytes)} ({diskPercent}%)</span></div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-3"><span className="text-sm">Uptime</span><span className="text-sm font-medium">{formatUptime(data?.uptimeSeconds)}</span></div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="border-primary/10 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="text-primary size-5" /> User Breakdown</CardTitle>
              <CardDescription>Counts returned by the live users/statistics endpoints.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-muted/25 p-3"><p className="text-muted-foreground text-xs">Active</p><p className="text-xl font-semibold">{formatNumber(activeUsers)}</p></div>
              <div className="rounded-xl border bg-muted/25 p-3"><p className="text-muted-foreground text-xs">Limited</p><p className="text-xl font-semibold">{formatNumber(limitedUsers)}</p></div>
              <div className="rounded-xl border bg-muted/25 p-3"><p className="text-muted-foreground text-xs">Expired</p><p className="text-xl font-semibold">{formatNumber(expiredUsers)}</p></div>
              <div className="rounded-xl border bg-muted/25 p-3"><p className="text-muted-foreground text-xs">Disabled</p><p className="text-xl font-semibold">{formatNumber(disabledUsers)}</p></div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cpu className="text-primary size-5" /> Resource Snapshot</CardTitle>
              <CardDescription>CPU, memory, disk and bandwidth with no placeholder data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border bg-muted/25 p-3"><Cpu className="text-primary size-5" /><div><p className="font-medium">{(data?.cpuUsage || 0).toFixed(1)}% CPU</p><p className="text-muted-foreground text-xs">{data?.cpuCores || 0} core(s)</p></div></div>
              <div className="flex items-center gap-3 rounded-xl border bg-muted/25 p-3"><Database className="text-primary size-5" /><div><p className="font-medium">{formatBytes(data?.memoryUsedBytes)} memory</p><p className="text-muted-foreground text-xs">{memoryPercent}% used</p></div></div>
              <div className="flex items-center gap-3 rounded-xl border bg-muted/25 p-3"><HardDrive className="text-primary size-5" /><div><p className="font-medium">{formatBytes(data?.diskUsedBytes)} disk</p><p className="text-muted-foreground text-xs">{diskPercent}% used</p></div></div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/90 shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock3 className="text-primary size-5" /> Recent Users</CardTitle>
              <CardDescription>Latest accounts pulled from the connected panel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentUsers.length ? recentUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between rounded-xl border bg-muted/25 p-3 transition-colors duration-200 hover:bg-muted/40">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.username || user.id}</p>
                    <p className="text-muted-foreground text-xs">{user.usedTrafficGb.toFixed(1)} GB used</p>
                  </div>
                  <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                </div>
              )) : <p className="text-muted-foreground text-sm">No users returned yet.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
