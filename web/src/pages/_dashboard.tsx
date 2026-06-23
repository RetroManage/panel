import { Footer } from '@/components/layout/footer'
import { AppSidebar } from '@/components/layout/sidebar'
import PageTransition from '@/components/layout/page-transition'
import { TopLoadingBar } from '@/components/layout/top-loading-bar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Outlet } from 'react-router'

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <TopLoadingBar />
      <div className="flex w-full flex-col lg:flex-row">
        <AppSidebar />
        <SidebarInset className="scroll-sm h-screen flex-1 overflow-x-hidden overflow-y-auto">
          <div className="flex min-h-full flex-col">
            <div className="flex-1">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
            <Footer />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
