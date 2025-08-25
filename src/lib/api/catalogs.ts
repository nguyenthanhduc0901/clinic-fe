import { api } from '@/lib/api/axios'

export type Unit = { id: number; name: string; description?: string | null; createdAt?: string; updatedAt?: string }
export type UsageInstruction = { id: number; instruction: string; description?: string | null; createdAt?: string; updatedAt?: string }
export type DiseaseType = { id: number; name: string; description?: string | null; createdAt?: string; updatedAt?: string }

export async function getCatalogs() {
	const res = await api.get('/catalogs')
	return res.data as { units: Unit[]; usageInstructions: UsageInstruction[]; diseaseTypes: DiseaseType[] }
}
