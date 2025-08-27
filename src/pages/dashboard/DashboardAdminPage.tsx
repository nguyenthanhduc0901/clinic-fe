import { useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getRevenue, mapRevenueRow, getMedicineUsage, mapMedicineUsageRow } from '@/lib/api/reports'
import { listMedicines } from '@/lib/api/medicines'
import { listAuditLogs } from '@/lib/api/audit-logs'
import { listInvoices, type InvoiceStatus } from '@/lib/api/invoices'
import { getTodaySummary } from '@/lib/api/appointments'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { useChartTheme } from '@/lib/ui/chartTheme'
import PanelErrorBoundary from '@/components/app/PanelErrorBoundary'

type RevenuePoint = { day: string; count: number; exam: number; med: number; total: number }

export default function DashboardAdminPage() {
  const chartTheme = useChartTheme()
  const [sp, setSp] = useSearchParams()
  const today = new Date()
  const defaultFrom = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 13)
    return toIsoDate(d)
  }, [])
  const defaultTo = toIsoDate(today)
  const from = sp.get('from') || defaultFrom
  const to = sp.get('to') || defaultTo
  const stockThreshold = Number(sp.get('stockMax') || '10')

  useEffect(() => {
    setSp((p) => {
      if (!p.get('from')) { p.set('from', defaultFrom) }
      if (!p.get('to')) { p.set('to', defaultTo) }
      if (!p.get('stockMax')) { p.set('stockMax', String(stockThreshold)) }
      return p
    }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Revenue range
  const revenueParams = useMemo(() => ({ from, to }), [from, to])
  const revenueQuery = useQuery<RevenuePoint[]>({
    queryKey: ['reports','revenue', revenueParams],
    queryFn: async () => (await getRevenue(revenueParams)).map(mapRevenueRow),
    staleTime: 60_000,
    retry: 0,
  })

  // Appointments today summary
  const todayStr = toIsoDate(today)
  const apptQuery = useQuery<Record<string, number>>({
    queryKey: ['appointments','summary', { date: todayStr }],
    queryFn: () => getTodaySummary(todayStr),
    staleTime: 30_000,
    retry: 0,
  })

  // Medicine usage in range (Top 10)
  const usageQuery = useQuery<{ name: string; unit: string; qtyTotal: number; times: number }[]>({
    queryKey: ['reports','medicineUsage', revenueParams],
    queryFn: async () => (await getMedicineUsage(revenueParams)).map(mapMedicineUsageRow),
    staleTime: 60_000,
    retry: 0,
  })

  // Low stock medicines
  const lowStockQuery = useQuery({
    queryKey: ['medicines','lowStock', { stockMax: stockThreshold }],
    queryFn: () => listMedicines({ stockMax: stockThreshold, limit: 100, page: 1 }),
    staleTime: 120_000,
    retry: 0,
  })

  // Recent audit logs (7 days)
  const sevenDaysAgoDate = toIsoDate(new Date(Date.now() - 7 * 86400000))
  const auditQuery = useQuery({
    queryKey: ['auditLogs', { from: sevenDaysAgoDate, to: todayStr }],
    queryFn: () => listAuditLogs({ from: sevenDaysAgoDate, to: todayStr, page: 1, limit: 20 }),
    staleTime: 60_000,
    retry: 0,
  })

  // Optional: invoices breakdown today (paid vs pending)
  const invoicesTodayPaid = useInvoicesCount('paid', todayStr)
  const invoicesTodayPending = useInvoicesCount('pending', todayStr)

  const revenue = revenueQuery.data ?? []
  const revenueToday = useMemo(() => {
    const key = toIsoDate(new Date())
    return revenue.filter(r => r.day === key).reduce((a, r) => a + r.total, 0)
  }, [revenue])

  const revenueMTD = useMemo(() => sumByFilter(revenue, (dt) => isSameMonth(dt, new Date())), [revenue])
  const revenueYTD = useMemo(() => sumByFilter(revenue, (dt) => isSameYear(dt, new Date())), [revenue])

  const lowStock = (lowStockQuery.data?.data ?? []).slice().sort((a, b) => (a.quantityInStock ?? 0) - (b.quantityInStock ?? 0)).slice(0, 10)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Bảng điều khiển Quản trị</h1>
        <div className="flex items-center gap-2">
          <input aria-label="From date" className="rounded-md border px-3 py-2" type="date" value={from} onChange={(e)=> setSp((p)=>{ p.set('from', e.target.value); return p }, { replace:true })} />
          <input aria-label="To date" className="rounded-md border px-3 py-2" type="date" value={to} onChange={(e)=> setSp((p)=>{ p.set('to', e.target.value); return p }, { replace:true })} />
          <Link className="btn-ghost" to="/patients">Tạo bệnh nhân</Link>
          <Link className="btn-ghost" to="/appointments">Tạo lịch hẹn</Link>
          <Link className="btn" to="/reports">Xem báo cáo</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <KpiCard title="Revenue hôm nay" value={formatVnd(revenueToday)} loading={revenueQuery.isLoading} />
        <KpiCard title="Invoices hôm nay (paid)" value={String(invoicesTodayPaid.count)} loading={invoicesTodayPaid.loading} />
        <KpiCard title="Invoices hôm nay (pending)" value={String(invoicesTodayPending.count)} loading={invoicesTodayPending.loading} />
        <KpiCard title="Lịch hẹn hôm nay" value={String(Object.values(apptQuery.data ?? {}).reduce((a,b)=> a + (b||0), 0))} loading={apptQuery.isLoading} />
        <KpiCard title="Doanh thu MTD / YTD" value={`${formatVnd(revenueMTD)} / ${formatVnd(revenueYTD)}`} loading={revenueQuery.isLoading} />
        <KpiCard title="Tồn kho thấp" value={String(lowStock.length)} loading={lowStockQuery.isLoading} />
      </div>

      {/* Row 2: Revenue trend & Invoices breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <PanelErrorBoundary title="Doanh thu theo ngày">
        <div className="card lg:col-span-2">
          <SectionTitle>Doanh thu theo ngày</SectionTitle>
          <BlockState isLoading={revenueQuery.isLoading} isError={revenueQuery.isError} onRetry={revenueQuery.refetch}>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                  <XAxis dataKey="day" tick={chartTheme.axisTick} />
                  <YAxis tick={chartTheme.axisTick} />
                  <Tooltip wrapperStyle={chartTheme.tooltip.wrapperStyle} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
                  <Legend wrapperStyle={chartTheme.legend.wrapperStyle} />
                  <Area type="monotone" dataKey="total" stroke={chartTheme.colors.primary} fill={chartTheme.colors.primary} name="Tổng" />
                  <Area type="monotone" dataKey="exam" stroke={chartTheme.colors.success} fill={chartTheme.colors.success} name="Khám" />
                  <Area type="monotone" dataKey="med" stroke={chartTheme.colors.warning} fill={chartTheme.colors.warning} name="Thuốc" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BlockState>
        </div>
        </PanelErrorBoundary>
        <PanelErrorBoundary title="Hóa đơn hôm nay">
        <div className="card">
          <SectionTitle>Hóa đơn hôm nay</SectionTitle>
          <BlockState isLoading={invoicesTodayPaid.loading || invoicesTodayPending.loading} isError={false}>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip wrapperStyle={chartTheme.tooltip.wrapperStyle} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
                  <Legend wrapperStyle={chartTheme.legend.wrapperStyle} />
                  <Pie dataKey="value" nameKey="name" data={[
                    { name: 'Paid', value: invoicesTodayPaid.count },
                    { name: 'Pending', value: invoicesTodayPending.count },
                  ]} outerRadius={90} label>
                    <Cell fill={chartTheme.colors.success} />
                    <Cell fill={chartTheme.colors.warning} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </BlockState>
        </div>
        </PanelErrorBoundary>
      </div>

      {/* Row 3: Appointments today & Medicine usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <PanelErrorBoundary title="Lịch hẹn hôm nay theo trạng thái">
        <div className="card">
          <SectionTitle>Lịch hẹn hôm nay theo trạng thái</SectionTitle>
          <BlockState isLoading={apptQuery.isLoading} isError={apptQuery.isError} onRetry={apptQuery.refetch}>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={toAppointmentBarData(apptQuery.data)} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                  <XAxis dataKey="status" tick={chartTheme.axisTick} />
                  <YAxis tick={chartTheme.axisTick} />
                  <Tooltip wrapperStyle={chartTheme.tooltip.wrapperStyle} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
                  <Bar dataKey="count" fill={chartTheme.colors.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BlockState>
        </div>
        </PanelErrorBoundary>
        <PanelErrorBoundary title="Top-10 sử dụng thuốc">
        <div className="card lg:col-span-2">
          <SectionTitle>Top-10 sử dụng thuốc</SectionTitle>
          <BlockState isLoading={usageQuery.isLoading} isError={usageQuery.isError} onRetry={usageQuery.refetch}>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(usageQuery.data ?? []).slice().sort((a,b)=> b.qtyTotal - a.qtyTotal).slice(0,10)} layout="vertical" margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                  <XAxis type="number" tick={chartTheme.axisTick} />
                  <YAxis type="category" dataKey="name" width={150} tick={chartTheme.axisTick} />
                  <Tooltip wrapperStyle={chartTheme.tooltip.wrapperStyle} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
                  <Bar dataKey="qtyTotal" fill={chartTheme.colors.primary} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BlockState>
        </div>
        </PanelErrorBoundary>
      </div>

      {/* Row 4: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <PanelErrorBoundary title="Thuốc tồn thấp">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <SectionTitle>Thuốc tồn thấp</SectionTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm">Ngưỡng</span>
              <input className="rounded-md border px-2 py-1 w-20" type="number" value={stockThreshold} onChange={(e)=> setSp((p)=>{ p.set('stockMax', e.target.value || '10'); return p }, { replace:true })} />
            </div>
          </div>
          <BlockState isLoading={lowStockQuery.isLoading} isError={lowStockQuery.isError} onRetry={lowStockQuery.refetch}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="px-3 py-2">Tên</th>
                    <th className="px-3 py-2">Đơn vị</th>
                    <th className="px-3 py-2">Giá</th>
                    <th className="px-3 py-2">Tồn</th>
                    <th className="px-3 py-2">Cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-3 py-2">{m.name}</td>
                      <td className="px-3 py-2">{m.unit?.name ?? '-'}</td>
                      <td className="px-3 py-2">{formatVnd(m.price)}</td>
                      <td className={`px-3 py-2 ${m.quantityInStock <= stockThreshold ? 'text-red-600 font-medium' : ''}`}>{m.quantityInStock}</td>
                      <td className="px-3 py-2">{m.updatedAt ? new Date(m.updatedAt).toLocaleString('vi-VN') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BlockState>
        </div>
        </PanelErrorBoundary>
        <PanelErrorBoundary title="Hoạt động gần đây">
        <div className="card">
          <SectionTitle>Hoạt động gần đây</SectionTitle>
          <BlockState isLoading={auditQuery.isLoading} isError={auditQuery.isError} onRetry={auditQuery.refetch}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="px-3 py-2">Thời gian</th>
                    <th className="px-3 py-2">Bảng</th>
                    <th className="px-3 py-2">Bản ghi</th>
                    <th className="px-3 py-2">Hành động</th>
                    <th className="px-3 py-2">Người dùng</th>
                  </tr>
                </thead>
                <tbody>
                  {(auditQuery.data?.data ?? []).map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2">{new Date(r.changed_at).toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2">{r.table_name}</td>
                      <td className="px-3 py-2">{r.record_id}</td>
                      <td className="px-3 py-2">{r.action}</td>
                      <td className="px-3 py-2">{r.changed_by_user_id ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BlockState>
        </div>
        </PanelErrorBoundary>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 text-right">clinic-fe — {import.meta.env.VITE_APP_VERSION ?? 'dev'} — API {import.meta.env.VITE_API_BASE}</div>
    </div>
  )
}

function KpiCard({ title, value, loading }: { title: string; value: string; loading?: boolean }) {
  return (
    <div className="card" aria-busy={loading} aria-live="polite">
      <div className="text-sm text-slate-600 dark:text-slate-300">{title}</div>
      <div className="text-2xl font-semibold mt-1">{loading ? '…' : value}</div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium mb-2">{children}</h2>
}

function BlockState({ isLoading, isError, onRetry, children }: { isLoading?: boolean; isError?: boolean; onRetry?: () => any; children: React.ReactNode }) {
  if (isLoading) return <div className="h-64 animate-pulse bg-slate-100 dark:bg-slate-800 rounded" />
  if (isError) return <div className="h-64 flex items-center justify-center"><button className="btn" onClick={onRetry}>Thử lại</button></div>
  return <>{children}</>
}

function toIsoDate(d: Date) {
  return d.toISOString().slice(0,10)
}

function formatVnd(v: string | number) {
  const n = typeof v === 'string' ? Number(v) : v
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
  } catch {
    return String(v)
  }
}

function sumByFilter(rows: RevenuePoint[], pred: (r: Date) => boolean) {
  let sum = 0
  for (const r of rows) {
    const dt = new Date(r.day)
    if (pred(dt)) sum += r.total
  }
  return sum
}

function isSameMonth(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

function isSameYear(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear()
}

function useInvoicesCount(status: InvoiceStatus, date: string) {
  const q = useQuery({
    queryKey: ['invoices','countToday', { status, date }],
    queryFn: async () => {
      // Count by paging until exhausted, with a safety cap
      let page = 1
      const limit = 50
      let total = 0
      for (let i = 0; i < 20; i++) {
        const res = await listInvoices({ status, date, page, limit })
        total += res.data.length
        if (res.data.length < limit) break
        page++
      }
      return total
    },
    staleTime: 30_000,
    retry: 0,
  })
  return { count: q.data ?? 0, loading: q.isLoading }
}

function toAppointmentBarData(rec?: Record<string, number>) {
  const statuses = ['waiting','confirmed','checked_in','in_progress','completed','cancelled'] as const
  return statuses.map((s) => ({ status: s, count: Number(rec?.[s] ?? 0) }))
}


