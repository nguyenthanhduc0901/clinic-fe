import { api } from '@/lib/api/axios'

export type Profile = {
	id: number
	email: string
	phone?: string | null
	roleId?: number
	role?: { id: number; name: string; permissions?: Array<{ id: number; name: string }> }
	isActive: boolean
	lastLogin?: string | null
	createdAt?: string
	updatedAt?: string
	staff?: { id: number; userId: number; fullName: string; gender?: string; birthDate?: string; address?: string | null; avatarUrl?: string | null }
}

export async function getMyProfile() {
	const res = await api.get('/auth/profile')
	return res.data as Profile
}

export async function updateMyProfile(payload: Partial<{ email:string; phone:string; fullName:string; gender:string; birthDate:string; address:string; avatarUrl:string }>) {
	const res = await api.put('/auth/profile', payload)
	return res.data as Profile
}
