import { api } from '@/lib/api/axios'

export type Setting = {
	id: number
	key: string
	value: string
	description?: string | null
	createdAt?: string
	updatedAt?: string
}

export async function getSettings() {
	const res = await api.get('/settings')
	return res.data as Setting[]
}

export async function updateSetting(key: string, value: string) {
	const res = await api.put(`/settings/${key}`, { value })
	return res.data as Setting
}


