import { api } from '@/lib/api/axios'

export type Supplier = {
	id: number
	name: string
	contactPerson?: string | null
	phone?: string | null
	email?: string | null
	address?: string | null
	createdAt?: string
	updatedAt?: string
}

export type MedicineImport = {
	id: number
	medicineId: number
	supplierId?: number | null
	staffId?: number | null
	quantityImported: number
	importPrice?: string | null
	lotNumber?: string | null
	expirationDate?: string | null
	importedAt?: string
}

export async function listSuppliers(params: { q?: string; page?: number; limit?: number }) {
	const res = await api.get('/inventory/suppliers', { params })
	return res.data as { data: Supplier[]; total: number }
}

export async function createSupplier(payload: Partial<Supplier> & { name: string }) {
	const res = await api.post('/inventory/suppliers', payload)
	return res.data as Supplier
}

export async function updateSupplier(id: number, payload: Partial<Supplier>) {
	const res = await api.put(`/inventory/suppliers/${id}`, payload)
	return res.data as Supplier
}

export async function deleteSupplier(id: number) {
	const res = await api.delete(`/inventory/suppliers/${id}`)
	return res.data as { success: boolean }
}

export async function createImport(payload: { medicineId: number; supplierId?: number; staffId?: number; quantityImported: number; importPrice?: string; lotNumber?: string; expirationDate?: string }) {
	const res = await api.post('/inventory/imports', payload)
	return res.data as MedicineImport
}

export async function listImports(params: { medicineId?: number; supplierId?: number; page?: number; limit?: number }) {
	const res = await api.get('/inventory/imports', { params })
	return res.data as { data: MedicineImport[]; total: number }
}

export async function getImport(id: number) {
	const res = await api.get(`/inventory/imports/${id}`)
	return res.data as MedicineImport
}
