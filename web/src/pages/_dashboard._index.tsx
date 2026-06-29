import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import DashboardStatistics from '@/features/dashboard/components/dashboard-statistics'
import { formatMoney, formatNumber } from '@/features/accounting/format'
import { useDashboardSummary, useProducts, useSalesStatus, type DashboardSummary, type SystemResourceStats, type SystemUsersStats } from '@/service/api'
import { Activity, BadgeCheck, Banknote, CircleDollarSign, Package, ReceiptText, ShoppingCart, Users, type LucideIcon } from 'lucide-react'

const toResourceStats = (summary?: DashboardSummary): SystemResourceStats | undefined => {
  if (!summary) return undefined
  return {
    cpu_usage: summary.cpuUsage || 0,
    cpu_cores: summary.cpuCores || 0,
    mem_used: summary.memoryUsedBytes || 0,
    mem_total: summary.memoryTotalBytes || 0,
    disk_used: summary.diskUsedBytes || 0,
    disk_total: summary.diskTotalBytes || 0,
    uptime_seconds: summary.uptimeSeconds || 0,
  }
}

const toUsersStats = (summary?: DashboardSummary): SystemUsersStats | undefined => {
  if (!summary) return undefined
  return {
    total_user: summary.totalUsers || 0,
    active_users: summary.activeUsers || 0,
    online_users: summary.onlineUsers || 0,
    limited_users: summary.limitedUsers || 0,
    expired_users: summary.expiredUsers || 0,
    disabled_users: summary.disabledUsers || 0,
    incoming_bandwidth: summary.incomingBandwidth || 0,
    outgoing_bandwidth: summary.outgoingBandwidth || summary.totalTrafficBytes || 0,
  }
}

const StatPill = ({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) => (
  <div className="bg-background/60 rounded-lg border p-3 sm:p-4">
    <div className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium sm:gap-2 sm:text-sm">
      <Icon className="text-primary h-3.5 w-3.5 sm:h-4 sm:w-4" />
      <span>{label}</span>
    </div>
    <span dir="ltr" className="text-xl font-bold transition-all duration-300 sm:text-2xl lg:text-3xl">
      {formatNumber(value)}
    </span>
  </div>
)

export default function Dashboard() {
  const { data: summary } = useDashboardSummary()
  const { data: sales = [] } = useSalesStatus()
  const { data: products = [] } = useProducts()

  const resourceData = toResourceStats(summary)
  const usersData = toUsersStats(summary)
  const currency = summary?.currency || 'Toman'
  const totalOrders = sales.reduce((total, item) => total + item.orders, 0)
  const totalAmount = sales.reduce((total, item) => total + item.amount, 0)
  const activeProducts = products.filter(product => product.isActive).length
  const maxAmount = Math.max(...sales.map(item => item.amount), 1)

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '400ms' }}>
        <PageHeader title="dashboard" description="dashboardDescription" />
        <Separator />
      </div>

      <div className="w-full px-3 pt-2 pb-12 sm:px-4">
        <div className="flex flex-col gap-4 sm:gap-6">
          {summary?.error && (
            <Card className="animate-slide-up border-orange-500/20 bg-orange-500/5 shadow-sm" style={{ animationDuration: '450ms' }}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Live data is not available yet</p>
                  <p className="text-muted-foreground text-sm">Connect a PasarGuard panel to replace empty values with real upstream statistics.</p>
                </div>
                <Badge variant="orange">{summary.panelStatus || 'not connected'}</Badge>
              </CardContent>
            </Card>
          )}

          <div className="animate-slide-up transform-gpu" style={{ animationDuration: '500ms', animationDelay: '100ms', animationFillMode: 'both' }}>
            <DashboardStatistics resourceData={resourceData} usersData={usersData} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="group relative overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg">
              <div className="from-primary/10 absolute inset-0 bg-gradient-to-r to-transparent opacity-0 transition-opacity duration-500 dark:from-primary/5 group-hover:opacity-100" />
              <CardHeader className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CircleDollarSign className="text-primary h-5 w-5" /> Product Sales
                  </CardTitle>
                  <CardDescription>Revenue is derived only from products defined in Products; no fake or seeded accounting rows are rendered.</CardDescription>
                </div>
                <Badge variant={sales.length ? 'green' : 'blue'}>{formatNumber(totalOrders)} orders</Badge>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatPill label="Gross Sales" value={totalAmount || summary?.grossSales || 0} icon={Banknote} />
                  <StatPill label="Net Revenue" value={summary?.netRevenue || 0} icon={ReceiptText} />
                  <StatPill label="Products" value={activeProducts} icon={Package} />
                </div>

                <div className="space-y-3 rounded-lg border bg-background/60 p-4">
                  {sales.length ? (
                    sales.map(item => (
                      <div key={item.label} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium">{item.label}</span>
                          <span className="text-muted-foreground shrink-0">{formatMoney(item.amount, currency)} · {item.orders} orders</span>
                        </div>
                        <div className="bg-muted h-2 overflow-hidden rounded-full">
                          <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(5, (item.amount / maxAmount) * 100)}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex min-h-24 flex-col items-center justify-center text-center">
                      <ShoppingCart className="text-muted-foreground mb-2 h-8 w-8" />
                      <p className="font-medium">No real sales recorded</p>
                      <p className="text-muted-foreground max-w-md text-sm">Create products and record sold counts/revenue there to populate this section.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg">
              <div className="from-primary/10 absolute inset-0 bg-gradient-to-r to-transparent opacity-0 transition-opacity duration-500 dark:from-primary/5 group-hover:opacity-100" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="text-primary h-5 w-5" /> Account Status
                </CardTitle>
                <CardDescription>Live user counts from the connected panel.</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 grid grid-cols-2 gap-3">
                <StatPill label="Total" value={summary?.totalUsers || 0} icon={Users} />
                <StatPill label="Online" value={summary?.onlineUsers || 0} icon={BadgeCheck} />
                <StatPill label="Limited" value={summary?.limitedUsers || 0} icon={Activity} />
                <StatPill label="Expired" value={summary?.expiredUsers || 0} icon={ReceiptText} />
                <div className="col-span-2">
                  <StatPill label="Disabled" value={summary?.disabledUsers || 0} icon={Users} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
