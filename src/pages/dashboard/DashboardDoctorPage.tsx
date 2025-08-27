import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listAppointments, type Appointment, type AppointmentStatus, updateAppointmentStatus, rescheduleAppointment } from '@/lib/api/appointments'
import { getMedicineUsage, mapMedicineUsageRow } from '@/lib/api/reports'
import { useAuthStore } from '@/lib/auth/authStore'
import { listMedicalRecords, getMedicalRecordDetail, addPrescription, updatePrescription, removePrescription, type MedicalRecord, type Prescription } from '@/lib/api/medical-records'
import { listMedicines } from '@/lib/api/medicines'
import CreateMedicalRecordModal from '@/pages/medical-records/components/CreateMedicalRecordModal'
import Modal from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function DashboardDoctorPage() {
  const { permissions, user } = useAuthStore()
  const perms = (permissions.length ? permissions : (user?.role?.permissions?.map((p: any) => p.name) ?? [])) as string[]
  const hasReportView = perms.includes('report:view')
  const [sp, setSp] = useSearchParams()
  const today = new Date().toISOString().slice(0,10)
  const date = sp.get('date') || today
  const view = (sp.get('view') as 'day' | 'week') || 'day'
  const staffId = sp.get('staffId') ? Number(sp.get('staffId')) : undefined

  useEffect(() => {
    setSp((p)=>{ if(!p.get('date')) p.set('date', today); if(!p.get('view')) p.set('view','day'); return p }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Appointments today for schedule/queue
  const apptFilters = useMemo(() => ({ date, staffId, page: 1, limit: 50 }), [date, staffId])
  const appts = useQuery<{ data: Appointment[]; total: number }>({ queryKey: ['appointments', apptFilters], queryFn: () => listAppointments(apptFilters as any), staleTime: 15_000 })

  // Recent medical records (last 14 days)
  const fourteenDaysAgo = toIsoDate(new Date(Date.now() - 13*86400000))
  const mrParams = useMemo(() => ({ doctorId: staffId, dateFrom: fourteenDaysAgo, dateTo: date, page: 1, limit: 20 }), [staffId, fourteenDaysAgo, date])
  const mrs = useQuery<{ data: MedicalRecord[]; total: number }>({ queryKey: ['medical-records', mrParams], queryFn: () => listMedicalRecords(mrParams as any), staleTime: 30_000 })

  // Prescription lines today via reports (approximation)
  const usage = useQuery({ queryKey: ['reports','usage',{ from: date, to: date }], queryFn: async () => (await getMedicineUsage({ from: date, to: date })).map(mapMedicineUsageRow), staleTime: 60_000, enabled: hasReportView })

  // 14-day MR trend (count via 1 query/day using totals)
  const trend = useQuery({
    queryKey: ['mr-trend',{ end: date, staffId }],
    queryFn: async () => {
      const points: Array<{ day: string; count: number }> = []
      for (let i=13;i>=0;i--) {
        const d = toIsoDate(new Date(new Date(date).getTime() - i*86400000))
        const res = await listMedicalRecords({ doctorId: staffId, dateFrom: d, dateTo: d, page: 1, limit: 1 } as any)
        points.push({ day: d, count: res.total ?? (res as any).data?.length ?? 0 })
      }
      return points
    },
    staleTime: 60_000,
  })

  // Mutations
  const qc = useQueryClient()
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) => updateAppointmentStatus(id, status),
    onSuccess: () => { toast.success('Cập nhật trạng thái'); qc.invalidateQueries({ queryKey: ['appointments'] }) },
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi cập nhật')
  })
  const resMut = useMutation({
    mutationFn: ({ id, newDate }: { id: number; newDate: string }) => rescheduleAppointment(id, newDate),
    onSuccess: () => { toast.success('Đã dời lịch'); qc.invalidateQueries({ queryKey: ['appointments'] }) },
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Dời lịch thất bại')
  })

  // UI state
  const [reschedule, setReschedule] = useState<{ id: number } | null>(null)
  const [createMR, setCreateMR] = useState<{ appointmentId: number } | null>(null)
  const [mrDetail, setMrDetail] = useState<{ id: number } | null>(null)
  const [quickAppt, setQuickAppt] = useState<{ patientId: number; date: string } | null>(null)

  const reExamList = useMemo(() => {
    const all = mrs.data?.data ?? []
    const start = new Date(date)
    const end = new Date(new Date(date).getTime() + 7*86400000)
    return all.filter((r) => r.reExaminationDate && inRange(new Date(r.reExaminationDate!), start, end))
  }, [mrs.data, date])

  const kpiAppointments = appts.data?.total ?? 0
  const kpiCompletedToday = (awaitableZero(mrs.data?.data.filter(r=> r.status==='completed' && sameDay(r.examinationDate, date)).length))
  const kpiReexamToday = (awaitableZero(reExamList.filter(r=> sameDay(r.reExaminationDate!, date)).length))
  const kpiPrescriptionLines = (usage.data ?? []).reduce((a:any,b:any)=> a + (b.times ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Bảng điều khiển Bác sĩ</h1>
        <div className="flex items-center gap-2">
          <input className="rounded-md border px-3 py-2" type="date" value={date} onChange={(e)=> setSp((p)=>{ p.set('date', e.target.value); return p }, { replace:true })} />
          <select className="rounded-md border px-3 py-2" value={view} onChange={(e)=> setSp((p)=>{ p.set('view', e.target.value); return p }, { replace:true })}>
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
          </select>
          <input className="rounded-md border px-3 py-2 w-36" type="number" placeholder="Staff ID (tuỳ)" defaultValue={staffId ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('staffId', v); else p.delete('staffId'); return p }, { replace:true })} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Kpi title="Lịch hẹn hôm nay" value={String(kpiAppointments)} sub="waiting / in_progress / completed" />
        <Kpi title="Bệnh án hoàn tất hôm nay" value={String(kpiCompletedToday)} />
        <Kpi title="Tái khám hôm nay" value={String(kpiReexamToday)} />
        <Kpi title="Đơn thuốc đã kê (lines)" value={String(kpiPrescriptionLines)} />
      </div>

      {/* Schedule & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card">
          <h2 className="text-sm font-medium mb-2">Lịch hôm nay</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">Giờ</th>
                  <th className="px-3 py-2">Bệnh nhân</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="px-3 py-2">Ghi chú</th>
                  <th className="px-3 py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(appts.data?.data ?? []).map((a)=> (
                  <tr key={a.id} className="border-t">
                    <td className="px-3 py-2">{a.appointmentDate ? new Date(a.appointmentDate).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'}) : '-'}</td>
                    <td className="px-3 py-2">{a.patient?.fullName ?? `#${a.patientId}`}</td>
                    <td className="px-3 py-2">
                      <select className="rounded-md border px-2 py-1" defaultValue={a.status} onChange={(e)=> statusMut.mutate({ id: a.id, status: e.target.value as AppointmentStatus })}>
                        {['waiting','confirmed','checked_in','in_progress','completed','cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2">{a.notes ?? '-'}</td>
                    <td className="px-3 py-2 flex gap-2">
                      <button className="btn-ghost" onClick={()=> setReschedule({ id: a.id })}>Dời</button>
                      <button className="btn" onClick={()=> setCreateMR({ appointmentId: a.id })}>Tạo bệnh án</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h2 className="text-sm font-medium mb-2">Bệnh án gần đây</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">Ngày</th>
                  <th className="px-3 py-2">Bệnh nhân</th>
                  <th className="px-3 py-2">Chẩn đoán</th>
                  <th className="px-3 py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(mrs.data?.data ?? []).map((r)=> (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{new Date(r.examinationDate).toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-2">{r.patient?.fullName ?? `#${r.patientId}`}</td>
                    <td className="px-3 py-2">{r.diagnosis ?? '-'}</td>
                    <td className="px-3 py-2"><button className="btn-ghost" onClick={()=> setMrDetail({ id: r.id })}>Chi tiết</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Re-exam & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card">
          <h2 className="text-sm font-medium mb-2">Tái khám (7 ngày tới)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">Ngày tái khám</th>
                  <th className="px-3 py-2">Bệnh nhân</th>
                  <th className="px-3 py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reExamList.map((r)=> (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.reExaminationDate ? new Date(r.reExaminationDate).toLocaleDateString('vi-VN') : '-'}</td>
                    <td className="px-3 py-2">{r.patient?.fullName ?? `#${r.patientId}`}</td>
                    <td className="px-3 py-2"><button className="btn" onClick={()=> setQuickAppt({ patientId: r.patientId, date: r.reExaminationDate! })}>Đặt lịch</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h2 className="text-sm font-medium mb-2">Bệnh án 14 ngày</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend.data ?? []} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#2c7be5" fill="#2c7be5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modals/Drawers */}
      {reschedule && <RescheduleModal open onClose={()=> setReschedule(null)} onSubmit={(newDate)=> resMut.mutate({ id: reschedule.id, newDate })} />}
      {createMR && <CreateMRModal open onClose={()=> setCreateMR(null)} appointmentId={createMR.appointmentId} />}
      {mrDetail && <MedicalRecordDrawer id={mrDetail.id} onClose={()=> setMrDetail(null)} />}
      {quickAppt && <QuickAppointmentModal initial={quickAppt} onClose={()=> setQuickAppt(null)} />}
    </div>
  )
}

function Kpi({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-600 dark:text-slate-300">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

function RescheduleModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (d: string) => void }) {
  const [d, setD] = useState('')
  if (!open) return null
  return (
    <Modal open onClose={onClose} title="Dời lịch">
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

function CreateMRModal({ open, onClose, appointmentId }: { open: boolean; onClose: () => void; appointmentId: number }) {
  if (!open) return null
  return <CreateMedicalRecordModal open onClose={onClose} appointmentId={appointmentId} />
}

function MedicalRecordDrawer({ id, onClose }: { id: number; onClose: () => void }) {
  const detail = useQuery({ queryKey: ['mr-detail', id], queryFn: () => getMedicalRecordDetail(id), enabled: id != null })
  const qc = useQueryClient()
  const addMut = useMutation({
    mutationFn: (p: { medicineId: number; quantity: number; usageInstructionId: number; notes?: string }) => addPrescription(id, p),
    onSuccess: () => { toast.success('Đã thêm thuốc'); qc.invalidateQueries({ queryKey: ['mr-detail', id] }) },
  })
  const updMut = useMutation({
    mutationFn: (p: { prescriptionId: number; changes: Partial<Prescription> }) => updatePrescription(id, p.prescriptionId, p.changes as any),
    onSuccess: () => { toast.success('Đã cập nhật'); qc.invalidateQueries({ queryKey: ['mr-detail', id] }) },
  })
  const delMut = useMutation({
    mutationFn: (pid: number) => removePrescription(id, pid),
    onSuccess: () => { toast.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['mr-detail', id] }) },
  })
  const [q, setQ] = useState('')
  const meds = useQuery({ queryKey: ['medicines',{ q }], queryFn: () => listMedicines({ q, page:1, limit:10 }), enabled: q.length > 0 })
  if (!detail.data) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 ml-auto h-full w-full max-w-3xl bg-white dark:bg-slate-900 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Hồ sơ #{id}</h2>
          <button className="btn-ghost" onClick={onClose}>Đóng</button>
        </div>
        <div className="text-sm grid grid-cols-2 gap-2">
          <div><strong>Ngày:</strong> {new Date(detail.data.medicalRecord.examinationDate).toLocaleString('vi-VN')}</div>
          <div><strong>Bệnh nhân:</strong> {detail.data.medicalRecord.patient?.fullName ?? `#${detail.data.medicalRecord.patientId}`}</div>
          <div className="col-span-2"><strong>Chẩn đoán:</strong> {detail.data.medicalRecord.diagnosis ?? '-'}</div>
        </div>
        <h3 className="mt-3 font-medium">Đơn thuốc</h3>
        <div className="space-y-2">
          {(detail.data.prescriptions ?? []).map((p) => (
            <div key={p.id} className="grid grid-cols-5 gap-2 items-center">
              <div className="col-span-2">#{p.id}</div>
              <input className="rounded-md border px-2 py-1" type="number" defaultValue={p.quantity} onBlur={(e)=> updMut.mutate({ prescriptionId: p.id, changes: { quantity: Number(e.target.value) } as any })} />
              <input className="rounded-md border px-2 py-1" placeholder="Ghi chú" defaultValue={p.notes ?? ''} onBlur={(e)=> updMut.mutate({ prescriptionId: p.id, changes: { notes: e.target.value } as any })} />
              <button className="btn-ghost" onClick={()=> delMut.mutate(p.id)}>Xóa</button>
            </div>
          ))}
          <div className="grid grid-cols-5 gap-2 items-center">
            <div className="col-span-2">
              <input className="w-full rounded-md border px-2 py-1" placeholder="Tìm thuốc" onChange={(e)=> setQ(e.target.value)} />
              <select className="w-full rounded-md border px-2 py-1 mt-1" id="new-med">
                <option value="">-- chọn thuốc --</option>
                {(meds.data?.data ?? []).map((m)=> <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <input className="rounded-md border px-2 py-1" id="new-qty" type="number" placeholder="SL" />
            <input className="rounded-md border px-2 py-1" id="new-usage" type="number" placeholder="UsageId" />
            <button className="btn" onClick={()=> {
              const med = (document.getElementById('new-med') as HTMLSelectElement).value
              const qty = Number((document.getElementById('new-qty') as HTMLInputElement).value)
              const usageId = Number((document.getElementById('new-usage') as HTMLInputElement).value)
              if (!med || !qty || !usageId) { toast.error('Thiếu thông tin'); return }
              addMut.mutate({ medicineId: Number(med), quantity: qty, usageInstructionId: usageId })
            }}>Thêm</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAppointmentModal({ initial, onClose }: { initial: { patientId: number; date: string }; onClose: () => void }) {
  const qc = useQueryClient()
  const [notes, setNotes] = useState('')
  const [staffId, setStaffId] = useState<number | ''>('' as any)
  const mut = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId: initial.patientId, appointmentDate: initial.date, staffId: staffId || undefined, notes: notes || undefined }) })
      if (!res.ok) throw new Error('Tạo lịch hẹn thất bại')
      return res.json()
    },
    onSuccess: () => { toast.success('Đã đặt lịch tái khám'); qc.invalidateQueries({ queryKey: ['appointments'] }); onClose() },
    onError: (e:any)=> toast.error(e?.message || 'Lỗi tạo lịch')
  })
  return (
    <Modal open onClose={onClose} title="Đặt lịch tái khám">
      <div className="space-y-3">
        <div>Ngày: <strong>{new Date(initial.date).toLocaleDateString('vi-VN')}</strong></div>
        <input className="w-full rounded-md border px-3 py-2" type="number" placeholder="Staff ID (tuỳ chọn)" value={staffId as any} onChange={(e)=> setStaffId(e.target.value ? Number(e.target.value) : '' as any)} />
        <input className="w-full rounded-md border px-3 py-2" placeholder="Ghi chú (tuỳ chọn)" value={notes} onChange={(e)=> setNotes(e.target.value)} />
        <div className="text-right">
          <button className="btn-ghost" onClick={onClose} disabled={mut.isPending}>Đóng</button>
          <button className="btn" onClick={()=> mut.mutate()} disabled={mut.isPending}>Xác nhận</button>
        </div>
      </div>
    </Modal>
  )
}

function inRange(d: Date, start: Date, end: Date) {
  return d.getTime() >= new Date(start.toDateString()).getTime() && d.getTime() <= new Date(end.toDateString()).getTime()
}
function sameDay(a: string | Date, dayStr: string) {
  const d = new Date(a)
  const target = new Date(dayStr)
  return d.getFullYear()===target.getFullYear() && d.getMonth()===target.getMonth() && d.getDate()===target.getDate()
}
function toIsoDate(d: Date) { return d.toISOString().slice(0,10) }
function awaitableZero(v: number | undefined) { return v ?? 0 }


