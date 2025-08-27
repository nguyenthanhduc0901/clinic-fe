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

// Avatar APIs
export async function uploadStaffAvatar(
  id: number,
  file: File,
  onUploadProgress?: (percent: number) => void,
) {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post(`/staff/${id}/avatar`, form, {
    headers: { /* do not set Content-Type; browser will set boundary */ },
    onUploadProgress: (evt) => {
      if (!evt.total) return
      const percent = Math.round((evt.loaded / evt.total) * 100)
      onUploadProgress?.(percent)
    },
  })
  return res.data as any
}

export async function deleteStaffAvatar(id: number) {
  const res = await api.delete(`/staff/${id}/avatar`)
  return res.data as any
}

export async function getStaffAvatarBlob(id: number) {
  const res = await api.get(`/staff/${id}/avatar`, { responseType: 'blob' })
  return res.data as Blob
}


