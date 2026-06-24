import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MetricCard } from '@/features/accounting/metric-card'
import { formatMoney, formatNumber } from '@/features/accounting/format'
import { BotUser, useBotUsers, useDashboardSummary } from '@/service/api'
import { Activity, BadgePercent, HardDrive, UsersIcon } from 'lucide-react'
import { useMemo } from 'react'

const formatDate = (value: string) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(value))
}

const usagePercent = (user: BotUser) => {
  if (!user.dataLimitGb) return 0
  return Math.min(100, Math.round((user.usedTrafficGb / user.dataLimitGb) * 100))
}

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

export default function UsersPage() {
  const { data: users = [] } = useBotUsers()
  const { data: summary } = useDashboardSummary()
  const currency = summary?.currency || 'IRR'

  const totals = useMemo(
    () => ({
      active: users.filter(user => user.status === 'active').length,
      traffic: users.reduce((total, user) => total + user.usedTrafficGb, 0),
      revenue: users.reduce((total, user) => total + user.totalPaid, 0),
      discounts: users.reduce((total, user) => total + user.discountCodes, 0),
    }),
    [users],
  )

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '400ms' }}>
        <PageHeader title="Users" description="PasarGuard accounts created through the sales flow are listed here." tutorialUrl="https://github.com/PasarGuard/panel#readme" />
        <Separator />
      </div>

      <div className="w-full px-3 pt-4 sm:px-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Users" value={formatNumber(users.length)} helper="Filtered user feed" icon={UsersIcon} />
          <MetricCard title="Active Users" value={formatNumber(totals.active)} helper="Currently active accounts" icon={Activity} />
          <MetricCard title="Used Traffic" value={`${totals.traffic.toFixed(1)} GB`} helper="Total user consumption" icon={HardDrive} />
          <MetricCard title="Discount Codes" value={formatNumber(totals.discounts)} helper="Codes used by users" icon={BadgePercent} />
        </div>

        <Card className="mt-4 overflow-hidden border-primary/10 bg-card/95 shadow-sm">
          <CardHeader className="border-b bg-primary/5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>PasarGuard Users</CardTitle>
                <CardDescription>Backend filtering keeps this list aligned with the sales flow.</CardDescription>
              </div>
              <Badge variant="blue">{formatMoney(totals.revenue, currency)} revenue</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>User</TableHead>
                  <TableHead>Telegram ID</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => {
                  const percent = usagePercent(user)
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.username}</span>
                          <span className="text-muted-foreground text-xs">Created {formatDate(user.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.telegramId || '-'}</TableCell>
                      <TableCell>{user.planName}</TableCell>
                      <TableCell>
                        <div className="min-w-36 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{user.usedTrafficGb.toFixed(1)} / {user.dataLimitGb.toFixed(0)} GB</span>
                            <span className="text-muted-foreground">{percent}%</span>
                          </div>
                          <div className="bg-muted h-2 overflow-hidden rounded-full">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(4, percent)}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.expiresAt)}</TableCell>
                      <TableCell><Badge variant={statusVariant(user.status)}>{user.status}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{formatMoney(user.totalPaid, currency)}</TableCell>
                    </TableRow>
                  )
                })}
                {!users.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground h-32 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
