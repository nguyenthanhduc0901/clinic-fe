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


