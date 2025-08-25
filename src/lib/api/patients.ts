import { api } from '@/lib/api/axios'

export type Patient = {
  id: number
  userId: number | null
  fullName: string
  gender: 'Nam' | 'Nữ' | 'Khác' | string
  birthYear: number
  phone?: string | null
  address?: string | null
  createdAt?: string
  updatedAt?: string
}

export async function listPatients(params: { page?: number; limit?: number; q?: string }) {
  const res = await api.get('/patients', { params })
  return res.data as { data: Patient[]; total: number }
}

export async function createPatient(payload: {
  fullName: string
  birthYear: number
  gender: string
  phone?: string
  address?: string
}) {
  const res = await api.post('/patients', payload)
  return res.data as Patient
}

export async function getPatient(id: number) {
  const res = await api.get(`/patients/${id}`)
  return res.data as Patient
}

export async function updatePatient(id: number, payload: Partial<{ fullName: string; birthYear: number; gender: string; phone?: string; address?: string }>) {
  const res = await api.put(`/patients/${id}` , payload)
  return res.data as Patient
}


