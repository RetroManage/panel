import { Footer } from '@/components/layout/footer'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { loginAdmin } from '@/service/api'
import { setAuthToken } from '@/utils/authStorage'
import { CircleAlertIcon, LogInIcon, ShieldCheck } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setAuthToken('')
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await loginAdmin({ username, password })
      setAuthToken(response.access_token)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background relative flex min-h-screen flex-col overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_35%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.12),transparent_35%)]" />
      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl shadow">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">RetroPanel</h1>
                <p className="text-muted-foreground text-sm">Accounting control center</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <Card className="border-border/70 bg-card/95 shadow-2xl backdrop-blur">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Use your administrator credentials to access the accounting panel.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submit}>
                {error && (
                  <Alert variant="destructive">
                    <CircleAlertIcon className="size-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput id="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <LogInIcon className="mr-2 size-4" />
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  )
}
