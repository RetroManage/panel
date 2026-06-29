import { ThemeToggle } from '@/components/common/theme-toggle'
import { NavMain } from '@/components/layout/nav-main'
import { NavUser } from '@/components/layout/nav-user'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Activity, Bot, ChevronsLeft, ChevronsRight, Keyboard, LayoutDashboardIcon, MessageSquareText, Package, Palette, Power, ServerCog, Settings2, SlidersHorizontal, ToggleLeft, UsersIcon } from 'lucide-react'
import * as React from 'react'
import { Link } from 'react-router'
import { useAdmin } from '@/hooks/use-admin'

const logoSrc = '/statics/favicon/logo.png'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, isMobile, toggleSidebar } = useSidebar()
  const { admin } = useAdmin()
  const [showCollapseButton, setShowCollapseButton] = React.useState(false)

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
        title: 'Users',
        url: '/users',
        icon: UsersIcon,
      },
      {
        title: 'Statistics',
        url: '/statistics',
        icon: Activity,
      },
      {
        title: 'Panels',
        url: '/panels',
        icon: ServerCog,
      },
      {
        title: 'Products',
        url: '/products',
        icon: Package,
      },
      {
        title: 'Bot Setting',
        url: '/bot-setting',
        icon: Bot,
        items: [
          {
            title: 'General',
            url: '/bot-setting/general',
            icon: Power,
          },
          {
            title: 'Texts',
            url: '/bot-setting/texts',
            icon: MessageSquareText,
          },
          {
            title: 'Buttons',
            url: '/bot-setting/buttons',
            icon: Keyboard,
          },
          {
            title: 'Visibility',
            url: '/bot-setting/status',
            icon: ToggleLeft,
          },
        ],
      },
      {
        title: 'Setting',
        url: '/setting',
        icon: Settings2,
        items: [
          {
            title: 'General',
            url: '/setting/general',
            icon: SlidersHorizontal,
          },
          {
            title: 'Theme',
            url: '/setting/theme',
            icon: Palette,
          },
        ],
      },
    ],
  }

  return (
    <Sidebar collapsible="icon" side="left" className="border-sidebar-border bg-sidebar text-sidebar-foreground border-r" {...props}>
      <SidebarRail />
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {state === 'collapsed' && !isMobile ? (
              <div className="group relative" onMouseEnter={() => setShowCollapseButton(true)} onMouseLeave={() => setShowCollapseButton(false)}>
                <SidebarMenuButton
                  size="lg"
                  asChild
                  className={cn('relative w-full justify-center !gap-0 transition-opacity duration-200 ease-in-out', showCollapseButton ? 'pointer-events-none opacity-0' : 'opacity-100')}
                >
                  <Link to="/" aria-label="RetroPanel">
                    <img src={logoSrc} alt="RetroPanel logo" className="h-7 w-7 flex-shrink-0 rounded-lg object-contain" />
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuButton
                  size="lg"
                  className={cn(
                    'hover:bg-sidebar-accent/70 absolute inset-0 w-full cursor-pointer justify-center !gap-0 rounded-full transition-opacity duration-200 ease-in-out',
                    showCollapseButton ? 'opacity-100' : 'pointer-events-none opacity-0',
                  )}
                  onClick={toggleSidebar}
                >
                  <ChevronsRight className="h-5 w-5 flex-shrink-0" />
                  <span className="sr-only">Expand Sidebar</span>
                </SidebarMenuButton>
              </div>
            ) : state !== 'collapsed' && !isMobile ? (
              <div className="relative pr-10">
                <SidebarMenuButton size="lg" asChild className="w-full !gap-2 transition-all duration-200 hover:bg-sidebar-accent/55">
                  <Link to="/" className="flex items-center gap-2">
                    <img src={logoSrc} alt="RetroPanel logo" className="h-8 w-8 flex-shrink-0 rounded-xl object-contain shadow-sm" />
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold tracking-tight">RetroPanel</span>
                      <span className="text-muted-foreground truncate text-xs">Sales Bot Control</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:border-sidebar-border hover:bg-sidebar-accent/70 absolute top-1/2 right-2 z-10 h-8 w-8 shrink-0 -translate-y-1/2 cursor-pointer rounded-full border border-transparent transition-colors"
                  onClick={event => {
                    event.preventDefault()
                    event.stopPropagation()
                    toggleSidebar()
                  }}
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="sr-only">Collapse Sidebar</span>
                </Button>
              </div>
            ) : (
              <SidebarMenuButton size="lg" asChild className="!gap-2 transition-all duration-200 hover:bg-sidebar-accent/55">
                <Link to="/" className="flex items-center gap-2">
                  <img src={logoSrc} alt="RetroPanel logo" className="h-8 w-8 flex-shrink-0 rounded-xl object-contain shadow-sm" />
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold tracking-tight">RetroPanel</span>
                    <span className="text-muted-foreground truncate text-xs">Sales Bot Control</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            )}
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
    </Sidebar>
  )
}
