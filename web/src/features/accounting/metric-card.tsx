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
        'group relative overflow-hidden border-primary/10 bg-card/85 shadow-sm shadow-primary/5 backdrop-blur transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md',
        className,
      )}
    >
      <div className="from-primary/10 pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        <div className="bg-primary/10 text-primary ring-primary/10 flex size-9 items-center justify-center rounded-xl ring-1 transition-all duration-200 group-hover:scale-[1.04] group-hover:bg-primary/90 group-hover:text-primary-foreground">
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
