import AppointmentFilters, { type Filters } from '@/pages/appointments/components/AppointmentFilters'
import AppointmentTable, { type AppointmentRow } from '@/pages/appointments/components/AppointmentTable'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Pagination from '@/components/ui/Pagination'
import { api } from '@/lib/api/axios'
import AssignDoctorModal from '@/pages/appointments/components/AssignDoctorModal'
import RescheduleModal from '@/pages/appointments/components/RescheduleModal'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'
import { assignDoctor, updateAppointmentStatus, rescheduleAppointment, deleteAppointment } from '@/lib/api/appointments'
import AppointmentDetailDrawer from '@/pages/appointments/components/AppointmentDetailDrawer'
import CreateAppointmentModal from '@/pages/appointments/components/CreateAppointmentModal'
import CreateMedicalRecordModal from '@/pages/medical-records/components/CreateMedicalRecordModal'
import { toast } from '@/components/ui/Toast'

export default function AdminView() {
  const today = new Date().toISOString().slice(0, 10)
  const [filters, setFilters] = useState<Filters>({ date: today, q: '', page: 1, limit: 10 })
  const { data, isLoading, isError } = useQuery<{ items: AppointmentRow[]; total: number }>({
    queryKey: ['appointments-admin', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.date) params.set('date', filters.date)
      if (filters.q) params.set('q', filters.q)
      if (filters.status) params.set('status', filters.status)
      params.set('page', String(filters.page))
      params.set('limit', String(filters.limit))
      const res = await api.get(`/appointments?${params.toString()}`)
      const body = res.data as { data: any[]; total: number }
      const items: AppointmentRow[] = (body.data || []).map((a: any) => ({
        id: String(a.id),
        orderNumber: a.orderNumber,
        patient: { fullName: a.patient?.fullName, phone: a.patient?.phone },
        staff: { fullName: a.staff?.fullName },
        status: a.status,
        note: a.notes ?? undefined,
        date: a.appointmentDate,
      }))
      return { items, total: body.total ?? 0 }
    },
  })

  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / (filters.limit || 10)))

  const { permissions, user } = useAuthStore()
  const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
  const canAssign = can(perms, ['appointment:update']) && can(perms, ['staff:read'])
  const canUpdate = can(perms, ['appointment:update'])
  const canCreateMr = can(perms, ['medical_record:create'])

  const qc = useQueryClient()
  const [assignState, setAssignState] = useState<{ id: number | null }>({ id: null })
  const assignMutation = useMutation({
    mutationFn: ({ id, staffId }: { id: number; staffId: number | null }) => assignDoctor(id, staffId),
    onSuccess: (_, variables) => {
      toast.success(variables.staffId ? 'Gán bác sĩ thành công' : 'Bỏ gán bác sĩ thành công')
      qc.invalidateQueries({ queryKey: ['appointments-admin'] })
      setAssignState({ id: null })
    },
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateAppointmentStatus(id, status as any),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công')
      qc.invalidateQueries({ queryKey: ['appointments-admin'] })
    },
  })
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) => rescheduleAppointment(id, date),
    onSuccess: () => {
      toast.success('Dời lịch thành công')
      qc.invalidateQueries({ queryKey: ['appointments-admin'] })
      setReschedule({ id: null })
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) toast.error('Khung giờ đã được đặt bởi thao tác khác. Vui lòng chọn giờ khác.')
    },
  })
  const [reschedule, setReschedule] = useState<{ id: number | null }>({ id: null })
  const [createMr, setCreateMr] = useState<{ appointmentId: number | null }>({ appointmentId: null })
  const [detailId, setDetailId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const delMut = useMutation({
    mutationFn: (id: number) => deleteAppointment(id),
    onSuccess: () => { toast.success('Đã xoá lịch hẹn'); qc.invalidateQueries({ queryKey: ['appointments-admin'] }) },
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Xoá thất bại')
  })

  return (
    <div className="space-y-3">
      <h1 className="page-title">Appointments - Admin</h1>
      <div className="card">
        <AppointmentFilters value={filters} onChange={setFilters} />
      </div>
      <div className="card">
        {isLoading && <div>Loading...</div>}
        {isError && <div className="text-danger">Failed to load</div>}
        {!isLoading && !isError && (
          <AppointmentTable
            rows={data?.items ?? []}
            onChangeStatus={canUpdate ? (id, status) => statusMutation.mutate({ id: Number(id), status }) : undefined}
            onOpenReschedule={canUpdate ? (id) => setReschedule({ id: Number(id) }) : undefined}
            onOpenAssignDoctor={canAssign ? (id) => setAssignState({ id: Number(id) }) : undefined}
            onCreateMedicalRecord={canCreateMr ? (id) => setCreateMr({ appointmentId: Number(id) }) : undefined}
            onOpenDetail={(id) => setDetailId(Number(id))}
            onDelete={(can(perms, ['appointment:delete']) || can(perms, ['appointment:view_own'])) ? (id) => { if (confirm('Xoá lịch hẹn này?')) delMut.mutate(Number(id)) } : undefined}
          />
        )}
        <div className="mt-3">
          <Pagination page={filters.page} pageCount={pageCount} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      </div>
      <AssignDoctorModal
        open={!!assignState.id}
        onClose={() => setAssignState({ id: null })}
        canReadStaff={can(perms, ['staff:read'])}
        loading={assignMutation.isPending}
        onAssign={(staffId) => assignState.id && assignMutation.mutate({ id: assignState.id, staffId })}
      />
      <RescheduleModal
        open={!!reschedule.id}
        onClose={() => setReschedule({ id: null })}
        onSubmit={(date) => reschedule.id && rescheduleMutation.mutate({ id: reschedule.id, date })}
      />
      {canCreateMr && (
        <CreateMedicalRecordModal
          open={!!createMr.appointmentId}
          appointmentId={createMr.appointmentId}
          onClose={() => setCreateMr({ appointmentId: null })}
        />
      )}
      <AppointmentDetailDrawer id={detailId} onClose={()=> setDetailId(null)} />
      {can(perms, ['appointment:create']) && (
        <CreateAppointmentModal open={createOpen} onClose={()=> setCreateOpen(false)} onCreated={()=> qc.invalidateQueries({ queryKey: ['appointments-admin'] })} />
      )}
    </div>
  )
}



