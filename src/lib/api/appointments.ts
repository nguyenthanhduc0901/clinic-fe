import { api } from '@/lib/api/axios'

export type AppointmentStatus =
  | 'waiting'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type Appointment = {
  id: number
  patientId?: number
  staffId?: number | null
  appointmentDate?: string
  orderNumber: number
  status: AppointmentStatus
  notes?: string | null
  patient?: { id: number; fullName?: string; phone?: string | null }
  staff?: { id: number; fullName?: string | null }
}

export async function listAppointments(params: {
  date?: string
  status?: AppointmentStatus | ''
  q?: string
  patientId?: number
  staffId?: number
  page?: number
  limit?: number
}) {
  const res = await api.get('/appointments', { params })
  return res.data as { data: Appointment[]; total: number }
}

export async function updateAppointmentStatus(id: number, status: AppointmentStatus) {
  const res = await api.patch(`/appointments/${id}/status`, { status })
  return res.data as Appointment
}

export async function rescheduleAppointment(id: number, appointmentDate: string) {
  const res = await api.patch(`/appointments/${id}/reschedule`, { appointmentDate })
  return res.data as Appointment
}

export async function assignDoctor(id: number, staffId: number | null) {
  const res = await api.patch(`/appointments/${id}/assign-doctor`, { staffId })
  return res.data as Appointment
}

export async function createAppointment(payload: { patientId: number; appointmentDate: string; staffId?: number; notes?: string }) {
  const res = await api.post('/appointments', payload)
  return res.data as Appointment
}

export async function getAppointment(id: number) {
  const res = await api.get(`/appointments/${id}`)
  return res.data as Appointment
}

export async function deleteAppointment(id: number) {
  const res = await api.delete(`/appointments/${id}`)
  return res.data as { success: boolean }
}


export async function getTodaySummary(date: string): Promise<Record<AppointmentStatus, number>> {
  const res = await api.get(`/appointments/today/summary`, { params: { date } })
  const data = res.data as any
  // Support both array [{status,count}] and record { status: count }
  if (Array.isArray(data)) {
    const acc: Record<AppointmentStatus, number> = {
      waiting: 0,
      confirmed: 0,
      checked_in: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    }
    for (const row of data) {
      const s = row.status as AppointmentStatus
      const c = Number(row.count || 0)
      if (s in acc) acc[s] = c
    }
    return acc
  }
  return data as Record<AppointmentStatus, number>
}


