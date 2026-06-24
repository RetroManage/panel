import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MetricCard } from '@/features/accounting/metric-card'
import { formatMoney, formatNumber } from '@/features/accounting/format'
import { useBotUsers, useDashboardSummary, useSalesStatus } from '@/service/api'
import { Activity, BadgePercent, Banknote, Bot, CheckCircle2, CircleDollarSign, Clock3, CreditCard, HardDrive, Layers3, LineChart, PackageCheck, RadioTower, ReceiptText, TrendingUp, Users } from 'lucide-react'

const statusVariant = (status: string): 'green' | 'orange' | 'yellow' | 'red' | 'blue' => {
  switch (status) {
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

export default function Dashboard() {
  const { data } = useDashboardSummary()
  const { data: sales = [] } = useSalesStatus()
  const { data: users = [] } = useBotUsers()
  const currency = data?.currency || 'IRR'
  const discountCodes = users.reduce((total, user) => total + user.discountCodes, 0)
  const activeUsers = users.filter(user => user.status === 'active').length
  const limitedUsers = users.filter(user => user.status === 'limited').length
  const expiredUsers = users.filter(user => user.status === 'expired').length
  const disabledUsers = users.filter(user => user.status === 'disabled').length
  const totalTraffic = users.reduce((total, user) => total + user.usedTrafficGb, 0)
  const totalLimit = users.reduce((total, user) => total + user.dataLimitGb, 0)
  const totalOrders = sales.reduce((total, item) => total + item.orders, 0)
  const salesTotal = sales.reduce((total, item) => total + item.amount, 0)
  const maxAmount = Math.max(...sales.map(item => item.amount), 1)
  const firstAmount = sales[0]?.amount || 0
  const lastAmount = sales[sales.length - 1]?.amount || 0
  const salesDelta = firstAmount ? ((lastAmount - firstAmount) / firstAmount) * 100 : 0
  const usagePercent = totalLimit ? Math.round((totalTraffic / totalLimit) * 100) : 0
  const planMap = users.reduce<Record<string, number>>((acc, user) => {
    acc[user.planName] = (acc[user.planName] || 0) + 1
    return acc
  }, {})
  const plans = Object.entries(planMap).sort((a, b) => b[1] - a[1])
  const recentUsers = users.slice(0, 5)

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="w-full animate-fade-in transform-gpu" style={{ animationDuration: '520ms' }}>
        <PageHeader title="Dashboard" description="Advanced PasarGuard sales, users, discounts, traffic and operational overview." />
        <Separator />
      </div>

      <div className="w-full space-y-4 px-3 pt-4 pb-12 sm:px-4">
        <Card className="relative overflow-hidden border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
          <div className="from-primary/20 via-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />
          <CardContent className="relative grid gap-4 p-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="green" className="gap-1"><CheckCircle2 className="size-3" /> Panel Online</Badge>
                <Badge variant="blue" className="gap-1"><Bot className="size-3" /> Sales Automation</Badge>
                <Badge variant={salesDelta >= 0 ? 'green' : 'red'} className="gap-1"><TrendingUp className="size-3" /> {salesDelta >= 0 ? '+' : ''}{salesDelta.toFixed(1)}%</Badge>
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">PasarGuard Business Control</h2>
                <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-relaxed">
                  A dense dashboard for account growth, revenue health, user usage, discount activity, and the next backend integration step.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-xl border bg-background/55 p-3">
                <p className="text-muted-foreground text-xs">Today revenue</p>
                <p className="mt-1 text-xl font-semibold">{formatMoney(lastAmount, currency)}</p>
              </div>
              <div className="rounded-xl border bg-background/55 p-3">
                <p className="text-muted-foreground text-xs">Orders tracked</p>
                <p className="mt-1 text-xl font-semibold">{formatNumber(totalOrders)}</p>
              </div>
              <div className="rounded-xl border bg-background/55 p-3">
                <p className="text-muted-foreground text-xs">Last reconciled</p>
                <p className="mt-1 text-sm font-medium">{data?.lastReconciledAt ? new Date(data.lastReconciledAt).toLocaleString() : 'Pending'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Gross Sales" value={formatMoney(data?.grossSales || salesTotal, currency)} helper="Total sales before deductions" icon={CircleDollarSign} />
          <MetricCard title="Net Revenue" value={formatMoney(data?.netRevenue || 0, currency)} helper="Revenue after fees and discounts" icon={Banknote} />
          <MetricCard title="Users" value={formatNumber(users.length)} helper={`${formatNumber(activeUsers)} active accounts`} icon={Users} />
          <MetricCard title="Discount Codes" value={formatNumber(discountCodes)} helper="Applied or reserved discounts" icon={BadgePercent} />
          <MetricCard title="Open Invoices" value={formatNumber(data?.openInvoices || 0)} helper="Needs reconciliation" icon={ReceiptText} />
          <MetricCard title="Conversion Rate" value={`${(data?.conversionRate || 0).toFixed(1)}%`} helper="Visible sales funnel rate" icon={LineChart} />
          <MetricCard title="Traffic Used" value={`${totalTraffic.toFixed(1)} GB`} helper={`${usagePercent}% of assigned capacity`} icon={HardDrive} />
          <MetricCard title="Orders" value={formatNumber(totalOrders)} helper="Orders in the current sales feed" icon={CreditCard} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
          <Card className="overflow-hidden border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
            <CardHeader className="border-b bg-primary/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Sales Intelligence</CardTitle>
                  <CardDescription>Daily order amount and growth signal.</CardDescription>
                </div>
                <Badge variant={salesDelta >= 0 ? 'green' : 'red'}>{salesDelta >= 0 ? 'Growth' : 'Drop'}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex h-80 items-end gap-3 rounded-2xl border bg-background/55 p-4">
                {sales.map((item, index) => (
                  <div key={item.label} className="group flex h-full flex-1 flex-col justify-end gap-2">
                    <div className="relative flex flex-1 items-end rounded-xl bg-muted/40 p-1">
                      <div
                        className="from-primary/90 to-primary/45 min-h-3 w-full rounded-lg bg-gradient-to-t shadow-lg shadow-primary/10 transition-all duration-500 group-hover:scale-[1.03]"
                        style={{ height: `${Math.max(8, (item.amount / maxAmount) * 100)}%`, transitionDelay: `${index * 50}ms` }}
                      />
                    </div>
                    <div className="text-muted-foreground text-center text-xs">{item.label}</div>
                    <div className="text-center text-[11px] font-medium">{item.orders}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
            <CardHeader>
              <CardTitle>User Status</CardTitle>
              <CardDescription>Current lifecycle distribution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ['active', activeUsers],
                ['limited', limitedUsers],
                ['expired', expiredUsers],
                ['disabled', disabledUsers],
              ].map(([status, count]) => {
                const percent = users.length ? Math.round((Number(count) / users.length) * 100) : 0
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant={statusVariant(String(status))}>{status}</Badge>
                      <span className="font-medium">{count} · {percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layers3 className="text-primary size-5" /> Product Mix</CardTitle>
              <CardDescription>Users grouped by product plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {plans.length ? plans.map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between rounded-xl border bg-muted/25 p-3">
                  <span className="text-sm font-medium">{plan}</span>
                  <Badge variant="blue">{count}</Badge>
                </div>
              )) : <p className="text-muted-foreground text-sm">No products yet.</p>}
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><RadioTower className="text-primary size-5" /> Operations</CardTitle>
              <CardDescription>Useful live indicators for the next backend phase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-3"><span className="text-sm">Panel API</span><Badge variant="green">Connected</Badge></div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-3"><span className="text-sm">Accounting DB</span><Badge variant="green">Readable</Badge></div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-3"><span className="text-sm">Bot queue</span><Badge variant="orange">Prepared</Badge></div>
              <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-3"><span className="text-sm">Discount engine</span><Badge variant="blue">Tracked</Badge></div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock3 className="text-primary size-5" /> Recent Users</CardTitle>
              <CardDescription>Latest accounts available from the current API.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentUsers.length ? recentUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between rounded-xl border bg-muted/25 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.username}</p>
                    <p className="text-muted-foreground text-xs">{user.planName}</p>
                  </div>
                  <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                </div>
              )) : <p className="text-muted-foreground text-sm">No users yet.</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
          <CardContent className="grid gap-4 p-4 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/25 p-4">
              <PackageCheck className="text-primary size-5" />
              <div><p className="font-medium">Products ready</p><p className="text-muted-foreground text-xs">Coming soon route is prepared.</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-muted/25 p-4">
              <Activity className="text-primary size-5" />
              <div><p className="font-medium">Backend bridge</p><p className="text-muted-foreground text-xs">Ready for PasarGuard DB read phase.</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-muted/25 p-4">
              <BadgePercent className="text-primary size-5" />
              <div><p className="font-medium">Discount tracking</p><p className="text-muted-foreground text-xs">Aggregated in dashboard and users.</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
