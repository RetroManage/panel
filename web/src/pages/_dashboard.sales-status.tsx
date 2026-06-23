import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatMoney, formatNumber } from '@/features/accounting/format'
import { useDashboardSummary, useSalesStatus } from '@/service/api'

export default function SalesStatus() {
  const { data: summary } = useDashboardSummary()
  const { data: sales = [] } = useSalesStatus()
  const currency = summary?.currency || 'IRR'
  const totalOrders = sales.reduce((total, item) => total + item.orders, 0)
  const totalAmount = sales.reduce((total, item) => total + item.amount, 0)
  const maxAmount = Math.max(...sales.map(item => item.amount), 1)

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '400ms' }}>
        <PageHeader title="Sales Status" description="A first accounting view for daily sales volume, order count, and settlement status." tutorialUrl="https://github.com/RetroManage/panel#readme" />
        <Separator />
      </div>

      <div className="w-full px-3 pt-4 sm:px-4">
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Sales Pipeline</CardTitle>
                  <CardDescription>Temporary visual report. Real accounting rules will be added next.</CardDescription>
                </div>
                <Badge variant="green">{formatNumber(totalOrders)} orders</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sales.map(item => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground">{formatMoney(item.amount, currency)} · {item.orders} orders</span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(5, (item.amount / maxAmount) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settlement Summary</CardTitle>
              <CardDescription>Current totals from the local data store.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">Total amount</span>
                <span className="font-medium">{formatMoney(totalAmount, currency)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">Open invoices</span>
                <span className="font-medium">{summary?.openInvoices || 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">Net revenue</span>
                <span className="font-medium">{formatMoney(summary?.netRevenue || 0, currency)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Daily Sales Rows</CardTitle>
            <CardDescription>Placeholder table for sales ledger entries.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(item => (
                  <TableRow key={item.label}>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell>{item.orders}</TableCell>
                    <TableCell>{formatMoney(item.amount, currency)}</TableCell>
                    <TableCell><Badge variant="blue">Recorded</Badge></TableCell>
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
