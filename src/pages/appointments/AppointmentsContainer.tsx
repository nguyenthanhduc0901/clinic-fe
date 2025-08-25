import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'
import AdminView from '@/pages/appointments/variants/AdminView'
import ReceptionistView from '@/pages/appointments/variants/ReceptionistView'

export default function AppointmentsContainer() {
  const { user, permissions } = useAuthStore()
  const perms = permissions.length ? permissions : user?.role?.permissions?.map((p) => p.name) ?? []

  if (can(perms, ['permission:manage'])) return <AdminView />
  if (can(perms, ['appointment:read'])) return <ReceptionistView />
  return <div className="card">Bạn không có quyền xem lịch hẹn.</div>
}



