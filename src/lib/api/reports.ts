import { api } from '@/lib/api/axios'

export async function getRevenue(params: { from?: string; to?: string }) {
	const res = await api.get('/reports/revenue', { params })
	return res.data as Array<Record<string, string>>
}

export async function exportRevenueCsv(params: { from?: string; to?: string }) {
	const res = await api.get('/invoices/export/revenue.csv', { params, responseType: 'blob' })
	return res.data as Blob
}

export async function getMedicineUsage(params: { from?: string; to?: string }) {
	const res = await api.get('/reports/medicine-usage', { params })
	return res.data as Array<Record<string, string>>
}

export function mapRevenueRow(row: Record<string, string>) {
	return {
		day: row['Ngày'],
		count: Number(row['Số hóa đơn']),
		exam: Number(row['Tiền khám']),
		med: Number(row['Tiền thuốc']),
		total: Number(row['Tổng doanh thu']),
	}
}

export function mapMedicineUsageRow(row: Record<string, string>) {
	return {
		name: row['Tên thuốc'],
		unit: row['Đơn vị'],
		qtyTotal: Number(row['Tổng số lượng đã kê']),
		times: Number(row['Số lần kê']),
	}
}


