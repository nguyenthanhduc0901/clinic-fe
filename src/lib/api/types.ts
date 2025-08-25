export type Permission = { name: string }

export type Role = {
  name: 'admin' | 'doctor' | 'receptionist' | 'patient' | (string & {})
  permissions?: Permission[]
}

export type User = {
  id?: string
  email: string
  role?: Role
}

export type Patient = {
  id: string
  code?: string
  name: string
  phone?: string
  birthDate?: string
}

export type AppointmentStatus =
  | 'scheduled'
  | 'checked_in'
  | 'completed'
  | 'cancelled'

export type InvoiceStatus = 'pending' | 'paid' | 'overdue'

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'ewallet'



