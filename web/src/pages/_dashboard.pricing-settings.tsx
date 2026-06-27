import PageHeader from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { usePricingSettings, useSavePricingSettings, PricingSettings } from '@/service/api'
import { queryClient } from '@/utils/query-client'
import { Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const variablesToText = (variables: Record<string, string> = {}) => Object.entries(variables).map(([key, value]) => `${key}=${value}`).join('\n')
const textToVariables = (text: string) => {
  const out: Record<string, string> = {}
  text
    .split('\n')
    .map(row => row.trim())
    .filter(Boolean)
    .forEach(row => {
      const [key, ...rest] = row.split('=')
      if (key.trim()) out[key.trim()] = rest.join('=').trim()
    })
  return out
}

export default function PricingSettingsPage() {
  const { data } = usePricingSettings()
  const saveMutation = useSavePricingSettings()
  const [form, setForm] = useState<PricingSettings | null>(null)
  const [variablesText, setVariablesText] = useState('')

  useEffect(() => {
    if (!data) return
    setForm(data)
    setVariablesText(variablesToText(data.variables))
  }, [data])

  const changed = useMemo(() => !!form, [form])

  const update = (key: keyof PricingSettings, value: string | number) => {
    setForm(prev => (prev ? { ...prev, [key]: value } : prev))
  }

  const save = async () => {
    if (!form) return
    const payload = { ...form, variables: textToVariables(variablesText) }
    try {
      await saveMutation.mutateAsync(payload)
      await queryClient.invalidateQueries({ queryKey: ['pricing-settings'] })
      toast.success('Pricing settings saved')
    } catch (err: any) {
      toast.error(err?.message || 'Could not save pricing settings')
    }
  }

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <div className="animate-fade-in w-full transform-gpu" style={{ animationDuration: '400ms' }}>
        <PageHeader title="Price & Variable Settings" description="Configure base price, commissions, tax values, and custom accounting variables." tutorialUrl="https://github.com/RetroManage/panel#readme" />
        <Separator />
      </div>

      <div className="w-full px-3 pt-4 sm:px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Pricing Rules</CardTitle>
                <CardDescription>These values are stored in the backend and used by the sales workflow.</CardDescription>
              </div>
              <Button onClick={save} disabled={!changed || saveMutation.isPending}>
                <Save className="mr-2 size-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value={form?.currency || ''} onChange={event => update('currency', event.target.value)} placeholder="Toman" />
            </div>
            <div className="space-y-2">
              <Label>Base Plan Price</Label>
              <Input type="number" value={form?.basePlanPrice || 0} onChange={event => update('basePlanPrice', Number(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Renewal Discount %</Label>
              <Input type="number" step="0.1" value={form?.renewalDiscountPct || 0} onChange={event => update('renewalDiscountPct', Number(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Tax %</Label>
              <Input type="number" step="0.1" value={form?.taxPct || 0} onChange={event => update('taxPct', Number(event.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Commission %</Label>
              <Input type="number" step="0.1" value={form?.commissionPct || 0} onChange={event => update('commissionPct', Number(event.target.value))} />
            </div>
            <div className="space-y-2 lg:row-span-2">
              <Label>Variables</Label>
              <Textarea className="min-h-36 font-mono text-sm" value={variablesText} onChange={event => setVariablesText(event.target.value)} placeholder={'support_fee=250000\ngateway_fee=1.2%'} />
              <p className="text-muted-foreground text-xs">Use one key=value pair per line.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
