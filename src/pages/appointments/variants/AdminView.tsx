import AppointmentFilters, { type Filters } from '@/pages/appointments/components/AppointmentFilters'
import AppointmentTable, { type AppointmentRow } from '@/pages/appointments/components/AppointmentTable'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Pagination from '@/components/ui/Pagination'
import { api } from '@/lib/api/axios'

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

  return (
    <div className="space-y-3">
      <h1 className="page-title">Appointments - Admin</h1>
      <div className="card">
        <AppointmentFilters value={filters} onChange={setFilters} />
      </div>
      <div className="card">
        {isLoading && <div>Loading...</div>}
        {isError && <div className="text-danger">Failed to load</div>}
        {!isLoading && !isError && <AppointmentTable rows={data?.items ?? []} />}
        <div className="mt-3">
          <Pagination page={filters.page} pageCount={pageCount} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      </div>
    </div>
  )
}



