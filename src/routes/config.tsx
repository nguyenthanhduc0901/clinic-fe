import type { ReactNode } from 'react'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import PatientsPage from '@/pages/patients/PatientsPage'
import AppointmentsContainer from '@/pages/appointments/AppointmentsContainer'
import MedicalRecordsPage from '@/pages/medical-records/MedicalRecordsPage'
import MedicinesPage from '@/pages/medicines/MedicinesPage'
import SuppliersPage from '@/pages/inventory/SuppliersPage'
import ImportsPage from '@/pages/inventory/ImportsPage'
import InvoicesPage from '@/pages/invoices/InvoicesPage'
import ReportsPage from '@/pages/reports/ReportsPage'
import CatalogsPage from '@/pages/catalogs/CatalogsPage'
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
  { path: '/medical-records', element: <MedicalRecordsPage />, requiredPermissions: ['medical_record:read'] },
  { path: '/medicines', element: <MedicinesPage />, requiredPermissions: ['medicine:read'] },
  { path: '/inventory/suppliers', element: <SuppliersPage />, requiredPermissions: ['permission:manage'] },
  { path: '/inventory/imports', element: <ImportsPage />, requiredPermissions: ['medicine:import'] },
  { path: '/invoices', element: <InvoicesPage />, requiredPermissions: ['invoice:read'] },
  { path: '/reports', element: <ReportsPage />, requiredPermissions: ['report:view'] },
  { path: '/catalogs', element: <CatalogsPage />, requiredPermissions: ['catalog:read'] },
  { path: '/settings', element: <SettingsPage />, requiredPermissions: ['setting:manage'] },
  { path: '/users', element: <UsersPage />, requiredPermissions: ['user:read'] },
  { path: '/staff', element: <StaffPage />, requiredPermissions: ['staff:read'] },
  { path: '/roles', element: <RolesPage />, requiredPermissions: ['permission:manage'] },
  { path: '/audit-logs', element: <AuditLogsPage />, requiredPermissions: ['audit_log:view'] },
  { path: '/profile', element: <ProfilePage /> },
]


