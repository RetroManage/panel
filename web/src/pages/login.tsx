import { Footer } from '@/components/layout/footer'
import { Language } from '@/components/common/language'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { loginAdmin } from '@/service/api'
import { removeAuthToken, setAuthToken } from '@/utils/authStorage'
import { CircleAlertIcon, LogInIcon } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

const logoSrc = '/statics/favicon/logo.png'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    removeAuthToken()
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
    <div className="flex min-h-screen w-full flex-col justify-between overflow-hidden bg-background p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.10),transparent_32%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.08),transparent_34%)]" />
      <div className="relative z-10 w-full">
        <div className="flex w-full items-center justify-between">
          <Language />
          <ThemeToggle />
        </div>
        <div className="flex w-full items-center justify-center">
          <div className="mt-6 w-full max-w-[340px]">
            <div className="flex flex-col items-center gap-2">
              <img src={logoSrc} alt="RetroPanel Logo" className="h-20 w-20 rounded-3xl object-contain shadow-xl shadow-primary/10" />
              <span className="text-2xl font-semibold">Login to RetroPanel</span>
              <span className="text-center text-gray-600 dark:text-gray-400">Welcome back. Use your administrator credentials to continue.</span>
            </div>

            <div className="mx-auto w-full max-w-[300px] pt-4">
              <form onSubmit={submit} autoComplete="on" className="rounded-[1.75rem] border border-border/70 bg-card/65 p-4 shadow-2xl shadow-primary/5 backdrop-blur-xl">
                <div className="flex flex-col gap-y-2">
                  <Input className="rounded-xl py-5" placeholder="Username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} />
                  <PasswordInput
                    className="rounded-xl py-5"
                    placeholder="Password"
                    allowBrowserSave
                    autoComplete="current-password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                  />
                  {error && (
                    <Alert className="mt-2 rounded-2xl" variant="destructive">
                      <CircleAlertIcon size="18px" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="mt-2 flex w-full items-center gap-2 rounded-xl" disabled={loading}>
                    <LogInIcon size="18px" />
                    <span>{loading ? 'Signing in...' : 'Login'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
