import PageHeader from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { formatMoney, formatNumber } from '@/features/accounting/format'
import { Product, ProductPayload, useDeleteProduct, useProducts, useSaveProduct } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { Edit3, Package, Plus, Trash2 } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'

type ProductFormState = {
  id?: string
  name: string
  description: string
  price: string
  dataLimitGb: string
  durationDays: string
  soldCount: string
  revenue: string
  isActive: boolean
}

const emptyForm: ProductFormState = {
  name: '',
  description: '',
  price: '',
  dataLimitGb: '',
  durationDays: '',
  soldCount: '0',
  revenue: '0',
  isActive: true,
}

const toForm = (product: Product): ProductFormState => ({
  id: product.id,
  name: product.name,
  description: product.description || '',
  price: String(product.price || ''),
  dataLimitGb: String(product.dataLimitGb || ''),
  durationDays: String(product.durationDays || ''),
  soldCount: String(product.soldCount || 0),
  revenue: String(product.revenue || 0),
  isActive: product.isActive,
})

const toPayload = (form: ProductFormState): ProductPayload & { id?: string } => ({
  id: form.id,
  name: form.name.trim(),
  description: form.description.trim(),
  price: Number(form.price || 0),
  currency: 'Toman',
  dataLimitGb: Number(form.dataLimitGb || 0),
  durationDays: Number(form.durationDays || 0),
  soldCount: Number(form.soldCount || 0),
  revenue: Number(form.revenue || 0),
  isActive: form.isActive,
})

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const { data: products = [] } = useProducts()
  const saveProduct = useSaveProduct()
  const deleteProduct = useDeleteProduct()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<ProductFormState>(emptyForm)

  const totals = useMemo(
    () => ({
      active: products.filter(product => product.isActive).length,
      orders: products.reduce((total, product) => total + product.soldCount, 0),
      revenue: products.reduce((total, product) => total + (product.revenue || product.price * product.soldCount), 0),
    }),
    [products],
  )

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['sales-status'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
  }

  const handleCreate = () => {
    setForm(emptyForm)
    setOpen(true)
  }

  const handleEdit = (product: Product) => {
    setForm(toForm(product))
    setOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await saveProduct.mutateAsync(toPayload(form))
      toast.success(form.id ? 'Product updated' : 'Product created')
      setOpen(false)
      setForm(emptyForm)
      refresh()
    } catch (error: any) {
      toast.error(error?.message || 'Could not save product')
    }
  }

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct.mutateAsync(product.id)
      toast.success('Product deleted')
      refresh()
    } catch (error: any) {
      toast.error(error?.message || 'Could not delete product')
    }
  }

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '400ms' }}>
        <PageHeader title="Products" description="Define the real products used by the Telegram sales bot and dashboard accounting." buttonIcon={Plus} buttonText="Create Product" onButtonClick={handleCreate} />
        <Separator />
      </div>

      <div className="w-full px-3 pt-4 pb-12 sm:px-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="group relative overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg">
            <div className="from-primary/10 absolute inset-0 bg-gradient-to-r to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <CardContent className="relative z-10 flex items-center justify-between p-5">
              <div>
                <p className="text-muted-foreground text-sm">Products</p>
                <p className="text-3xl font-semibold">{formatNumber(products.length)}</p>
              </div>
              <Package className="text-primary h-7 w-7" />
            </CardContent>
          </Card>
          <Card className="group relative overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg">
            <div className="from-primary/10 absolute inset-0 bg-gradient-to-r to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <CardContent className="relative z-10 flex items-center justify-between p-5">
              <div>
                <p className="text-muted-foreground text-sm">Active Products</p>
                <p className="text-3xl font-semibold">{formatNumber(totals.active)}</p>
              </div>
              <Badge variant="green">Live</Badge>
            </CardContent>
          </Card>
          <Card className="group relative overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg">
            <div className="from-primary/10 absolute inset-0 bg-gradient-to-r to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <CardContent className="relative z-10 p-5">
              <p className="text-muted-foreground text-sm">Recorded Revenue</p>
              <p className="text-2xl font-semibold">{formatMoney(totals.revenue, 'Toman')}</p>
              <p className="text-muted-foreground mt-1 text-xs">{formatNumber(totals.orders)} product orders</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4 overflow-hidden border-primary/10 bg-card/95 shadow-sm">
          <CardHeader className="border-b bg-primary/5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>Dashboard sales and revenue are calculated from these product records only.</CardDescription>
              </div>
              <Button onClick={handleCreate} className="gap-2"><Plus className="h-4 w-4" /> Create Product</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Product</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => {
                  const revenue = product.revenue || product.price * product.soldCount
                  return (
                    <TableRow key={product.id} className="transition-colors duration-200 hover:bg-muted/35">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-muted-foreground text-xs">{product.description || 'No description'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.dataLimitGb || 0} GB · {product.durationDays || 0} days</TableCell>
                      <TableCell>{formatMoney(product.price, product.currency)}</TableCell>
                      <TableCell>{formatNumber(product.soldCount)}</TableCell>
                      <TableCell>{formatMoney(revenue, product.currency)}</TableCell>
                      <TableCell><Badge variant={product.isActive ? 'green' : 'red'}>{product.isActive ? 'Active' : 'Disabled'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEdit(product)}><Edit3 className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDelete(product)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {!products.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground h-32 text-center">
                      No products have been defined yet. Create your first product to enable real sales statistics.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Product' : 'Create Product'}</DialogTitle>
            <DialogDescription>These fields feed the dashboard sales cards and Telegram bot catalog.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))} placeholder="30 Day Plan" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))} placeholder="Short description shown in admin catalog" />
            </div>
            <div className="space-y-2">
              <Label>Price / Toman</Label>
              <Input type="number" min="0" value={form.price} onChange={event => setForm(prev => ({ ...prev, price: event.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Data Limit / GB</Label>
              <Input type="number" min="0" step="0.1" value={form.dataLimitGb} onChange={event => setForm(prev => ({ ...prev, dataLimitGb: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Duration / days</Label>
              <Input type="number" min="0" value={form.durationDays} onChange={event => setForm(prev => ({ ...prev, durationDays: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Recorded orders</Label>
              <Input type="number" min="0" value={form.soldCount} onChange={event => setForm(prev => ({ ...prev, soldCount: event.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Recorded revenue / Toman</Label>
              <Input type="number" min="0" value={form.revenue} onChange={event => setForm(prev => ({ ...prev, revenue: event.target.value }))} />
              <p className="text-muted-foreground text-xs">Leave this at 0 to calculate revenue as price × recorded orders.</p>
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={event => setForm(prev => ({ ...prev, isActive: event.target.checked }))} /> Active product
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveProduct.isPending}>{saveProduct.isPending ? 'Saving...' : 'Save Product'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
