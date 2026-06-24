import PageHeader from '@/components/layout/page-header'
import PageTransition from '@/components/layout/page-transition'
import { cn } from '@/lib/utils'
import { Palette, Settings as SettingsIcon, type LucideIcon } from 'lucide-react'
import { Outlet, useLocation, useNavigate } from 'react-router'

interface Tab {
  id: string
  label: string
  icon: LucideIcon
  url: string
  description: string
}

const tabs: Tab[] = [
  { id: 'general', label: 'General', icon: SettingsIcon, url: '/setting/general', description: 'Panel identity and owner access controls.' },
  { id: 'theme', label: 'Theme', icon: Palette, url: '/setting/theme', description: 'PasarGuard-style appearance, color, radius and preview controls.' },
]

export default function Settings() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = tabs.find(tab => location.pathname === tab.url)?.id || 'general'
  const active = tabs.find(tab => tab.id === activeTab) || tabs[0]

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-start gap-0">
      <PageTransition isContentTransition={true}>
        <PageHeader title="Setting" description={active.description} />
      </PageTransition>
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="border-border/80 bg-background/70 sticky top-0 z-20 flex border-b px-4 backdrop-blur-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.url)}
              className={cn(
                'relative px-3 py-2.5 text-sm font-medium transition-all duration-300',
                activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <div className="flex items-center gap-1.5">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </div>
              <span
                className={cn(
                  'bg-primary absolute inset-x-2 bottom-0 h-0.5 origin-center rounded-full transition-all duration-300',
                  activeTab === tab.id ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0',
                )}
              />
            </button>
          ))}
        </div>
        <PageTransition isContentTransition={true} className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </PageTransition>
      </div>
    </div>
  )
}
