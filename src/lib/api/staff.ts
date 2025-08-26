import { api } from '@/lib/api/axios'

export type Staff = {
  id: number
  userId?: number
  fullName?: string
}

export async function listStaff(params: { page?: number; limit?: number; q?: string }) {
  const res = await api.get('/staff', { params })
  return res.data as { data: Staff[]; total: number }
}

export async function getStaff(id: number) {
  const res = await api.get(`/staff/${id}`)
  return res.data as any
}

export async function updateStaff(id: number, payload: Partial<{ fullName: string; gender: string; birthDate: string; address: string; avatarUrl: string }>) {
  const res = await api.patch(`/staff/${id}`, payload)
  return res.data as any
}

export async function createStaff(payload: { userId: number; fullName: string; gender: string; birthDate: string; address?: string; avatarUrl?: string }) {
  const res = await api.post('/staff', payload)
  return res.data as any
}

export async function replaceStaff(id: number, payload: { fullName: string; gender: string; birthDate: string; address?: string; avatarUrl?: string }) {
  const res = await api.put(`/staff/${id}`, payload)
  return res.data as any
}

export async function deleteStaff(id: number) {
  const res = await api.delete(`/staff/${id}`)
  return res.data as { success: boolean }
}


