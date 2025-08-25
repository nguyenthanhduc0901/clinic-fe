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


