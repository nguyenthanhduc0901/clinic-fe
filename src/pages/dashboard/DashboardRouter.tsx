import { useAuthStore } from '@/lib/auth/authStore'
import DashboardAdminPage from '@/pages/dashboard/DashboardAdminPage'
import DashboardReceptionistPage from '@/pages/dashboard/DashboardReceptionistPage'
import ForbiddenPage from '@/pages/errors/ForbiddenPage'

export default function DashboardRouter() {
  const { permissions, user } = useAuthStore()
  const perms = permissions.length ? permissions : (user?.role?.permissions?.map((p: any) => p.name) ?? [])
  if (perms.includes('permission:manage')) return <DashboardAdminPage />
  if (perms.includes('appointment:read')) return <DashboardReceptionistPage />
  return <ForbiddenPage />
}


