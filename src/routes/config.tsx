import type { ReactNode } from 'react'
import DashboardPage from '@/pages/dashboard/DashboardRouter'
import PatientsPage from '@/pages/patients/PatientsPage'
import AppointmentsContainer from '@/pages/appointments/AppointmentsContainer'
import { lazy, Suspense } from 'react'
const MedicalRecordsPage = lazy(() => import('@/pages/medical-records/MedicalRecordsPage'))
const MedicinesPage = lazy(() => import('@/pages/medicines/MedicinesPage'))
const SuppliersPage = lazy(() => import('@/pages/inventory/SuppliersPage'))
const ImportsPage = lazy(() => import('@/pages/inventory/ImportsPage'))
const LowStockPage = lazy(() => import('@/pages/inventory/LowStockPage'))
const InvoicesPage = lazy(() => import('@/pages/invoices/InvoicesPage'))
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'))
// Removed read-only Catalogs route from nav; keep admin catalogs
import AdminCatalogsPage from '@/pages/catalogs/AdminCatalogsPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import UsersPage from '@/pages/users/UsersPage'
import StaffPage from '@/pages/staff/StaffPage'
import RolesPage from '@/pages/roles/RolesPage'
import AuditLogsPage from '@/pages/audit/AuditLogsPage'
import ProfilePage from '@/pages/profile/ProfilePage'

export type AppRoute = {
  path: string
  element: ReactNode
  requiredPermissions?: string[]
}

export const appRoutes: AppRoute[] = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/patients', element: <PatientsPage />, requiredPermissions: ['patient:read'] },
  { path: '/appointments', element: <AppointmentsContainer />, requiredPermissions: ['appointment:read'] },
  { path: '/medical-records', element: <Suspense fallback={<div className="p-4">Đang tải...</div>}><MedicalRecordsPage /></Suspense>, requiredPermissions: ['medical_record:read'] },
  { path: '/medicines', element: <Suspense fallback={<div className="p-4">Đang tải...</div>}><MedicinesPage /></Suspense>, requiredPermissions: ['medicine:read'] },
  { path: '/inventory/suppliers', element: <Suspense fallback={<div className="p-4">Đang tải...</div>}><SuppliersPage /></Suspense>, requiredPermissions: ['permission:manage'] },
  { path: '/inventory/imports', element: <Suspense fallback={<div className="p-4">Đang tải...</div>}><ImportsPage /></Suspense>, requiredPermissions: ['medicine:import'] },
  { path: '/inventory/low-stock', element: <Suspense fallback={<div className="p-4">Đang tải...</div>}><LowStockPage /></Suspense>, requiredPermissions: ['medicine:read'] },
  { path: '/invoices', element: <Suspense fallback={<div className="p-4">Đang tải...</div>}><InvoicesPage /></Suspense>, requiredPermissions: ['invoice:read'] },
  { path: '/reports', element: <Suspense fallback={<div className="p-4">Đang tải...</div>}><ReportsPage /></Suspense>, requiredPermissions: ['report:view'] },
  { path: '/catalogs', element: <AdminCatalogsPage />, requiredPermissions: ['permission:manage'] },
  { path: '/settings', element: <SettingsPage />, requiredPermissions: ['setting:manage'] },
  { path: '/users', element: <UsersPage />, requiredPermissions: ['user:read'] },
  { path: '/staff', element: <StaffPage />, requiredPermissions: ['staff:read'] },
  { path: '/roles', element: <RolesPage />, requiredPermissions: ['permission:manage'] },
  { path: '/audit-logs', element: <AuditLogsPage />, requiredPermissions: ['audit_log:view'] },
  { path: '/profile', element: <ProfilePage /> },
]


