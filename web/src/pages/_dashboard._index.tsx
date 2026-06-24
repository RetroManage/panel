import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MetricCard } from '@/features/accounting/metric-card'
import { formatMoney } from '@/features/accounting/format'
import { useBotUsers, useDashboardSummary, useSalesStatus } from '@/service/api'
import { Activity, BadgePercent, Banknote, CircleDollarSign, Users } from 'lucide-react'

export default function Dashboard() {
  const { data } = useDashboardSummary()
  const { data: sales = [] } = useSalesStatus()
  const { data: botUsers = [] } = useBotUsers()
  const currency = data?.currency || 'IRR'
  const discountCodes = botUsers.reduce((total, user) => total + user.discountCodes, 0)
  const maxAmount = Math.max(...sales.map(item => item.amount), 1)

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '400ms' }}>
        <PageHeader title="Dashboard" description="General bot, sales, discount, and accounting overview for PasarGuard." tutorialUrl="https://github.com/PasarGuard/panel#readme" />
        <Separator />
      </div>

      <div className="w-full px-3 pt-4 sm:px-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Gross Sales" value={formatMoney(data?.grossSales || 0, currency)} helper="Total sales before deductions" icon={CircleDollarSign} />
          <MetricCard title="Net Revenue" value={formatMoney(data?.netRevenue || 0, currency)} helper="Revenue after fees and discounts" icon={Banknote} />
          <MetricCard title="Bot Users" value={String(botUsers.length)} helper="Users created by Telegram bot" icon={Users} />
          <MetricCard title="Discount Codes" value={String(discountCodes)} helper="Discount codes used by bot users" icon={BadgePercent} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Weekly Sales Trend</CardTitle>
                  <CardDescription>Placeholder chart wired to the local Go API.</CardDescription>
                </div>
                <Badge variant="blue">Accounting</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex h-72 items-end gap-3 rounded-md border p-4">
                {sales.map(item => (
                  <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                    <div className="bg-primary/80 hover:bg-primary min-h-2 rounded-t-md transition-all" style={{ height: `${Math.max(8, (item.amount / maxAmount) * 100)}%` }} />
                    <div className="text-muted-foreground text-center text-xs">{item.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operations Snapshot</CardTitle>
              <CardDescription>Current system accounting status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <Activity className="text-primary size-5" />
                  <span className="text-sm">Panel status</span>
                </div>
                <Badge variant="green">Online</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <Users className="text-primary size-5" />
                  <span className="text-sm">Active bot users</span>
                </div>
                <span className="font-medium">{botUsers.filter(user => user.status === 'active').length}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">Last reconciled</span>
                <span className="text-muted-foreground text-xs">{data?.lastReconciledAt ? new Date(data.lastReconciledAt).toLocaleString() : 'Pending'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
