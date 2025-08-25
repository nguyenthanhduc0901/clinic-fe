import { api } from '@/lib/api/axios'

export type Permission = { id: number; name: string; description?: string | null }
export type Role = { id: number; name: string; description?: string | null; permissions: Permission[] }

export async function listRoles() {
	const res = await api.get('/roles')
	return res.data as Role[]
}

export async function listAllPermissions() {
	const res = await api.get('/roles/permissions')
	return res.data as Permission[]
}

export async function createRole(payload: { name: string; description?: string }) {
	const res = await api.post('/roles', payload)
	return res.data as Role
}

export async function updateRole(id: number, payload: { name?: string; description?: string }) {
	const res = await api.patch(`/roles/${id}`, payload)
	return res.data as Role
}

export async function deleteRole(id: number) {
	const res = await api.delete(`/roles/${id}`)
	return res.data as { success: boolean }
}

export async function setRolePermissions(id: number, permissionIds: number[]) {
	const res = await api.post(`/roles/${id}/permissions`, { permissionIds })
	return res.data as Role
}
