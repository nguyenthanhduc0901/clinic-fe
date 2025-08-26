import { api } from '@/lib/api/axios'

export type InvoiceStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'
export type PaymentMethod = 'cash' | 'card' | 'transfer'

export type Invoice = {
	id: number
	medicalRecordId: number
	cashierId?: number | null
	examinationFee?: string
	medicineFee?: string
	totalFee: string
	paymentMethod?: PaymentMethod | null
	status: InvoiceStatus
	paymentDate?: string | null
	notes?: string | null
	createdAt?: string
	updatedAt?: string
}

export async function listInvoices(params: { status?: InvoiceStatus; date?: string; page?: number; limit?: number }) {
	const res = await api.get('/invoices', { params })
	return res.data as { data: Invoice[]; total: number }
}

export async function getInvoiceDetail(id: number) {
	const res = await api.get(`/invoices/${id}`)
	return res.data as { invoice: Invoice; patient?: { id: number; fullName: string }; doctor?: { id: number; fullName: string }; prescriptions: Array<{ id: number; medicalRecordId: number; medicineId: number; quantity: number; usageInstructionId: number; notes: string | null }> }
}

export async function payInvoice(id: number, payload: { paymentMethod: PaymentMethod; notes?: string }) {
	const res = await api.patch(`/invoices/${id}/pay`, payload)
	return res.data as Invoice
}

export async function cancelInvoice(id: number, reason?: string) {
	const res = await api.patch(`/invoices/${id}/cancel`, reason ? { reason } : {})
	return res.data as Invoice
}

export async function refundInvoice(id: number, reason?: string) {
	const res = await api.patch(`/invoices/${id}/refund`, reason ? { reason } : {})
	return res.data as Invoice
}

export async function exportInvoicePdf(id: number) {
	const res = await api.get(`/invoices/${id}/export.pdf`, { responseType: 'blob' })
	return res.data as Blob
}

export async function getInvoiceByMedicalRecord(medicalRecordId: number) {
	const res = await api.get(`/invoices/by-medical-record/${medicalRecordId}`)
	return res.data as any
}
