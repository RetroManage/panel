import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { type AdminDetails, logoutAdmin } from '@/service/api'
import { ChevronsUpDown, LogOut, UserCircle, UserRoundKey } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { removeAuthToken } from '@/utils/authStorage'
import { queryClient } from '@/utils/query-client'

export function NavUser({
  username,
  admin,
}: {
  username: {
    name: string
  }
  admin: AdminDetails | null
}) {
  const navigate = useNavigate()

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    await logoutAdmin().catch(() => undefined)
    queryClient.cancelQueries()
    removeAuthToken()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground pl-3">
              <UserCircle className="text-primary size-5" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{username.name}</span>
                  <Badge variant="secondary" className="h-4 px-1 py-0 text-[10px]">
                    <UserRoundKey className="mr-1 size-3" />
                    Owner
                  </Badge>
                </div>
                <span className="text-muted-foreground truncate text-xs">RetroPanel account</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex flex-col gap-2 px-1 py-1.5 text-left text-sm">
                <span className="truncate font-semibold">{username.name}</span>
                <span className="text-muted-foreground text-xs">{admin?.displayName || admin?.display_name || 'Accounting administrator'}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
