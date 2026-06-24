import { ChevronRight, type LucideIcon } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { NavLink, useLocation } from 'react-router'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon: LucideIcon
      matchPrefix?: boolean
    }[]
  }[]
}) {
  const location = useLocation()
  const { setOpenMobile } = useSidebar()

  const handleNavigation = () => {
    setOpenMobile(false)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>PasarGuard</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => (
          <Collapsible key={item.title} defaultOpen={item.isActive || location.pathname.startsWith(item.url)}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <NavLink to={item.url} onClick={handleNavigation} end={item.url === '/'}>
                  {({ isActive }) => (
                    <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </CollapsibleTrigger>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="rtl: data-[state=open]:rotate-90 data-[state=open]:rtl:-rotate-90">
                      <ChevronRight className="rtl:rotate-180" />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map(subItem => {
                        const base = subItem.url.replace(/\/$/, '')
                        const subActive = location.pathname === subItem.url || (subItem.matchPrefix && (location.pathname === base || location.pathname.startsWith(`${base}/`)))
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild className="flex h-8 items-center gap-2" isActive={subActive}>
                              <NavLink to={subItem.url} end={!subItem.matchPrefix} onClick={handleNavigation}>
                                <subItem.icon />
                                <span>{subItem.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
