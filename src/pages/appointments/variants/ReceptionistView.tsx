import { useState } from 'react'
import AppointmentFilters, { type Filters } from '@/pages/appointments/components/AppointmentFilters'
import AppointmentTable, { type AppointmentRow } from '@/pages/appointments/components/AppointmentTable'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import Pagination from '@/components/ui/Pagination'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAppointmentStatus, rescheduleAppointment, assignDoctor } from '@/lib/api/appointments'
import RescheduleModal from '@/pages/appointments/components/RescheduleModal'
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
      if (err?.response?.status === 409) toast.error('Có thay đổi đồng thời, vui lòng thử lại.')
    },
  })

  const [reschedule, setReschedule] = useState<{ id: number | null }>({ id: null })
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / (filters.limit || 10)))

  const { permissions, user } = useAuthStore()
  const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
  const canAssign = can(perms, ['appointment:update']) && can(perms, ['staff:read'])

  const [assignState, setAssignState] = useState<{ id: number | null }>({ id: null })
  const assignMutation = useMutation({
    mutationFn: ({ id, staffId }: { id: number; staffId: number | null }) => assignDoctor(id, staffId),
    onSuccess: (_, variables) => {
      toast.success(variables.staffId ? 'Gán bác sĩ thành công' : 'Bỏ gán bác sĩ thành công')
      qc.invalidateQueries({ queryKey: ['appointments'] })
      setAssignState({ id: null })
    },
  })

  return (
    <div className="space-y-3">
      <h1 className="page-title">Appointments - Receptionist</h1>
      <div className="card">
        <AppointmentFilters value={filters} onChange={setFilters} />
      </div>
      <div className="card">
        {isLoading && <div>Loading...</div>}
        {isError && <div className="text-danger">Failed to load</div>}
        {!isLoading && !isError && (
          <AppointmentTable
            rows={data?.items ?? []}
            onChangeStatus={(id, status) => statusMutation.mutate({ id: Number(id), status })}
            onOpenReschedule={(id) => setReschedule({ id: Number(id) })}
            onOpenAssignDoctor={canAssign ? (id) => setAssignState({ id: Number(id) }) : undefined}
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
        canReadStaff={can(perms, ['staff:read'])}
        loading={assignMutation.isPending}
        onAssign={(staffId) => assignState.id && assignMutation.mutate({ id: assignState.id, staffId })}
      />
    </div>
  )
}



