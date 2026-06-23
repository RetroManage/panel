import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

export function MetricCard({ title, value, helper, icon: Icon }: { title: string; value: string; helper?: string; icon: LucideIcon }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-normal">{title}</CardTitle>
        <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {helper && <p className="text-muted-foreground mt-1 text-xs">{helper}</p>}
      </CardContent>
    </Card>
  )
}
