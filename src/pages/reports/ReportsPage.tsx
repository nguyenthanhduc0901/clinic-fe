import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRevenue, exportRevenueCsv, getMedicineUsage, mapRevenueRow, mapMedicineUsageRow } from '@/lib/api/reports'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend, AreaChart, Area, PieChart, Pie, Cell } from 'recharts'
import { toast } from '@/components/ui/Toast'
import { useChartTheme, PIE_COLORS as THEME_PIE_COLORS } from '@/lib/ui/chartTheme'
import PanelErrorBoundary from '@/components/app/PanelErrorBoundary'

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
			{tab === 'revenue' ? (
				<PanelErrorBoundary title="Báo cáo Doanh thu">
					<RevenueTab />
				</PanelErrorBoundary>
			) : (
				<PanelErrorBoundary title="Báo cáo Sử dụng thuốc">
					<MedicineUsageTab />
				</PanelErrorBoundary>
			)}
		</div>
	)
}

type RevenueRow = { day: string; count: number; exam: number; med: number; total: number }

function RevenueTab() {
	const chartTheme = useChartTheme()
	const [sp, setSp] = useSearchParams()
	const from = sp.get('from') || ''
	const to = sp.get('to') || ''
	const gran = (sp.get('gran') as 'day' | 'week' | 'month') || 'day'
	const chart = (sp.get('chart') as 'line' | 'bar' | 'area') || 'line'

	const params = useMemo(() => ({ from: from || undefined, to: to || undefined }), [from, to])
	const { data, isLoading, isError } = useQuery<RevenueRow[]>({
		queryKey: ['reports-revenue', params],
		queryFn: async () => {
			const rows = await getRevenue(params)
			return rows.map(mapRevenueRow)
		},
	})

	const grouped = useMemo(() => groupRevenueBy(data ?? [], gran), [data, gran])

	const sum = useMemo(() => ({
		count: (data ?? []).reduce((a, b) => a + b.count, 0),
		exam: (data ?? []).reduce((a, b) => a + b.exam, 0),
		med: (data ?? []).reduce((a, b) => a + b.med, 0),
		total: (data ?? []).reduce((a, b) => a + b.total, 0),
	}), [data])

	async function downloadCsv() {
		try {
			const blob = await exportRevenueCsv(params)
			const name = `revenue_${from || 'all'}_${to || 'all'}.csv`
			// centralized helper
			;(await import('@/lib/utils/download')).downloadBlob(blob, name)
		} catch (e: any) {
			toast.error(e?.message || 'Tải CSV thất bại')
		}
	}

	return (
		<div className="card">
			<div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
				<input className="rounded-md border px-3 py-2" type="date" value={from} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('from', v); else p.delete('from'); return p }, { replace:true })} />
				<input className="rounded-md border px-3 py-2" type="date" value={to} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('to', v); else p.delete('to'); return p }, { replace:true })} />
				<select className="rounded-md border px-3 py-2" value={gran} onChange={(e)=> setSp((p)=>{ p.set('gran', e.target.value); return p }, { replace:true })}>
					<option value="day">Theo ngày</option>
					<option value="week">Theo tuần</option>
					<option value="month">Theo tháng</option>
				</select>
				<select className="rounded-md border px-3 py-2" value={chart} onChange={(e)=> setSp((p)=>{ p.set('chart', e.target.value); return p }, { replace:true })}>
					<option value="line">Đường</option>
					<option value="bar">Cột</option>
					<option value="area">Diện tích</option>
				</select>
				<div className="flex justify-end">
					<button className="btn" onClick={downloadCsv}>Tải CSV</button>
				</div>
			</div>
			{isLoading && <div>Đang tải...</div>}
			{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
			{!isLoading && !isError && (
				<div className="space-y-4">
					<div className="h-64 w-full">
						<ResponsiveContainer width="100%" height="100%">
							{chart==='line' ? (
								<LineChart data={grouped} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
									<CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
									<XAxis dataKey="label" tick={chartTheme.axisTick} tickFormatter={(v)=> formatDateLabel(String(v))} />
									<YAxis tick={chartTheme.axisTick} />
									<Tooltip wrapperStyle={chartTheme.tooltip.wrapperStyle} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
									<Legend wrapperStyle={chartTheme.legend.wrapperStyle} />
									<Line type="monotone" dataKey="total" stroke={chartTheme.colors.primary} name="Tổng doanh thu" strokeWidth={2} dot={false} />
									<Line type="monotone" dataKey="exam" stroke={chartTheme.colors.success} name="Tiền khám" strokeWidth={2} dot={false} />
									<Line type="monotone" dataKey="med" stroke={chartTheme.colors.warning} name="Tiền thuốc" strokeWidth={2} dot={false} />
								</LineChart>
							) : chart==='bar' ? (
								<BarChart data={grouped} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
									<CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
									<XAxis dataKey="label" tick={chartTheme.axisTick} tickFormatter={(v)=> formatDateLabel(String(v))} />
									<YAxis tick={chartTheme.axisTick} />
									<Tooltip wrapperStyle={chartTheme.tooltip.wrapperStyle} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
									<Legend wrapperStyle={chartTheme.legend.wrapperStyle} />
									<Bar dataKey="total" fill={chartTheme.colors.primary} name="Tổng" />
									<Bar dataKey="exam" fill={chartTheme.colors.success} name="Tiền khám" />
									<Bar dataKey="med" fill={chartTheme.colors.warning} name="Tiền thuốc" />
								</BarChart>
							) : (
								<AreaChart data={grouped} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
									<CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
									<XAxis dataKey="label" tick={chartTheme.axisTick} tickFormatter={(v)=> formatDateLabel(String(v))} />
									<YAxis tick={chartTheme.axisTick} />
									<Tooltip wrapperStyle={chartTheme.tooltip.wrapperStyle} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
									<Legend wrapperStyle={chartTheme.legend.wrapperStyle} />
									<Area type="monotone" dataKey="total" stroke={chartTheme.colors.primary} fill={chartTheme.colors.primary} name="Tổng doanh thu" />
									<Area type="monotone" dataKey="exam" stroke={chartTheme.colors.success} fill={chartTheme.colors.success} name="Tiền khám" />
									<Area type="monotone" dataKey="med" stroke={chartTheme.colors.warning} fill={chartTheme.colors.warning} name="Tiền thuốc" />
								</AreaChart>
							)}
						</ResponsiveContainer>
					</div>
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left text-slate-600">
								<th className="px-3 py-2">{gran==='day'?'Ngày': gran==='week'?'Tuần':'Tháng'}</th>
								<th className="px-3 py-2 text-right">Số HĐ</th>
								<th className="px-3 py-2 text-right">Tiền khám</th>
								<th className="px-3 py-2 text-right">Tiền thuốc</th>
								<th className="px-3 py-2 text-right">Tổng</th>
							</tr>
						</thead>
						<tbody>
							{grouped.map((r) => (
								<tr key={r.label} className="border-t">
									<td className="px-3 py-2">{formatDateLabel(r.label)}</td>
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
	const chartTheme = useChartTheme()
	const [sp, setSp] = useSearchParams()
	const from = sp.get('from') || ''
	const to = sp.get('to') || ''
	const chart = (sp.get('chart') as 'bar' | 'pie') || 'bar'
	const topN = Number(sp.get('top') || '10')

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
			<div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
				<input className="rounded-md border px-3 py-2" type="date" value={from} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('from', v); else p.delete('from'); return p }, { replace:true })} />
				<input className="rounded-md border px-3 py-2" type="date" value={to} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('to', v); else p.delete('to'); return p }, { replace:true })} />
				<select className="rounded-md border px-3 py-2" value={chart} onChange={(e)=> setSp((p)=>{ p.set('chart', e.target.value); return p }, { replace:true })}>
					<option value="bar">Cột</option>
					<option value="pie">Tròn</option>
				</select>
				<select className="rounded-md border px-3 py-2" value={String(topN)} onChange={(e)=> setSp((p)=>{ p.set('top', e.target.value); return p }, { replace:true })}>
					<option value="5">Top 5</option>
					<option value="10">Top 10</option>
					<option value="20">Top 20</option>
					<option value="50">Top 50</option>
				</select>
			</div>
			{isLoading && <div>Đang tải...</div>}
			{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
			{!isLoading && !isError && (
				<div className="space-y-4">
					<div className="h-64 w-full">
						<ResponsiveContainer width="100%" height="100%">
							{chart==='bar' ? (
								<BarChart data={(data ?? []).slice(0, topN)} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
									<CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
									<XAxis dataKey="name" tick={chartTheme.axisTick} />
									<YAxis tick={chartTheme.axisTick} />
									<Tooltip wrapperStyle={chartTheme.tooltip.wrapperStyle} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
									<Legend wrapperStyle={chartTheme.legend.wrapperStyle} />
									<Bar dataKey="qtyTotal" fill={chartTheme.colors.primary} name="Tổng SL" />
									<Bar dataKey="times" fill={chartTheme.colors.success} name="Số lần" />
								</BarChart>
							) : (
								<PieChart>
									<Tooltip wrapperStyle={chartTheme.tooltip.wrapperStyle} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
									<Legend wrapperStyle={chartTheme.legend.wrapperStyle} />
									<Pie dataKey="qtyTotal" nameKey="name" data={(data ?? []).slice(0, topN)} outerRadius={90} label>
										{(data ?? []).slice(0, topN).map((_, i) => (
											<Cell key={`c-${i}`} fill={THEME_PIE_COLORS[i % THEME_PIE_COLORS.length]} />
										))}
									</Pie>
								</PieChart>
							)}
						</ResponsiveContainer>
					</div>
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
							{(data ?? []).slice(0, topN).map((r) => (
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

function groupRevenueBy(rows: RevenueRow[], gran: 'day' | 'week' | 'month') {
	if (gran === 'day') {
		return rows.map((r) => ({ label: r.day, ...r }))
	}
	const map = new Map<string, { label: string; count: number; exam: number; med: number; total: number }>()
	for (const r of rows) {
		const d = new Date(r.day)
		let key = ''
		if (gran === 'week') {
			const y = d.getFullYear()
			const w = getWeekNumber(d)
			key = `${y}-W${w}`
		} else {
			const y = d.getFullYear()
			const m = d.getMonth() + 1
			key = `${y}-${String(m).padStart(2, '0')}`
		}
		if (!map.has(key)) {
			map.set(key, { label: key, count: 0, exam: 0, med: 0, total: 0 })
		}
		const acc = map.get(key)!
		acc.count += r.count
		acc.exam += r.exam
		acc.med += r.med
		acc.total += r.total
	}
	return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
}

function getWeekNumber(date: Date) {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
	const dayNum = d.getUTCDay() || 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum)
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
	const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
	return weekNo
}

function formatDateLabel(label: string) {
	const date = new Date(label)
	const month = date.getMonth() + 1
	const day = date.getDate()
	return `${day}/${month}`
}

// Deprecated local palette; using THEME_PIE_COLORS from chartTheme



