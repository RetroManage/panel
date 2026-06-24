import PageHeader from '@/components/layout/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Package } from 'lucide-react'

export default function ProductsPage() {
  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '400ms' }}>
        <PageHeader title="Products" description="Product definition area for the Telegram sales bot." tutorialUrl="https://github.com/PasarGuard/panel#readme" />
        <Separator />
      </div>
      <div className="flex w-full px-3 pt-4 sm:px-4">
        <Card className="w-full border-primary/10 bg-card/95 shadow-sm">
          <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
            <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-2xl ring-1 ring-primary/20">
              <Package className="size-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Coming Soon ...</h2>
              <p className="text-muted-foreground max-w-md text-sm">Products will be connected here later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
