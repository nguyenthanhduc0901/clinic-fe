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

export async function createMedicine(payload: {
  name: string
  unitId: number
  defaultSupplierId?: number
  price: string
  quantityInStock?: number
  description?: string | null
}) {
  const res = await api.post('/medicines', payload)
  return res.data as Medicine
}

export async function updateMedicine(id: number, payload: Partial<{ name: string; unitId: number; defaultSupplierId?: number | null; price: string; quantityInStock: number; description?: string | null }>) {
  const res = await api.patch(`/medicines/${id}`, payload)
  return res.data as Medicine
}

export async function deleteMedicine(id: number) {
  const res = await api.delete(`/medicines/${id}`)
  return res.data as { success: boolean }
}

export async function importMedicineStock(id: number, payload: { quantity: number }) {
  const res = await api.post(`/medicines/${id}/import`, payload)
  return res.data as Medicine
}

export async function adjustMedicineStock(id: number, payload: { delta: number }) {
  const res = await api.post(`/medicines/${id}/adjust-stock`, payload)
  return res.data as Medicine
}
