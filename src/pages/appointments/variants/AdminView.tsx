import AppointmentFilters, { type Filters } from '@/pages/appointments/components/AppointmentFilters'
import AppointmentTable, { type AppointmentRow } from '@/pages/appointments/components/AppointmentTable'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'

export default function AdminView() {
  const today = new Date().toISOString().slice(0, 10)
  const [filters, setFilters] = useState<Filters>({ date: today, q: '', page: 1, limit: 10 })
  const { data, isLoading, isError } = useQuery({
    queryKey: ['appointments-admin', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.date) params.set('date', filters.date)
      if (filters.q) params.set('q', filters.q)
      if (filters.status) params.set('status', filters.status)
      params.set('page', String(filters.page))
      params.set('limit', String(filters.limit))
      const res = await api.get(`/appointments?${params.toString()}`)
      return res.data as { items: AppointmentRow[]; total: number }
    },
  })

  return (
    <div className="space-y-3">
      <h1 className="page-title">Appointments - Admin</h1>
      <div className="card">
        <AppointmentFilters variant="advanced" value={filters} onChange={setFilters} />
      </div>
      <div className="card">
        {isLoading && <div>Loading...</div>}
        {isError && <div className="text-danger">Failed to load</div>}
        {!isLoading && !isError && <AppointmentTable rows={data?.items ?? []} />}
      </div>
    </div>
  )
}



