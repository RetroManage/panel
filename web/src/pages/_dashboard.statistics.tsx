import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MetricCard } from '@/features/accounting/metric-card'
import { formatMoney, formatNumber } from '@/features/accounting/format'
import { useBotUsers, useDashboardSummary, useSalesStatus } from '@/service/api'
import { Activity, ArrowDownRight, ArrowUpRight, RadioTower, TrendingUp, Wifi } from 'lucide-react'

export default function StatisticsPage() {
  const { data: summary } = useDashboardSummary()
  const { data: sales = [] } = useSalesStatus()
  const { data: users = [] } = useBotUsers()
  const currency = summary?.currency || 'IRR'
  const totalSales = sales.reduce((total, item) => total + item.amount, 0)
  const totalOrders = sales.reduce((total, item) => total + item.orders, 0)
  const totalTraffic = users.reduce((total, user) => total + user.usedTrafficGb, 0)
  const activeUsers = users.filter(user => user.status === 'active').length
  const maxAmount = Math.max(...sales.map(item => item.amount), 1)
  const firstAmount = sales[0]?.amount || 0
  const lastAmount = sales[sales.length - 1]?.amount || 0
  const salesDelta = firstAmount ? ((lastAmount - firstAmount) / firstAmount) * 100 : 0
  const DeltaIcon = salesDelta >= 0 ? ArrowUpRight : ArrowDownRight

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '400ms' }}>
        <PageHeader title="Statistics" description="Panel connectivity, bot-user consumption, and sales movement for the PasarGuard stack." tutorialUrl="https://github.com/PasarGuard/panel#readme" />
        <Separator />
      </div>

      <div className="w-full px-3 pt-4 sm:px-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Panel Connection" value="Online" helper="Local API session is authenticated" icon={Wifi} />
          <MetricCard title="Bot Users Online" value={formatNumber(activeUsers)} helper={`${formatNumber(users.length)} bot-created users tracked`} icon={RadioTower} />
          <MetricCard title="Traffic Used" value={`${totalTraffic.toFixed(1)} GB`} helper="Consumption from bot-created users" icon={Activity} />
          <MetricCard title="Sales Movement" value={`${salesDelta >= 0 ? '+' : ''}${salesDelta.toFixed(1)}%`} helper="First-to-last visible sales delta" icon={TrendingUp} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <Card className="overflow-hidden border-primary/10">
            <CardHeader className="border-b bg-primary/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Sales Trend</CardTitle>
                  <CardDescription>Drop and growth tracking from the active sales feed.</CardDescription>
                </div>
                <Badge variant={salesDelta >= 0 ? 'green' : 'red'}>
                  <DeltaIcon className="mr-1 size-3" />
                  {salesDelta >= 0 ? 'Growth' : 'Drop'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex h-72 items-end gap-3 rounded-xl border bg-background/60 p-4">
                {sales.map(item => (
                  <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2">
                    <div className="bg-primary/80 hover:bg-primary min-h-2 rounded-t-lg shadow-sm shadow-primary/20 transition-all" style={{ height: `${Math.max(8, (item.amount / maxAmount) * 100)}%` }} />
                    <div className="text-muted-foreground text-center text-xs">{item.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>Panel Snapshot</CardTitle>
              <CardDescription>Operational accounting and bot statistics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Connection status</span>
                <Badge variant="green">Connected</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Total sales</span>
                <span className="font-medium">{formatMoney(totalSales, currency)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Orders</span>
                <span className="font-medium">{formatNumber(totalOrders)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Open invoices</span>
                <span className="font-medium">{summary?.openInvoices || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Last reconciled</span>
                <span className="text-muted-foreground text-xs">{summary?.lastReconciledAt ? new Date(summary.lastReconciledAt).toLocaleString() : 'Pending'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
