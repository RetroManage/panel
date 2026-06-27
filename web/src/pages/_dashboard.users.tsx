import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MetricCard } from '@/features/accounting/metric-card'
import { formatNumber } from '@/features/accounting/format'
import { BotUser, useBotUsers, useDashboardSummary } from '@/service/api'
import { Activity, HardDrive, RadioTower, UsersIcon } from 'lucide-react'
import { useMemo } from 'react'

const formatDate = (value: string) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '-'
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).format(new Date(value))
}

const usagePercent = (user: BotUser) => {
  if (!user.dataLimitGb) return 0
  return Math.min(100, Math.round((user.usedTrafficGb / user.dataLimitGb) * 100))
}

const statusVariant = (status: string): 'green' | 'orange' | 'yellow' | 'red' | 'blue' => {
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

export default function UsersPage() {
  const { data: users = [] } = useBotUsers()
  const { data: summary } = useDashboardSummary()

  const totals = useMemo(
    () => ({
      active: summary?.activeUsers ?? users.filter(user => user.status === 'active').length,
      online: summary?.onlineUsers ?? 0,
      traffic: users.reduce((total, user) => total + user.usedTrafficGb, 0),
      limited: summary?.limitedUsers ?? users.filter(user => user.status === 'limited').length,
    }),
    [summary?.activeUsers, summary?.limitedUsers, summary?.onlineUsers, users],
  )

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '320ms' }}>
        <PageHeader title="Users" description="Real upstream accounts pulled from the connected panel." />
        <Separator />
      </div>

      <div className="w-full px-3 pt-4 pb-12 sm:px-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Users" value={formatNumber(summary?.totalUsers ?? users.length)} helper="Live account feed" icon={UsersIcon} />
          <MetricCard title="Active Users" value={formatNumber(totals.active)} helper={`${formatNumber(totals.online)} online now`} icon={Activity} />
          <MetricCard title="Used Traffic" value={`${totals.traffic.toFixed(1)} GB`} helper="Summed from live users" icon={HardDrive} />
          <MetricCard title="Limited Users" value={formatNumber(totals.limited)} helper="Current limited accounts" icon={RadioTower} />
        </div>

        <Card className="mt-4 overflow-hidden border-primary/10 bg-card/95 shadow-sm">
          <CardHeader className="border-b bg-primary/5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Panel Users</CardTitle>
                <CardDescription>No seeded users are displayed; the list is returned by the configured panel API.</CardDescription>
              </div>
              <Badge variant={summary?.realData ? 'green' : 'orange'}>{summary?.realData ? 'Live' : 'Waiting for panel'}</Badge>
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
                {users.map(user => {
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
                        <div className="min-w-36 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{user.usedTrafficGb.toFixed(1)} / {user.dataLimitGb ? user.dataLimitGb.toFixed(0) : '∞'} GB</span>
                            <span className="text-muted-foreground">{percent}%</span>
                          </div>
                          <div className="bg-muted h-2 overflow-hidden rounded-full">
                            <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${user.dataLimitGb ? Math.max(4, percent) : 0}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>{formatDate(user.expiresAt)}</TableCell>
                      <TableCell><Badge variant={statusVariant(user.status)}>{user.status || 'unknown'}</Badge></TableCell>
                    </TableRow>
                  )
                })}
                {!users.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground h-32 text-center">
                      No live users were returned. Connect and verify a panel first.
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
