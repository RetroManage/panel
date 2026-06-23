import { Suspense } from 'react'
import { getCurrentAdmin } from '@/service/api'
import { createHashRouter, Navigate } from 'react-router'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { lazyWithChunkRecovery } from '@/utils/chunk-recovery'

const DashboardLayout = lazyWithChunkRecovery(() => import('../pages/_dashboard'))
const Dashboard = lazyWithChunkRecovery(() => import('../pages/_dashboard._index'))
const SalesStatus = lazyWithChunkRecovery(() => import('../pages/_dashboard.sales-status'))
const AdminLeaderboard = lazyWithChunkRecovery(() => import('../pages/_dashboard.admin-leaderboard'))
const PricingSettings = lazyWithChunkRecovery(() => import('../pages/_dashboard.pricing-settings'))
const PanelTelegramSettings = lazyWithChunkRecovery(() => import('../pages/_dashboard.panel-telegram-settings'))
const Login = lazyWithChunkRecovery(() => import('../pages/login'))

const fetchAdminLoader = async () => {
  try {
    return await getCurrentAdmin()
  } catch {
    throw Response.redirect('/login')
  }
}

export const router = createHashRouter([
  {
    hydrateFallbackElement: <LoadingSpinner />,
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <DashboardLayout />
      </Suspense>
    ),
    errorElement: (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    ),
    loader: fetchAdminLoader,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: '/sales-status',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <SalesStatus />
          </Suspense>
        ),
      },
      {
        path: '/admin-leaderboard',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <AdminLeaderboard />
          </Suspense>
        ),
      },
      {
        path: '/pricing-settings',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <PricingSettings />
          </Suspense>
        ),
      },
      {
        path: '/panel-telegram-settings',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <PanelTelegramSettings />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    ),
  },
])
