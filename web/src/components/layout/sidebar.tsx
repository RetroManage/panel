import { ThemeToggle } from '@/components/common/theme-toggle'
import { NavMain } from '@/components/layout/nav-main'
import { NavUser } from '@/components/layout/nav-user'
import { Button } from '@/components/ui/button'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Activity, Bot, ChevronsLeft, ChevronsRight, Keyboard, LayoutDashboardIcon, MessageSquareText, Package, Palette, Power, ServerCog, Settings2, ShieldCheck, SlidersHorizontal, ToggleLeft, UsersIcon } from 'lucide-react'
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
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            'bg-sidebar/95 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3 -right-3 z-50 hidden h-6 w-6 rounded-full border shadow-sm backdrop-blur transition-all duration-200 lg:flex',
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
            <SidebarMenuButton size="lg" asChild className="transition-all duration-200 hover:bg-sidebar-accent/55">
              <Link to="/" className="flex items-center gap-2">
                <div className="from-sidebar-primary/90 via-primary/80 to-primary/60 text-sidebar-primary-foreground ring-primary/15 flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm ring-1 transition-transform duration-200 hover:scale-[1.03]">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">RetroPanel</span>
                  <span className="text-muted-foreground truncate text-xs">Sales Bot Control</span>
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
    </Sidebar>
  )
}
