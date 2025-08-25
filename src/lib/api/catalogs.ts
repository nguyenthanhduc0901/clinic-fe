import { api } from '@/lib/api/axios'

export type Unit = { id: number; name: string }

export async function getCatalogs() {
	const res = await api.get('/catalogs')
	return res.data as { units: Unit[] }
}
