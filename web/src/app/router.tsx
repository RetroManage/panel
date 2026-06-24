import { Suspense } from 'react'
import { getCurrentAdmin } from '@/service/api'
import { createHashRouter, Navigate } from 'react-router'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { lazyWithChunkRecovery } from '@/utils/chunk-recovery'

const DashboardLayout = lazyWithChunkRecovery(() => import('../pages/_dashboard'))
const Dashboard = lazyWithChunkRecovery(() => import('../pages/_dashboard._index'))
const Users = lazyWithChunkRecovery(() => import('../pages/_dashboard.users'))
const Statistics = lazyWithChunkRecovery(() => import('../pages/_dashboard.statistics'))
const Products = lazyWithChunkRecovery(() => import('../pages/_dashboard.products'))
const BotSetting = lazyWithChunkRecovery(() => import('../pages/_dashboard.bot-setting'))
const Setting = lazyWithChunkRecovery(() => import('../pages/_dashboard.settings'))
const SettingGeneral = lazyWithChunkRecovery(() => import('../pages/_dashboard.settings.general'))
const SettingTheme = lazyWithChunkRecovery(() => import('../pages/_dashboard.settings.theme'))
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
        path: '/users',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Users />
          </Suspense>
        ),
      },
      {
        path: '/statistics',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Statistics />
          </Suspense>
        ),
      },
      {
        path: '/products',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Products />
          </Suspense>
        ),
      },
      {
        path: '/bot-setting',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <BotSetting />
          </Suspense>
        ),
      },
      {
        path: '/setting',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Setting />
          </Suspense>
        ),
        children: [
          { index: true, element: <Navigate to="/setting/general" replace /> },
          {
            path: 'general',
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <SettingGeneral />
              </Suspense>
            ),
          },
          {
            path: 'theme',
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <SettingTheme />
              </Suspense>
            ),
          },
        ],
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
