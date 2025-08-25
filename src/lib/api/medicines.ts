import { api } from '@/lib/api/axios'

export type Medicine = {
	id: number
	name: string
	unitId: number
	unit?: { id: number; name: string }
	defaultSupplierId?: number | null
	price: string
	quantityInStock: number
	description?: string | null
	createdAt?: string
	updatedAt?: string
}

export async function listMedicines(params: { q?: string; unitId?: number; supplierId?: number; priceMin?: number; priceMax?: number; stockMin?: number; stockMax?: number; page?: number; limit?: number }) {
	const res = await api.get('/medicines', { params })
	return res.data as { data: Medicine[]; total: number }
}

export async function getMedicineById(id: number) {
	const res = await api.get(`/medicines/${id}`)
	return res.data as Medicine
}
