import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRevenue, exportRevenueCsv, getMedicineUsage, mapRevenueRow, mapMedicineUsageRow } from '@/lib/api/reports'
import { toast } from '@/components/ui/Toast'

export default function ReportsPage() {
	const [tab, setTab] = useState<'revenue' | 'usage'>('revenue')
	return (
		<div className="space-y-3">
			<h1 className="page-title">Reports</h1>
			<div className="card">
				<div className="flex gap-2">
					<button className={`btn-ghost ${tab==='revenue' ? 'underline' : ''}`} onClick={()=> setTab('revenue')}>Revenue</button>
					<button className={`btn-ghost ${tab==='usage' ? 'underline' : ''}`} onClick={()=> setTab('usage')}>Medicine Usage</button>
				</div>
			</div>
			{tab === 'revenue' ? <RevenueTab /> : <MedicineUsageTab />}
		</div>
	)
}

function RevenueTab() {
	const [sp, setSp] = useSearchParams()
	const from = sp.get('from') || ''
	const to = sp.get('to') || ''

	const params = useMemo(() => ({ from: from || undefined, to: to || undefined }), [from, to])
	const { data, isLoading, isError } = useQuery<{ day: string; count: number; exam: number; med: number; total: number }[]>({
		queryKey: ['reports-revenue', params],
		queryFn: async () => {
			const rows = await getRevenue(params)
			return rows.map(mapRevenueRow)
		},
	})

	const sum = useMemo(() => ({
		count: (data ?? []).reduce((a, b) => a + b.count, 0),
		exam: (data ?? []).reduce((a, b) => a + b.exam, 0),
		med: (data ?? []).reduce((a, b) => a + b.med, 0),
		total: (data ?? []).reduce((a, b) => a + b.total, 0),
	}), [data])

	async function downloadCsv() {
		try {
			const blob = await exportRevenueCsv(params)
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `revenue_${from || 'all'}_${to || 'all'}.csv`
			a.click()
			URL.revokeObjectURL(url)
		} catch (e: any) {
			toast.error(e?.message || 'Tải CSV thất bại')
		}
	}

	return (
		<div className="card">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
				<input className="rounded-md border px-3 py-2" type="date" value={from} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('from', v); else p.delete('from'); return p }, { replace:true })} />
				<input className="rounded-md border px-3 py-2" type="date" value={to} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('to', v); else p.delete('to'); return p }, { replace:true })} />
				<div />
				<div className="flex justify-end">
					<button className="btn" onClick={downloadCsv}>Tải CSV</button>
				</div>
			</div>
			{isLoading && <div>Đang tải...</div>}
			{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
			{!isLoading && !isError && (
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left text-slate-600">
								<th className="px-3 py-2">Ngày</th>
								<th className="px-3 py-2 text-right">Số HĐ</th>
								<th className="px-3 py-2 text-right">Tiền khám</th>
								<th className="px-3 py-2 text-right">Tiền thuốc</th>
								<th className="px-3 py-2 text-right">Tổng</th>
							</tr>
						</thead>
						<tbody>
							{(data ?? []).map((r) => (
								<tr key={r.day} className="border-t">
									<td className="px-3 py-2">{r.day}</td>
									<td className="px-3 py-2 text-right">{r.count}</td>
									<td className="px-3 py-2 text-right">{formatVnd(r.exam)}</td>
									<td className="px-3 py-2 text-right">{formatVnd(r.med)}</td>
									<td className="px-3 py-2 text-right">{formatVnd(r.total)}</td>
								</tr>
							))}
							<tr className="border-t font-medium">
								<td className="px-3 py-2">Tổng</td>
								<td className="px-3 py-2 text-right">{sum.count}</td>
								<td className="px-3 py-2 text-right">{formatVnd(sum.exam)}</td>
								<td className="px-3 py-2 text-right">{formatVnd(sum.med)}</td>
								<td className="px-3 py-2 text-right">{formatVnd(sum.total)}</td>
							</tr>
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}

function MedicineUsageTab() {
	const [sp, setSp] = useSearchParams()
	const from = sp.get('from') || ''
	const to = sp.get('to') || ''

	const params = useMemo(() => ({ from: from || undefined, to: to || undefined }), [from, to])
	const { data, isLoading, isError } = useQuery<{ name: string; unit: string; qtyTotal: number; times: number }[]>({
		queryKey: ['reports-usage', params],
		queryFn: async () => {
			const rows = await getMedicineUsage(params)
			return rows.map(mapMedicineUsageRow)
		},
	})

	return (
		<div className="card">
			<div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
				<input className="rounded-md border px-3 py-2" type="date" value={from} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('from', v); else p.delete('from'); return p }, { replace:true })} />
				<input className="rounded-md border px-3 py-2" type="date" value={to} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('to', v); else p.delete('to'); return p }, { replace:true })} />
			</div>
			{isLoading && <div>Đang tải...</div>}
			{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
			{!isLoading && !isError && (
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left text-slate-600">
								<th className="px-3 py-2">Tên thuốc</th>
								<th className="px-3 py-2">Đơn vị</th>
								<th className="px-3 py-2">Tổng SL kê</th>
								<th className="px-3 py-2">Số lần kê</th>
							</tr>
						</thead>
						<tbody>
							{(data ?? []).map((r) => (
								<tr key={r.name} className="border-t">
									<td className="px-3 py-2">{r.name}</td>
									<td className="px-3 py-2">{r.unit}</td>
									<td className="px-3 py-2">{r.qtyTotal}</td>
									<td className="px-3 py-2">{r.times}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}

function formatVnd(v: string | number) {
	const n = typeof v === 'string' ? Number(v) : v
	try {
		return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
	} catch {
		return String(v)
	}
}



