import { useTheme, colorThemes, type ColorTheme, type Radius, type Theme } from '@/app/providers/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { BarChart3, CheckCircle2, Eye, Monitor, Moon, Palette, RotateCcw, Ruler, Sparkles, Sun, SunMoon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const colorThemeData = [
  { name: 'default', label: 'Default', dot: '#2563eb' },
  { name: 'red', label: 'Red', dot: '#ef4444' },
  { name: 'rose', label: 'Rose', dot: '#e11d48' },
  { name: 'orange', label: 'Orange', dot: '#f97316' },
  { name: 'green', label: 'Green', dot: '#22c55e' },
  { name: 'blue', label: 'Blue', dot: '#3b82f6' },
  { name: 'yellow', label: 'Yellow', dot: '#eab308' },
  { name: 'violet', label: 'Violet', dot: '#8b5cf6' },
] as const

const radiusOptions = [
  { value: '0', label: 'None', description: '0px' },
  { value: '0.3rem', label: 'Small', description: '0.3rem' },
  { value: '0.5rem', label: 'Medium', description: '0.5rem' },
  { value: '0.75rem', label: 'Large', description: '0.75rem' },
] as const

const modeOptions = [
  { value: 'light' as Theme, label: 'Light', icon: Sun, description: 'Clean bright interface.' },
  { value: 'dark' as Theme, label: 'Dark', icon: Moon, description: 'PasarGuard dark control style.' },
  { value: 'system' as Theme, label: 'System', icon: Monitor, description: 'Follow operating system.' },
]

export default function ThemeSettings() {
  const { theme, colorTheme, radius, resolvedTheme, setTheme, setColorTheme, setRadius, resetToDefaults, isSystemTheme } = useTheme()
  const [densePreview, setDensePreview] = useState(true)
  const [isResetting, setIsResetting] = useState(false)

  const handleThemeChange = (nextTheme: Theme) => {
    setTheme(nextTheme)
    toast.success('Theme mode changed')
  }

  const handleColorChange = (nextColor: string) => {
    if (Object.keys(colorThemes).includes(nextColor)) {
      setColorTheme(nextColor as ColorTheme)
      toast.success('Theme color saved')
    }
  }

  const handleRadiusChange = (nextRadius: string) => {
    setRadius(nextRadius as Radius)
    toast.success('Radius saved')
  }

  const handleReset = () => {
    setIsResetting(true)
    resetToDefaults()
    window.setTimeout(() => setIsResetting(false), 300)
    toast.success('Theme reset to PasarGuard defaults')
  }

  return (
    <div className="w-full space-y-5 px-4 py-5 pb-12">
      <Card className="relative overflow-hidden border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
        <div className="from-primary/15 pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent" />
        <CardHeader className="relative">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><SunMoon className="text-primary size-5" /> Theme</CardTitle>
              <CardDescription>PasarGuard-style appearance controls for mode, accent color, border radius and live preview.</CardDescription>
            </div>
            <Badge variant="blue">{isSystemTheme ? `System · ${resolvedTheme}` : theme}</Badge>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-8">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <SunMoon className="text-primary size-4" />
              <h3 className="font-semibold">Mode</h3>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {modeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value)}
                  type="button"
                  className={cn(
                    'group flex items-start justify-between gap-3 rounded-xl border bg-background/70 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10',
                    theme === option.value && 'border-primary bg-primary/5 shadow-sm shadow-primary/10',
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-medium"><option.icon className="text-primary size-4" /> {option.label}</div>
                    <p className="text-muted-foreground text-xs leading-relaxed">{option.description}</p>
                  </div>
                  {theme === option.value && <CheckCircle2 className="text-primary size-4" />}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="text-primary size-4" />
              <h3 className="font-semibold">Color</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {colorThemeData.map(color => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => handleColorChange(color.name)}
                  className={cn(
                    'group flex items-center justify-between gap-3 rounded-xl border bg-background/70 px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10',
                    colorTheme === color.name && 'border-primary bg-primary/5',
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="h-3 w-3 rounded-full ring-2 ring-background" style={{ backgroundColor: color.dot }} />
                    {color.label}
                  </span>
                  {colorTheme === color.name && <CheckCircle2 className="text-primary size-4" />}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Ruler className="text-primary size-4" />
              <h3 className="font-semibold">Radius</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {radiusOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRadiusChange(option.value)}
                  className={cn(
                    'rounded-xl border bg-background/70 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10',
                    radius === option.value && 'border-primary bg-primary/5',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{option.label}</span>
                    {radius === option.value && <CheckCircle2 className="text-primary size-4" />}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">{option.description}</p>
                </button>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="text-primary size-5" /> Live Preview</CardTitle>
            <CardDescription>Immediate preview of cards, buttons, charts and density.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-muted/25 p-4" style={{ borderRadius: radius }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Dashboard Preview</p>
                  <p className="text-muted-foreground text-xs">{colorThemeData.find(c => c.name === colorTheme)?.label} · {resolvedTheme} · radius {radius}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <span className="h-2.5 w-2.5 rounded-full bg-border" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                </div>
              </div>
              <div className={cn('mt-4 grid gap-3', densePreview ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
                {[0, 1, 2].map(item => (
                  <div key={item} className="rounded-xl border bg-background/75 p-3 shadow-sm" style={{ borderRadius: radius }}>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">Metric</span>
                      <Sparkles className="text-primary size-4" />
                    </div>
                    <div className="h-6 w-24 rounded bg-primary/80" style={{ borderRadius: radius }} />
                    <div className="mt-3 h-2 rounded bg-muted" style={{ borderRadius: radius }} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex h-32 items-end gap-2 rounded-xl border bg-background/60 p-3" style={{ borderRadius: radius }}>
                {[45, 66, 38, 80, 58, 92].map((height, index) => (
                  <div key={index} className="flex flex-1 items-end rounded bg-muted/40 p-1" style={{ borderRadius: radius }}>
                    <div className="w-full rounded bg-primary transition-all duration-500" style={{ height: `${height}%`, borderRadius: radius }} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-card/90 shadow-sm shadow-primary/5 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary size-5" /> Panel Preferences</CardTitle>
            <CardDescription>Extra local UI preferences for this panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border bg-muted/25 p-4">
              <div className="space-y-1">
                <Label>Dense preview</Label>
                <p className="text-muted-foreground text-xs">Use compact PasarGuard-style information density.</p>
              </div>
              <Switch checked={densePreview} onCheckedChange={setDensePreview} />
            </div>
            <div className="rounded-xl border bg-muted/25 p-4">
              <p className="text-sm font-medium">Current configuration</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Mode</span><span>{theme}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Resolved</span><span>{resolvedTheme}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Color</span><span>{colorTheme}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Radius</span><span>{radius}</span></div>
              </div>
            </div>
            <Button variant="outline" onClick={handleReset} disabled={isResetting} className="w-full">
              <RotateCcw className="size-4" />
              {isResetting ? 'Resetting...' : 'Reset to PasarGuard defaults'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
