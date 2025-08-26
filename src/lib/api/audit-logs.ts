import { api } from '@/lib/api/axios'

export type AuditLog = {
	id: number
	table_name: string
	record_id: number
	action: 'INSERT' | 'UPDATE' | 'DELETE'
	old_data: any | null
	new_data: any | null
	changed_at: string
	changed_by_user_id: number | null
}

export async function listAuditLogs(params: { table?: string; recordId?: number; userId?: number; from?: string; to?: string; page?: number; limit?: number }) {
	const res = await api.get('/audit-logs', { params })
	return res.data as { data: AuditLog[]; page: number; limit: number }
}

