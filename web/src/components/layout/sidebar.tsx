import { ThemeToggle } from '@/components/common/theme-toggle'
import { NavMain } from '@/components/layout/nav-main'
import { NavUser } from '@/components/layout/nav-user'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { BarChart3, Bot, ChevronsLeft, ChevronsRight, LayoutDashboardIcon, Settings2, Trophy } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router'
import { useAdmin } from '@/hooks/use-admin'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, isMobile, toggleSidebar } = useSidebar()
  const { admin } = useAdmin()

  const data = {
    user: {
      name: admin?.username || 'Admin',
    },
    navMain: [
      {
        title: 'Dashboard',
        url: '/',
        icon: LayoutDashboardIcon,
      },
      {
        title: 'Sales Status',
        url: '/sales-status',
        icon: BarChart3,
      },
      {
        title: 'Admin Leaderboard',
        url: '/admin-leaderboard',
        icon: Trophy,
      },
      {
        title: 'Price & Variable Settings',
        url: '/pricing-settings',
        icon: Settings2,
      },
      {
        title: 'Panel & Telegram Bot Settings',
        url: '/panel-telegram-settings',
        icon: Bot,
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" side="left" className="border-sidebar-border bg-sidebar text-sidebar-foreground border-r" {...props}>
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            'bg-sidebar border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3 -right-3 z-50 hidden h-6 w-6 rounded-full border shadow-md transition-all duration-200 lg:flex',
            state === 'collapsed' && '-right-3',
          )}
        >
          {state === 'collapsed' ? <ChevronsRight className="h-3 w-3" /> : <ChevronsLeft className="h-3 w-3" />}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      )}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LayoutDashboardIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">RetroPanel</span>
                  <span className="truncate text-xs">Accounting Control Center</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-muted-foreground text-xs group-data-[collapsible=icon]:hidden">Appearance</span>
          <ThemeToggle />
        </div>
        <NavUser username={data.user} admin={admin} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
