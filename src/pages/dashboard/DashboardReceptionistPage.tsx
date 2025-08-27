import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listAppointments, type Appointment, type AppointmentStatus, updateAppointmentStatus, rescheduleAppointment, assignDoctor, createAppointment, getTodaySummary } from '@/lib/api/appointments'
import { listInvoices, type Invoice, payInvoice, cancelInvoice, refundInvoice } from '@/lib/api/invoices'
import { listPatients, createPatient } from '@/lib/api/patients'
import { listMedicines } from '@/lib/api/medicines'
import { listStaff } from '@/lib/api/staff'
import { toast } from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useChartTheme, PIE_COLORS } from '@/lib/ui/chartTheme'
import PanelErrorBoundary from '@/components/app/PanelErrorBoundary'

type Filters = { date: string; q: string; status: '' | AppointmentStatus; staffId?: number; page: number; limit: number }

export default function DashboardReceptionistPage() {
  const chartTheme = useChartTheme()
  const [sp, setSp] = useSearchParams()
  const today = new Date().toISOString().slice(0, 10)
  const date = sp.get('date') || today
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const q = sp.get('q') || ''
  const status = (sp.get('status') as Filters['status']) || ''
  const staffId = sp.get('staffId') ? Number(sp.get('staffId')) : undefined

  const filters: Filters = useMemo(() => ({ date, q, status, staffId, page, limit }), [date, q, status, staffId, page, limit])

  useEffect(() => {
    setSp((p)=>{ if(!p.get('date')) p.set('date', today); return p }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Queries
  const appts = useQuery<{ data: Appointment[]; total: number }>({
    queryKey: ['appointments', filters],
    queryFn: () => listAppointments({ date: filters.date, q: filters.q || undefined, status: filters.status || undefined, staffId: filters.staffId, page: filters.page, limit: filters.limit }),
    staleTime: 15_000,
  })
  const summary = useQuery<Record<AppointmentStatus, number>>({ queryKey: ['appointments','summary', { date }], queryFn: () => getTodaySummary(date), staleTime: 15_000 })

  const invoicesPending = useQuery<{ data: Invoice[]; total: number }>({ queryKey: ['invoices',{ status: 'pending', date, page: 1, limit: 10 }], queryFn: () => listInvoices({ status: 'pending', date, page: 1, limit: 10 }) })
  const invoicesPaid = useQuery<{ data: Invoice[]; total: number }>({ queryKey: ['invoices',{ status: 'paid', date, page: 1, limit: 10 }], queryFn: () => listInvoices({ status: 'paid', date, page: 1, limit: 10 }) })

  const lowStock = useQuery({ queryKey: ['medicines','lowStock',{ stockMax: 10 }], queryFn: () => listMedicines({ stockMax: 10, page: 1, limit: 100 }), staleTime: 60_000 })

  // Mutations
  const qc = useQueryClient()
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) => updateAppointmentStatus(id, status),
    onSuccess: () => { toast.success('Cập nhật trạng thái thành công'); qc.invalidateQueries({ queryKey: ['appointments'] }); qc.invalidateQueries({ queryKey: ['appointments','summary'] }) },
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Cập nhật thất bại')
  })
  const rescheduleMut = useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) => rescheduleAppointment(id, date),
    onSuccess: () => { toast.success('Dời lịch thành công'); qc.invalidateQueries({ queryKey: ['appointments'] }) },
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Dời lịch thất bại')
  })
  const assignMut = useMutation({
    mutationFn: ({ id, staffId }: { id: number; staffId: number | null }) => assignDoctor(id, staffId),
    onSuccess: () => { toast.success('Gán bác sĩ thành công'); qc.invalidateQueries({ queryKey: ['appointments'] }) },
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Gán bác sĩ thất bại')
  })

  // UI State: modals
  const [createOpen, setCreateOpen] = useState(false)
  const [resModal, setResModal] = useState<{ id: number } | null>(null)
  const [assignModal, setAssignModal] = useState<{ id: number } | null>(null)
  const [payModal, setPayModal] = useState<{ id: number; paymentMethod: 'cash' | 'card' | 'transfer'; notes?: string } | null>(null)
  const [confirm, setConfirm] = useState<{ id: number; action: 'delete' | 'cancel' | 'refund'; reason?: string } | null>(null)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Bảng điều khiển Lễ tân</h1>
        <div className="flex items-center gap-2">
          <input className="rounded-md border px-3 py-2" type="date" value={date} onChange={(e)=> setSp((p)=>{ p.set('date', e.target.value); p.set('page','1'); return p }, { replace:true })} />
          <button className="btn" onClick={()=> setCreateOpen(true)}>Tạo lịch hẹn</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Kpi title="Lịch hẹn" value={String((appts.data?.total ?? 0))} sub={formatStatusLine(summary.data)} loading={appts.isLoading || summary.isLoading} />
        <Kpi title="Hóa đơn (chờ)" value={String(invoicesPending.data?.total ?? 0)} loading={invoicesPending.isLoading} />
        <Kpi title="Hóa đơn (đã trả)" value={String(invoicesPaid.data?.total ?? 0)} loading={invoicesPaid.isLoading} />
        <Kpi title="Tồn thấp (<=10)" value={String(lowStock.data?.data.length ?? 0)} loading={lowStock.isLoading} />
      </div>

      {/* Row 2: Queue & Actions */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
          <input className="rounded-md border px-3 py-2" placeholder="Tìm tên/SĐT" defaultValue={q} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('q', v); else p.delete('q'); p.set('page','1'); return p }, { replace:true })} />
          <select className="rounded-md border px-3 py-2" value={status} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('status', v); else p.delete('status'); p.set('page','1'); return p }, { replace:true })}>
            <option value="">Tất cả trạng thái</option>
            {['waiting','confirmed','checked_in','in_progress','completed','cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <input className="rounded-md border px-3 py-2" type="number" placeholder="Staff ID" defaultValue={staffId ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('staffId', v); else p.delete('staffId'); p.set('page','1'); return p }, { replace:true })} />
          <div className="flex items-center gap-2">
            <span className="text-sm">Hiển thị</span>
            <select className="rounded-md border px-2 py-1" value={limit} onChange={(e)=> setSp((p)=>{ p.set('limit', e.target.value); p.set('page','1'); return p }, { replace:true })}>{[10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}</select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="px-3 py-2">STT</th>
                <th className="px-3 py-2">Bệnh nhân</th>
                <th className="px-3 py-2">SĐT</th>
                <th className="px-3 py-2">Bác sĩ</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Ghi chú</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(appts.data?.data ?? []).map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-3 py-2">{a.orderNumber}</td>
                  <td className="px-3 py-2">{a.patient?.fullName ?? `#${a.patientId}`}</td>
                  <td className="px-3 py-2">{a.patient?.phone ?? '-'}</td>
                  <td className="px-3 py-2">{a.staff?.fullName ?? '-'}</td>
                  <td className="px-3 py-2">
                    <select className="rounded-md border px-2 py-1" defaultValue={a.status} onChange={(e)=> statusMut.mutate({ id: a.id, status: e.target.value as AppointmentStatus })}>
                      {['waiting','confirmed','checked_in','in_progress','completed','cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">{a.notes ?? '-'}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <button className="btn-ghost" onClick={()=> setAssignModal({ id: a.id })}>Gán bác sĩ</button>
                    <button className="btn-ghost" onClick={()=> setResModal({ id: a.id })}>Dời lịch</button>
                    <button className="btn-ghost" onClick={()=> setConfirm({ id: a.id, action: 'delete' })}>Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <InvoicesPanel date={date} kind="pending" onPay={(p)=> setPayModal(p)} onConfirm={(c)=> setConfirm(c)} />
        <InvoicesPanel date={date} kind="paid" onPay={(p)=> setPayModal(p)} onConfirm={(c)=> setConfirm(c)} />
      </div>

      {/* Sidebar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <PanelErrorBoundary title="Phân bố lịch hẹn hôm nay">
        <div className="card">
          <h2 className="text-sm font-medium mb-2">Phân bố lịch hẹn hôm nay</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip wrapperStyle={chartTheme.tooltip.wrapperStyle} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
                <Legend wrapperStyle={chartTheme.legend.wrapperStyle} />
                <Pie dataKey="value" nameKey="name" data={toPie(summary.data)} outerRadius={90} label>
                  {toPie(summary.data).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        </PanelErrorBoundary>
        <PanelErrorBoundary title="Số lượng theo trạng thái">
        <div className="card lg:col-span-2">
          <h2 className="text-sm font-medium mb-2">Số lượng theo trạng thái</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toBar(summary.data)} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} />
                <XAxis dataKey="status" tick={chartTheme.axisTick} />
                <YAxis tick={chartTheme.axisTick} />
                <Tooltip wrapperStyle={chartTheme.tooltip.wrapperStyle} contentStyle={chartTheme.tooltip.contentStyle} labelStyle={chartTheme.tooltip.labelStyle} />
                <Bar dataKey="count" fill={chartTheme.colors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        </PanelErrorBoundary>
      </div>

      {/* Modals */}
      <AppointmentCreateModal open={createOpen} onClose={()=> setCreateOpen(false)} onCreated={()=> qc.invalidateQueries({ queryKey: ['appointments'] })} defaultDate={date} />
      {resModal && <RescheduleModal open onClose={()=> setResModal(null)} onSubmit={(newDate)=> rescheduleMut.mutate({ id: resModal.id, date: newDate })} />}
      {assignModal && <AssignModal open onClose={()=> setAssignModal(null)} onAssign={(sid)=> assignMut.mutate({ id: assignModal.id, staffId: sid })} />}
      {payModal && <PayModal data={payModal} onClose={()=> setPayModal(null)} />}
      {confirm && <ConfirmModal data={confirm} onClose={()=> setConfirm(null)} />}
    </div>
  )
}

function Kpi({ title, value, sub, loading }: { title: string; value: string; sub?: string; loading?: boolean }) {
  return (
    <div className="card" aria-busy={loading} aria-live="polite">
      <div className="text-sm text-slate-600 dark:text-slate-300">{title}</div>
      <div className="text-2xl font-semibold mt-1">{loading ? '…' : value}</div>
      {sub && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

function InvoicesPanel({ date, kind, onPay, onConfirm }: { date: string; kind: 'pending' | 'paid'; onPay: (p: { id: number; paymentMethod: 'cash' | 'card' | 'transfer'; notes?: string }) => void; onConfirm: (c: { id: number; action: 'cancel' | 'refund'; reason?: string }) => void }) {
  const { data, isLoading, isError } = useQuery<{ data: Invoice[]; total: number }>({ queryKey: ['invoices', { status: kind, date, page:1, limit:10 }], queryFn: () => listInvoices({ status: kind, date, page:1, limit:10 }) })
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium">Hóa đơn hôm nay — {kind}</h2>
      </div>
      {isLoading && <div>Đang tải...</div>}
      {isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
      {!isLoading && !isError && (data?.data?.length ?? 0) === 0 && <div>Không có dữ liệu</div>}
      {!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600">
                <th className="px-3 py-2">Mã HĐ</th>
                <th className="px-3 py-2">Tổng</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {data!.data.map((inv) => (
                <tr key={inv.id} className="border-t">
                  <td className="px-3 py-2">#{inv.id}</td>
                  <td className="px-3 py-2">{formatVnd(inv.totalFee)}</td>
                  <td className="px-3 py-2">{inv.status}</td>
                  <td className="px-3 py-2 flex gap-2">
                    {kind === 'pending' ? (
                      <>
                        <button className="btn" onClick={()=> onPay({ id: inv.id, paymentMethod: 'cash' })}>Pay</button>
                        <button className="btn-ghost" onClick={()=> onConfirm({ id: inv.id, action: 'cancel' })}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn-ghost" onClick={()=> onConfirm({ id: inv.id, action: 'refund' })}>Refund</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AppointmentCreateModal({ open, onClose, onCreated, defaultDate }: { open: boolean; onClose: () => void; onCreated: () => void; defaultDate: string }) {
  const [patientQ, setPatientQ] = useState('')
  const [staffQ, setStaffQ] = useState('')
  const patients = useQuery({ queryKey: ['patients',{ q: patientQ }], queryFn: () => listPatients({ q: patientQ, page: 1, limit: 10 }), enabled: patientQ.length > 0 })
  const staff = useQuery({ queryKey: ['staff',{ q: staffQ }], queryFn: () => listStaff({ q: staffQ, page: 1, limit: 10 }), enabled: staffQ.length > 0 })
  const [form, setForm] = useState<{ patientId?: number; appointmentDate: string; staffId?: number; notes?: string }>({ appointmentDate: defaultDate })
  const mut = useMutation({
    mutationFn: () => createAppointment({ patientId: form.patientId!, appointmentDate: form.appointmentDate, staffId: form.staffId || undefined, notes: form.notes?.trim() || undefined }),
    onSuccess: () => { toast.success('Tạo lịch hẹn thành công'); onCreated(); onClose() },
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Tạo lịch hẹn thất bại')
  })
  const [quickPatient, setQuickPatient] = useState(false)
  const createPat = useMutation({
    mutationFn: (p: { fullName: string; gender?: string; birthYear?: number; phone?: string; address?: string }) => createPatient({ fullName: p.fullName, gender: p.gender || 'Khác', birthYear: p.birthYear || new Date().getFullYear(), phone: p.phone || undefined, address: p.address || undefined }),
    onSuccess: (p) => { toast.success('Tạo bệnh nhân thành công'); setForm((f)=> ({ ...f, patientId: p.id })); setQuickPatient(false) },
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Tạo bệnh nhân thất bại')
  })
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title="Tạo lịch hẹn">
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Bệnh nhân</label>
          <input className="w-full rounded-md border px-3 py-2" placeholder="Tìm bệnh nhân..." onChange={(e)=> setPatientQ(e.target.value)} />
          <select className="w-full rounded-md border px-3 py-2 mt-1" value={form.patientId ?? ''} onChange={(e)=> setForm((f)=> ({ ...f, patientId: e.target.value ? Number(e.target.value) : undefined }))}>
            <option value="">-- chọn bệnh nhân --</option>
            {(patients.data?.data ?? []).map((p)=> <option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
          <button className="btn-ghost mt-1" onClick={()=> setQuickPatient(true)}>Tạo bệnh nhân nhanh</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm mb-1">Ngày</label>
            <input className="w-full rounded-md border px-3 py-2" type="date" value={form.appointmentDate} onChange={(e)=> setForm((f)=> ({ ...f, appointmentDate: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Bác sĩ (tuỳ chọn)</label>
            <input className="w-full rounded-md border px-3 py-2" placeholder="Tìm bác sĩ..." onChange={(e)=> setStaffQ(e.target.value)} />
            <select className="w-full rounded-md border px-3 py-2 mt-1" value={form.staffId ?? ''} onChange={(e)=> setForm((f)=> ({ ...f, staffId: e.target.value ? Number(e.target.value) : undefined }))}>
              <option value="">-- chọn bác sĩ --</option>
              {(staff.data?.data ?? []).map((s)=> <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Ghi chú</label>
          <input className="w-full rounded-md border px-3 py-2" value={form.notes ?? ''} onChange={(e)=> setForm((f)=> ({ ...f, notes: e.target.value }))} />
        </div>
        <div className="text-right">
          <button className="btn-ghost" onClick={onClose}>Huỷ</button>
          <button className="btn-primary" onClick={()=> mut.mutate()} disabled={mut.isPending || !form.patientId}>Tạo</button>
        </div>
      </div>

      {quickPatient && (
        <div className="mt-4 border-t pt-3">
          <h3 className="text-sm font-medium mb-2">Tạo bệnh nhân nhanh</h3>
          <QuickPatientForm onCancel={()=> setQuickPatient(false)} onSubmit={(v)=> createPat.mutate(v)} submitting={createPat.isPending} />
        </div>
      )}
    </Modal>
  )
}

function QuickPatientForm({ onCancel, onSubmit, submitting }: { onCancel: () => void; onSubmit: (v: { fullName: string; gender?: string; birthYear?: number; phone?: string; address?: string }) => void; submitting?: boolean }) {
  const [v, setV] = useState<{ fullName: string; gender?: string; birthYear?: number; phone?: string; address?: string }>({ fullName: '' })
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
      <input className="rounded-md border px-3 py-2" placeholder="Họ tên" value={v.fullName} onChange={(e)=> setV((x)=> ({ ...x, fullName: e.target.value }))} />
      <select className="rounded-md border px-3 py-2" value={v.gender ?? ''} onChange={(e)=> setV((x)=> ({ ...x, gender: e.target.value }))}>
        <option value="">Giới tính</option>
        <option value="Nam">Nam</option>
        <option value="Nữ">Nữ</option>
        <option value="Khác">Khác</option>
      </select>
      <input className="rounded-md border px-3 py-2" type="number" placeholder="Năm sinh" value={v.birthYear ?? ''} onChange={(e)=> setV((x)=> ({ ...x, birthYear: Number(e.target.value) }))} />
      <input className="rounded-md border px-3 py-2" placeholder="Điện thoại" value={v.phone ?? ''} onChange={(e)=> setV((x)=> ({ ...x, phone: e.target.value }))} />
      <input className="rounded-md border px-3 py-2" placeholder="Địa chỉ" value={v.address ?? ''} onChange={(e)=> setV((x)=> ({ ...x, address: e.target.value }))} />
      <div className="md:col-span-5 text-right">
        <button className="btn-ghost" onClick={onCancel} disabled={submitting}>Huỷ</button>
        <button className="btn" onClick={()=> onSubmit(v)} disabled={submitting || !v.fullName}>Tạo</button>
      </div>
    </div>
  )
}

function RescheduleModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (date: string) => void }) {
  const [d, setD] = useState('')
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title="Dời lịch">
      <div className="space-y-3">
        <input className="w-full rounded-md border px-3 py-2" type="date" value={d} onChange={(e)=> setD(e.target.value)} />
        <div className="text-right">
          <button className="btn-ghost" onClick={onClose}>Đóng</button>
          <button className="btn" onClick={()=> onSubmit(d)} disabled={!d}>Xác nhận</button>
        </div>
      </div>
    </Modal>
  )
}

function AssignModal({ open, onClose, onAssign }: { open: boolean; onClose: () => void; onAssign: (sid: number | null) => void }) {
  const [q, setQ] = useState('')
  const [sid, setSid] = useState<number | ''>('' as any)
  const staff = useQuery({ queryKey: ['staff',{ q }], queryFn: () => listStaff({ q, page: 1, limit: 10 }), enabled: q.length > 0 })
  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title="Gán bác sĩ">
      <div className="space-y-3">
        <input className="w-full rounded-md border px-3 py-2" placeholder="Tìm bác sĩ..." onChange={(e)=> setQ(e.target.value)} />
        <select className="w-full rounded-md border px-3 py-2" value={sid} onChange={(e)=> setSid(e.target.value ? Number(e.target.value) : '' as any)}>
          <option value="">-- chọn bác sĩ --</option>
          {(staff.data?.data ?? []).map((s)=> <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
        <div className="text-right">
          <button className="btn-ghost" onClick={onClose}>Đóng</button>
          <button className="btn" onClick={()=> onAssign(sid ? Number(sid) : null)} disabled={sid === ''}>Gán</button>
        </div>
      </div>
    </Modal>
  )
}

function PayModal({ data, onClose }: { data: { id: number; paymentMethod: 'cash' | 'card' | 'transfer'; notes?: string }; onClose: () => void }) {
  const [state, setState] = useState(data)
  const qc = useQueryClient()
  const mut = useMutation({
    mutationFn: () => payInvoice(state.id, { paymentMethod: state.paymentMethod, notes: state.notes || undefined }),
    onSuccess: () => { toast.success('Thanh toán thành công'); qc.invalidateQueries({ queryKey: ['invoices'] }); onClose() },
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Thanh toán thất bại')
  })
  return (
    <Modal open onClose={onClose} title="Thanh toán">
      <div className="space-y-3">
        <select className="rounded-md border px-3 py-2" value={state.paymentMethod} onChange={(e)=> setState((s)=> ({ ...s, paymentMethod: e.target.value as any }))}>
          <option value="cash">cash</option>
          <option value="card">card</option>
          <option value="transfer">transfer</option>
        </select>
        <input className="rounded-md border px-3 py-2" placeholder="Ghi chú (tuỳ chọn)" value={state.notes ?? ''} onChange={(e)=> setState((s)=> ({ ...s, notes: e.target.value }))} />
        <div className="text-right">
          <button className="btn-ghost" onClick={onClose} disabled={mut.isPending}>Đóng</button>
          <button className="btn" onClick={()=> mut.mutate()} disabled={mut.isPending}>Xác nhận</button>
        </div>
      </div>
    </Modal>
  )
}

function ConfirmModal({ data, onClose }: { data: { id: number; action: 'delete' | 'cancel' | 'refund'; reason?: string }; onClose: () => void }) {
  const qc = useQueryClient()
  const del = useMutation({
    mutationFn: async () => {
      if (data.action === 'delete') {
        const res = await fetch(`/api/appointments/${data.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
        if (!res.ok) throw new Error('Xoá thất bại')
      }
    },
    onSuccess: () => { toast.success('Thành công'); qc.invalidateQueries({ queryKey: ['appointments'] }); onClose() },
    onError: (e:any)=> toast.error(e?.message || 'Thao tác thất bại')
  })
  const cancel = useMutation({
    mutationFn: async () => {
      if (data.action === 'cancel') await cancelInvoice(data.id, data.reason)
      else if (data.action === 'refund') await refundInvoice(data.id, data.reason)
    },
    onSuccess: () => { toast.success('Thành công'); qc.invalidateQueries({ queryKey: ['invoices'] }); onClose() },
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Thao tác thất bại')
  })
  return (
    <Modal open onClose={onClose} title={data.action === 'delete' ? 'Xoá lịch hẹn' : data.action === 'cancel' ? 'Hủy hóa đơn' : 'Hoàn tiền'}>
      <div className="space-y-3">
        {data.action !== 'delete' && (
          <input className="w-full rounded-md border px-3 py-2" placeholder="Lý do (tuỳ chọn)" onChange={(e)=> (data.reason = e.target.value)} />
        )}
        <div className="text-right">
          <button className="btn-ghost" onClick={onClose} disabled={del.isPending || cancel.isPending}>Đóng</button>
          {data.action === 'delete' ? (
            <button className="btn" onClick={()=> del.mutate()} disabled={del.isPending}>Xác nhận</button>
          ) : (
            <button className="btn" onClick={()=> cancel.mutate()} disabled={cancel.isPending}>Xác nhận</button>
          )}
        </div>
      </div>
    </Modal>
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

function toPie(rec?: Record<string, number>) {
  const names = ['waiting','confirmed','checked_in','in_progress','completed','cancelled']
  return names.map((n) => ({ name: n, value: Number(rec?.[n] ?? 0) }))
}
function toBar(rec?: Record<string, number>) {
  const names = ['waiting','confirmed','checked_in','in_progress','completed','cancelled']
  return names.map((n) => ({ status: n, count: Number(rec?.[n] ?? 0) }))
}

// using PIE_COLORS from chartTheme

function formatStatusLine(rec?: Record<string, number>) {
  if (!rec) return ''
  const parts = [
    `wait ${rec.waiting ?? 0}`,
    `conf ${rec.confirmed ?? 0}`,
    `in ${((rec.checked_in ?? 0) + (rec.in_progress ?? 0))}`,
    `done ${rec.completed ?? 0}`,
    `cancel ${rec.cancelled ?? 0}`,
  ]
  return parts.join(' · ')
}


