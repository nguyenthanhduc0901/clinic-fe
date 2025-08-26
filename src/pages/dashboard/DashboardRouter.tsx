import { useAuthStore } from '@/lib/auth/authStore'
import DashboardAdminPage from '@/pages/dashboard/DashboardAdminPage'
import DashboardReceptionistPage from '@/pages/dashboard/DashboardReceptionistPage'
import DashboardDoctorPage from '@/pages/dashboard/DashboardDoctorPage'

export default function DashboardRouter() {
  const { permissions, user } = useAuthStore()
  const perms = (permissions.length ? permissions : (user?.role?.permissions?.map((p: any) => p.name) ?? [])) as string[]
  const has = (p: string) => perms.includes(p)
  const hasPrefix = (prefix: string) => perms.some((x) => x.startsWith(prefix))
  if (has('permission:manage')) return <DashboardAdminPage />
  if (hasPrefix('medical_record:') || has('medical_record:read')) return <DashboardDoctorPage />
  if (hasPrefix('appointment:') || has('appointment:read')) return <DashboardReceptionistPage />
  // Lenient fallback to receptionist dashboard to avoid 403 if perms are delayed
  return <DashboardReceptionistPage />
}


