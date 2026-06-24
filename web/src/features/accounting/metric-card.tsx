import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  className,
}: {
  title: string
  value: string
  helper?: string
  icon: LucideIcon
  className?: string
}) {
  return (
    <Card
      className={cn(
        'group relative overflow-hidden border-primary/10 bg-card/85 shadow-sm shadow-primary/5 backdrop-blur transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10',
        className,
      )}
    >
      <div className="from-primary/18 pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        <div className="bg-primary/10 text-primary ring-primary/10 flex size-9 items-center justify-center rounded-xl ring-1 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {helper && <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{helper}</p>}
      </CardContent>
    </Card>
  )
}
