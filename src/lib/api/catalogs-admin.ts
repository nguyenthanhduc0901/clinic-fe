import { api } from '@/lib/api/axios'
type Unit = { id: number; name: string; description?: string | null; createdAt?: string; updatedAt?: string }
type UsageInstruction = { id: number; instruction: string; description?: string | null; createdAt?: string; updatedAt?: string }
type DiseaseType = { id: number; name: string; description?: string | null; createdAt?: string; updatedAt?: string }

// Units
export async function listUnits(params: { page?: number; limit?: number }) {
	const res = await api.get('/catalogs/units', { params })
	return res.data as { data: Unit[]; total: number }
}

export async function createUnit(payload: { name: string; description?: string }) {
	const res = await api.post('/catalogs/units', payload)
	return res.data as Unit
}

export async function updateUnit(id: number, payload: Partial<{ name: string; description?: string }>) {
	const res = await api.put(`/catalogs/units/${id}`, payload)
	return res.data as Unit
}

export async function deleteUnit(id: number) {
	const res = await api.delete(`/catalogs/units/${id}`)
	return res.data as { success: boolean }
}

// Usage Instructions
export async function listUsageInstructions(params: { page?: number; limit?: number }) {
	const res = await api.get('/catalogs/usage-instructions', { params })
	return res.data as { data: UsageInstruction[]; total: number }
}

export async function createUsageInstruction(payload: { instruction: string; description?: string }) {
	const res = await api.post('/catalogs/usage-instructions', payload)
	return res.data as UsageInstruction
}

export async function updateUsageInstruction(id: number, payload: Partial<{ instruction: string; description?: string }>) {
	const res = await api.put(`/catalogs/usage-instructions/${id}`, payload)
	return res.data as UsageInstruction
}

export async function deleteUsageInstruction(id: number) {
	const res = await api.delete(`/catalogs/usage-instructions/${id}`)
	return res.data as { success: boolean }
}

// Disease Types
export async function listDiseaseTypes(params: { page?: number; limit?: number }) {
	const res = await api.get('/catalogs/disease-types', { params })
	return res.data as { data: DiseaseType[]; total: number }
}

export async function createDiseaseType(payload: { name: string; description?: string }) {
	const res = await api.post('/catalogs/disease-types', payload)
	return res.data as DiseaseType
}

export async function updateDiseaseType(id: number, payload: Partial<{ name: string; description?: string }>) {
	const res = await api.put(`/catalogs/disease-types/${id}`, payload)
	return res.data as DiseaseType
}

export async function deleteDiseaseType(id: number) {
	const res = await api.delete(`/catalogs/disease-types/${id}`)
	return res.data as { success: boolean }
}


