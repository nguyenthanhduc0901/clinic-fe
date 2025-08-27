import { useState } from 'react'
import AppointmentFilters, { type Filters } from '@/pages/appointments/components/AppointmentFilters'
import AppointmentTable, { type AppointmentRow } from '@/pages/appointments/components/AppointmentTable'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import Pagination from '@/components/ui/Pagination'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAppointmentStatus, rescheduleAppointment, assignDoctor, deleteAppointment } from '@/lib/api/appointments'
import AppointmentDetailDrawer from '@/pages/appointments/components/AppointmentDetailDrawer'
import CreateAppointmentModal from '@/pages/appointments/components/CreateAppointmentModal'
import RescheduleModal from '@/pages/appointments/components/RescheduleModal'
import CreateMedicalRecordModal from '@/pages/medical-records/components/CreateMedicalRecordModal'
import { toast } from '@/components/ui/Toast'
import AssignDoctorModal from '@/pages/appointments/components/AssignDoctorModal'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'

export default function ReceptionistView() {
  const today = new Date().toISOString().slice(0, 10)
  const [filters, setFilters] = useState<Filters>({ date: today, q: '', page: 1, limit: 10 })

  const { data, isLoading, isError } = useQuery<{ items: AppointmentRow[]; total: number }>({
    queryKey: ['appointments', filters],
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

  const qc = useQueryClient()
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateAppointmentStatus(id, status as any),
    onSuccess: () => {
      toast.success('Cập nhật trạng thái thành công')
      qc.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) => rescheduleAppointment(id, date),
    onSuccess: () => {
      toast.success('Dời lịch thành công')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      setReschedule({ id: null })
    },
    onError: (err: any) => {
      if (err?.response?.status === 409) toast.error('Khung giờ đã được đặt bởi thao tác khác. Vui lòng chọn giờ khác.')
    },
  })

  const [reschedule, setReschedule] = useState<{ id: number | null }>({ id: null })
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / (filters.limit || 10)))
  const [createMr, setCreateMr] = useState<{ appointmentId: number | null }>({ appointmentId: null })

  const { permissions, user } = useAuthStore()
  const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
  const showAssign = can(perms, ['appointment:update'])
  const canReadStaff = can(perms, ['staff:read'])
  const isDoctor = (user as any)?.role?.name === 'doctor'
  const canCreateMr = isDoctor && can(perms, ['medical_record:create'])

  const [assignState, setAssignState] = useState<{ id: number | null }>({ id: null })
  const assignMutation = useMutation({
    mutationFn: ({ id, staffId }: { id: number; staffId: number | null }) => assignDoctor(id, staffId),
    onSuccess: (_, variables) => {
      toast.success(variables.staffId ? 'Gán bác sĩ thành công' : 'Bỏ gán bác sĩ thành công')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      setAssignState({ id: null })
    },
  })

  const [detailId, setDetailId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const delMut = useMutation({
    mutationFn: (id: number) => deleteAppointment(id),
    onSuccess: () => { toast.success('Đã xoá lịch hẹn'); qc.invalidateQueries({ queryKey: ['appointments'] }) },
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Xoá thất bại')
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Lịch hẹn - Lễ tân</h1>
        {(can(perms, ['appointment:create']) || can(perms, ['appointment:create_own'])) && (
          <button className="btn-primary" onClick={()=> setCreateOpen(true)}>Tạo lịch hẹn</button>
        )}
      </div>
      <div className="card">
        <AppointmentFilters value={filters} onChange={setFilters} />
      </div>
      <div className="card">
        {isLoading && <div className="space-y-2"><div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded" /><div className="space-y-1">{Array.from({length:6}).map((_,i)=> <div key={i} className="h-4 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded" />)}</div></div>}
        {isError && (
          <div className="text-danger flex items-center justify-between">
            <span>Tải dữ liệu thất bại</span>
            <button className="btn-ghost" onClick={()=> window.location.reload()}>Thử lại</button>
          </div>
        )}
        {!isLoading && !isError && (
          <AppointmentTable
            rows={data?.items ?? []}
            onChangeStatus={(id, status) => statusMutation.mutate({ id: Number(id), status })}
            onOpenReschedule={(id) => setReschedule({ id: Number(id) })}
            onCreateMedicalRecord={canCreateMr ? (id) => setCreateMr({ appointmentId: Number(id) }) : undefined}
            onOpenAssignDoctor={showAssign ? (id) => setAssignState({ id: Number(id) }) : undefined}
            onOpenDetail={(id) => setDetailId(Number(id))}
            onDelete={can(perms, ['appointment:delete']) ? (id) => { if (confirm('Xoá lịch hẹn này?')) delMut.mutate(Number(id)) } : undefined}
          />
        )}
        <div className="mt-3">
          <Pagination page={filters.page} pageCount={pageCount} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      </div>
      <RescheduleModal
        open={!!reschedule.id}
        onClose={() => setReschedule({ id: null })}
        onSubmit={(date) => reschedule.id && rescheduleMutation.mutate({ id: reschedule.id, date })}
      />
      <AssignDoctorModal
        open={!!assignState.id}
        onClose={() => setAssignState({ id: null })}
        canReadStaff={canReadStaff}
        loading={assignMutation.isPending}
        onAssign={(staffId) => assignState.id && assignMutation.mutate({ id: assignState.id, staffId })}
      />
      {canCreateMr && (
        <CreateMedicalRecordModal
          open={!!createMr.appointmentId}
          appointmentId={createMr.appointmentId}
          onClose={() => setCreateMr({ appointmentId: null })}
        />
      )}
      <AppointmentDetailDrawer id={detailId} onClose={()=> setDetailId(null)} />
      {(can(perms, ['appointment:create']) || can(perms, ['appointment:create_own'])) && (
        <CreateAppointmentModal open={createOpen} onClose={()=> setCreateOpen(false)} onCreated={()=> qc.invalidateQueries({ queryKey: ['appointments'] })} />
      )}
    </div>
  )
}



