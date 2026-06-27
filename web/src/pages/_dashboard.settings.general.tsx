import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAdmin } from '@/hooks/use-admin'
import { useGeneralSettings, useSaveGeneralSettings } from '@/service/api'
import { useQueryClient } from '@tanstack/react-query'
import { KeyRound, Loader2, Save, ShieldCheck, UserCog } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function GeneralSettings() {
  const { admin } = useAdmin()
  const queryClient = useQueryClient()
  const { data, isLoading } = useGeneralSettings()
  const saveGeneral = useSaveGeneralSettings()
  const [username, setUsername] = useState(admin?.username || 'admin')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!data) return
    setUsername(data.adminUsername || admin?.username || 'admin')
  }, [admin?.username, data])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    await saveGeneral.mutateAsync({
      panelName: data?.panelName || 'RetroPanel',
      publicBaseUrl: data?.publicBaseUrl || '',
      adminUsername: username,
      adminPassword: password || undefined,
    })
    setPassword('')
    setConfirmPassword('')
    queryClient.invalidateQueries({ queryKey: ['current-admin'] })
    queryClient.invalidateQueries({ queryKey: ['general-settings'] })
    toast.success('General settings saved')
  }

  return (
    <div className="w-full space-y-4 px-4 py-5 pb-12">
      <Card className="mx-auto max-w-4xl border-primary/10 bg-card/90 shadow-sm backdrop-blur">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary size-5" /> General</CardTitle>
              <CardDescription>Owner access credentials for this control panel.</CardDescription>
            </div>
            <Badge variant="green">Secure</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2"><UserCog className="size-4 text-primary" /> Username</Label>
                <Input id="username" value={username} onChange={event => setUsername(event.target.value)} disabled={isLoading || saveGeneral.isPending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2"><KeyRound className="size-4 text-primary" /> New password</Label>
                <Input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Leave empty to keep current" disabled={isLoading || saveGeneral.isPending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Repeat new password" disabled={isLoading || saveGeneral.isPending} />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || saveGeneral.isPending}>
                {saveGeneral.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
