import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatMoney } from '@/features/accounting/format'
import { useAdminLeaderboard, useDashboardSummary } from '@/service/api'
import { Medal } from 'lucide-react'

export default function AdminLeaderboard() {
  const { data: summary } = useDashboardSummary()
  const { data: admins = [] } = useAdminLeaderboard()
  const currency = summary?.currency || 'IRR'

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '400ms' }}>
        <PageHeader title="Admin Leaderboard" description="Performance board for administrators and sales operators." tutorialUrl="https://github.com/RetroManage/panel#readme" />
        <Separator />
      </div>

      <div className="w-full px-3 pt-4 sm:px-4">
        <div className="grid gap-4 lg:grid-cols-3">
          {admins.slice(0, 3).map((admin, index) => (
            <Card key={admin.adminId} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{admin.displayName}</CardTitle>
                    <CardDescription>Rank #{index + 1}</CardDescription>
                  </div>
                  <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
                    <Medal className="size-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-medium">{formatMoney(admin.revenue, currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Closed deals</span>
                  <span className="font-medium">{admin.closedDeals}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Collection</span>
                  <Badge variant="green">{admin.collectionPct}%</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Leaderboard Table</CardTitle>
            <CardDescription>Temporary ranking data from the local Go store.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Closed Deals</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Collection Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin, index) => (
                  <TableRow key={admin.adminId}>
                    <TableCell>#{index + 1}</TableCell>
                    <TableCell className="font-medium">{admin.displayName}</TableCell>
                    <TableCell>{admin.closedDeals}</TableCell>
                    <TableCell>{formatMoney(admin.revenue, currency)}</TableCell>
                    <TableCell><Badge variant={admin.collectionPct >= 90 ? 'green' : 'yellow'}>{admin.collectionPct}%</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
