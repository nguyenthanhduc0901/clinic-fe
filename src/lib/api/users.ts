import { api } from '@/lib/api/axios'

export type RoleRef = { id: number; name: string }
export type StaffRef = { id: number; fullName?: string; gender?: string; avatarUrl?: string | null }
export type User = {
	id: number
	email: string
	phone?: string | null
	roleId?: number
	role?: RoleRef
	isActive: boolean
	lastLogin?: string | null
	createdAt?: string
	updatedAt?: string
	staff?: StaffRef | null
}

export async function listUsers(params: { page?: number; limit?: number; q?: string; roleId?: number }) {
	const res = await api.get('/users', { params })
	return res.data as { data: User[]; total: number }
}

export async function getUser(id: number) {
	const res = await api.get(`/users/${id}`)
	return res.data as User
}

export async function createUser(payload: { email: string; phone?: string; password: string; roleId: number; staff?: { fullName: string; gender?: string; birthDate?: string; address?: string; avatarUrl?: string } }) {
	const res = await api.post('/users', payload)
	return res.data as User
}

export async function updateUser(id: number, payload: Partial<{ email: string; phone: string; password: string; roleId: number }>) {
	const res = await api.patch(`/users/${id}`, payload)
	return res.data as User
}

export async function activateUser(id: number) {
	const res = await api.patch(`/users/${id}/activate`, {})
	return res.data as { success: boolean }
}

export async function deactivateUser(id: number) {
	const res = await api.patch(`/users/${id}/deactivate`, {})
	return res.data as { success: boolean }
}

export async function resetUserPassword(id: number, newPassword: string) {
	const res = await api.post(`/users/${id}/reset-password`, { newPassword })
	return res.data as { success: boolean }
}

export async function deleteUser(id: number) {
	const res = await api.delete(`/users/${id}`)
	return res.data as { success: boolean }
}
