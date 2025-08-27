import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listMedicalRecords, type MedicalRecord, getMedicalRecordDetail, exportMedicalRecordPdf } from '@/lib/api/medical-records'
import { listPatients } from '@/lib/api/patients'
import { listStaff } from '@/lib/api/staff'
import { listMedicines } from '@/lib/api/medicines'
import { getCatalogs } from '@/lib/api/catalogs'
import Pagination from '@/components/ui/Pagination'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'
// toast already imported above
import { AutocompleteInput } from '@/components/ui/AutocompleteInput'
import AttachmentsPanel from '@/pages/medical-records/components/AttachmentsPanel'
import MRUpdateModal from '@/pages/medical-records/components/MRUpdateModal'

export default function MedicalRecordsPage() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const status = sp.get('status') || ''
  const dateFrom = sp.get('dateFrom') || ''
  const dateTo = sp.get('dateTo') || ''
  const patientId = sp.get('patientId')
  const doctorIdSp = sp.get('doctorId')

  const { user, permissions } = useAuthStore()
  const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
  const defaultDoctorId = (user as any)?.staff?.id as number | undefined
  const doctorId = doctorIdSp ? Number(doctorIdSp) : defaultDoctorId

  const params = useMemo(
    () => ({ page, limit, status: (status || undefined) as any, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, patientId: patientId ? Number(patientId) : undefined, doctorId }),
    [page, limit, status, dateFrom, dateTo, patientId, doctorId],
  )

  const { data, isLoading, isError } = useQuery<{ data: MedicalRecord[]; total: number }>({
    queryKey: ['medical-records', params],
    queryFn: () => listMedicalRecords(params),
  })

  const [detailId, setDetailId] = useState<number | null>(null)
  const detail = useQuery({
    queryKey: ['medical-record', detailId],
    enabled: detailId != null,
    queryFn: () => getMedicalRecordDetail(detailId!),
  })
  function MRUpdateInline({ record, onUpdated }: { record: any; onUpdated: () => void }) {
    const [open, setOpen] = useState(false)
    return (
      <div className="text-right">
        <button className="btn-ghost" onClick={()=> setOpen(true)}>Sửa hồ sơ</button>
        <MRUpdateModal id={record.id} initial={record} open={open} onClose={()=> setOpen(false)} onUpdated={onUpdated} />
      </div>
    )
  }

  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))

  function changePage(p: number) {
    setSp((prev) => { prev.set('page', String(p)); return prev }, { replace: true })
  }
  function changeLimit(l: number) {
    setSp((prev) => { prev.set('limit', String(l)); prev.set('page', '1'); return prev }, { replace: true })
  }

  async function onExport(id: number) {
    try {
      const blob = await exportMedicalRecordPdf(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `medical-record-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error(e?.message || 'Xuất PDF thất bại')
    }
  }

  return (
    <div className="space-y-3">
      <h1 className="page-title">Hồ sơ khám bệnh</h1>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <AutocompleteInput
            label="Bệnh nhân"
            placeholder="Chọn bệnh nhân..."
            value={patientId ? Number(patientId) : undefined}
            onChange={(value) => setSp((p) => {
              if (value) p.set('patientId', String(value))
              else p.delete('patientId')
              p.set('page', '1')
              return p
            }, { replace: true })}
            fetchOptions={listPatients}
            queryKey={['patients', 'autocomplete']}
            mapOption={(item) => ({ id: item.id, fullName: item.fullName })}
          />

          <AutocompleteInput
            label="Bác sĩ"
            placeholder="Chọn bác sĩ..."
            value={doctorId}
            onChange={(value) => setSp((p) => {
              if (value) p.set('doctorId', String(value))
              else p.delete('doctorId')
              p.set('page', '1')
              return p
            }, { replace: true })}
            fetchOptions={listStaff}
            queryKey={['staff', 'autocomplete']}
            mapOption={(item) => ({ id: item.id, fullName: item.fullName })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Từ ngày
            </label>
            <input 
              className="rounded-md border px-3 py-2 w-full" 
              type="date" 
              value={dateFrom} 
              onChange={(e) => setSp((p) => {
                const v = e.target.value
                if (v) p.set('dateFrom', v)
                else p.delete('dateFrom')
                p.set('page', '1')
                return p
              }, { replace: true })} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Đến ngày
            </label>
            <input 
              className="rounded-md border px-3 py-2 w-full" 
              type="date" 
              value={dateTo} 
              onChange={(e) => setSp((p) => {
                const v = e.target.value
                if (v) p.set('dateTo', v)
                else p.delete('dateTo')
                p.set('page', '1')
                return p
              }, { replace: true })} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trạng thái
            </label>
            <select 
              className="rounded-md border px-3 py-2 w-full" 
              value={status} 
              onChange={(e) => setSp((p) => {
                const v = e.target.value
                if (v) p.set('status', v)
                else p.delete('status')
                p.set('page', '1')
                return p
              }, { replace: true })}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="flex items-center gap-2">
              <span className="text-sm">Hiển thị</span>
              <select 
                className="rounded-md border px-2 py-1" 
                value={limit} 
                onChange={(e) => changeLimit(Number(e.target.value))}
              >
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading && <SkeletonTable rows={6} />}
        {isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
        {!isLoading && !isError && (data?.data?.length ?? 0) === 0 && <div>Không có dữ liệu</div>}
        {!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">Mã</th>
                  <th className="px-3 py-2">Ngày khám</th>
                  <th className="px-3 py-2">Bệnh nhân</th>
                  <th className="px-3 py-2">Bác sĩ</th>
                  <th className="px-3 py-2">Chẩn đoán</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="px-3 py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data!.data.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.id}</td>
                    <td className="px-3 py-2">{new Date(r.examinationDate).toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-2">{r.patient?.fullName ?? '-'}</td>
                    <td className="px-3 py-2">{r.doctor?.fullName ?? '-'}</td>
                    <td className="px-3 py-2">{r.diagnosis ?? '-'}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${statusColor(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-3 py-2 flex gap-2">
                      <button className="btn-ghost" onClick={() => { setDetailId(r.id); setSp((p)=> { p.set('recordId', String(r.id)); return p }, { replace: true }) }}>Chi tiết</button>
                      <button className="btn-ghost" onClick={() => onExport(r.id)}>Xuất PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageCount={pageCount} onPageChange={changePage} />
        </div>
      </div>

      {/* Detail modal */}
      {detailId != null && detail.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setDetailId(null); setSp((p)=> { p.delete('recordId'); return p }, { replace: true }) }} />
          <div className="relative z-10 w-full max-w-5xl rounded-lg bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium">Chi tiết hồ sơ #{detail.data.medicalRecord.id}</h2>
              <button className="btn-ghost" onClick={() => { setDetailId(null); setSp((p)=> { p.delete('recordId'); return p }, { replace: true }) }}>Đóng</button>
            </div>
            {can(perms, ['medical_record:update']) && <MRUpdateInline record={detail.data.medicalRecord} onUpdated={()=> detail.refetch()} />}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><strong>Bệnh nhân:</strong> {detail.data.medicalRecord.patient?.fullName ?? '-'}</div>
              <div><strong>Bác sĩ:</strong> {detail.data.medicalRecord.doctor?.fullName ?? '-'}</div>
              <div><strong>Ngày khám:</strong> {new Date(detail.data.medicalRecord.examinationDate).toLocaleString('vi-VN')}</div>
              <div><strong>Chẩn đoán:</strong> {detail.data.medicalRecord.diagnosis ?? '-'}</div>
              <div className="col-span-2"><strong>Triệu chứng:</strong> {detail.data.medicalRecord.symptoms ?? '-'}</div>
              <div className="col-span-2"><strong>Ghi chú:</strong> {detail.data.medicalRecord.notes ?? '-'}</div>
            </div>
            <h3 className="mt-3 font-medium">Đơn thuốc</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="px-3 py-2">Thuốc</th>
                    <th className="px-3 py-2">SL</th>
                    <th className="px-3 py-2">Cách dùng</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.data.prescriptions.map((p) => (
                    <PrescriptionRow key={p.id} recordId={detail.data.medicalRecord.id} p={p} canEdit={can(perms, ['medical_record:update']) || can(perms, ['prescription:*']) || can(perms, ['prescription:update']) || can(perms, ['prescription:delete'])} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2">
              <AddPrescriptionRow recordId={detail.data.medicalRecord.id} canEdit={can(perms, ['medical_record:update']) || can(perms, ['prescription:*']) || can(perms, ['prescription:create'])} />
            </div>
            <div className="mt-4">
              <AttachmentsPanel recordId={detail.data.medicalRecord.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function statusColor(status?: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-600 text-white'
    case 'cancelled':
      return 'bg-red-600 text-white'
    default:
      return 'bg-amber-500 text-white'
  }
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addPrescription, removePrescription, updatePrescription, getPrescription } from '@/lib/api/medical-records'
import { toast } from '@/components/ui/Toast'

function PrescriptionRow({ recordId, p, canEdit }: { recordId: number; p: any; canEdit: boolean }) {
  const qc = useQueryClient()
  const updateMut = useMutation({ mutationFn: (payload: any) => updatePrescription(recordId, p.id, payload), onSuccess: () => { toast.success('Cập nhật đơn thuốc'); qc.invalidateQueries({ queryKey: ['medical-record', recordId] }) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi cập nhật') })
  const delMut = useMutation({ mutationFn: () => removePrescription(recordId, p.id), onSuccess: () => { toast.success('Xoá đơn thuốc'); qc.invalidateQueries({ queryKey: ['medical-record', recordId] }) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi xoá') })
  const [detailOpen, setDetailOpen] = useState(false)
  const detail = useQuery<{ data: any }>({ queryKey: ['prescription', p.id], enabled: detailOpen, queryFn: async ()=> ({ data: await getPrescription(recordId, p.id) }) })
  return (
    <tr className="border-t">
      <td className="px-3 py-2">{p.medicineName ?? '-'}</td>
      <td className="px-3 py-2">
        <input className="w-20 rounded-md border px-2 py-1" defaultValue={p.quantity} onBlur={(e)=> {
          const q = Number(e.target.value)
          if (!Number.isNaN(q) && q !== p.quantity) updateMut.mutate({ quantity: q })
        }} disabled={!canEdit} />
      </td>
      <td className="px-3 py-2">{p.usageInstruction ?? '-'}</td>
      <td className="px-3 py-2 flex gap-2">
        <button className="btn-ghost" onClick={()=> setDetailOpen(true)}>Chi tiết</button>
        <button className="btn-ghost" onClick={()=> delMut.mutate()} disabled={delMut.isPending || !canEdit}>Xoá</button>
        {detailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={()=> setDetailOpen(false)} />
            <div className="relative z-10 w-full max-w-md rounded-lg bg-white dark:bg-slate-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Chi tiết đơn thuốc #{p.id}</h4>
                <button className="btn-ghost" onClick={()=> setDetailOpen(false)}>Đóng</button>
              </div>
              {detail.isLoading && <div>Đang tải...</div>}
              {detail.isError && <div className="text-danger">Tải chi tiết thất bại</div>}
              {!detail.isLoading && !detail.isError && detail.data && (
                <div className="space-y-1 text-sm">
                  <div><strong>medicineId:</strong> {detail.data.data.medicineId}</div>
                  <div><strong>quantity:</strong> {detail.data.data.quantity}</div>
                  <div><strong>usageInstructionId:</strong> {detail.data.data.usageInstructionId}</div>
                  <div><strong>notes:</strong> {detail.data.data.notes ?? '-'}</div>
                  <div><strong>createdAt:</strong> {detail.data.data.createdAt ?? '-'}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </td>
    </tr>
  )
}

function AddPrescriptionRow({ recordId, canEdit }: { recordId: number; canEdit: boolean }) {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const meds = useQuery({ queryKey: ['meds-autocomplete', q], queryFn: () => listMedicines({ q, page: 1, limit: 10 }), enabled: q.length > 0 })
  const catalogs = useQuery({ queryKey: ['catalogs'], queryFn: () => getCatalogs(), staleTime: 10 * 60 * 1000 })
  const [form, setForm] = useState<{ medicineId?: number; quantity?: number; usageInstructionId?: number; notes?: string }>({})
  const addMut = useMutation({ 
    mutationFn: () => addPrescription(recordId, { 
      medicineId: form.medicineId!, 
      quantity: form.quantity!, 
      usageInstructionId: form.usageInstructionId!, 
      notes: form.notes?.trim() || undefined 
    }), 
    onSuccess: () => { toast.success('Thêm đơn thuốc'); qc.invalidateQueries({ queryKey: ['medical-record', recordId] }); setForm({}); setQ('') }, 
    onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi thêm') 
  })
  const isReady = !!form.medicineId && !!form.quantity && form.quantity! > 0 && Number.isInteger(form.quantity!) && !!form.usageInstructionId
  return (
    <div className="grid grid-cols-4 gap-2">
      <div>
        <input className="w-full rounded-md border px-3 py-2" placeholder="Tìm thuốc..." value={q} onChange={(e)=> setQ(e.target.value)} disabled={!canEdit} />
        <select className="w-full rounded-md border px-3 py-2 mt-1" value={form.medicineId || ''} onChange={(e)=> setForm((f)=> ({ ...f, medicineId: e.target.value ? Number(e.target.value) : undefined }))} disabled={!canEdit}>
          <option value="">-- chọn thuốc --</option>
          {(meds.data?.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div>
        <input className="w-full rounded-md border px-3 py-2" type="number" placeholder="Số lượng" value={form.quantity ?? ''} onChange={(e)=> setForm((f)=> ({ ...f, quantity: e.target.value ? Number(e.target.value) : undefined }))} disabled={!canEdit} />
      </div>
      <div>
        <select className="w-full rounded-md border px-3 py-2" value={form.usageInstructionId || ''} onChange={(e)=> setForm((f)=> ({ ...f, usageInstructionId: e.target.value ? Number(e.target.value) : undefined }))} disabled={!canEdit}>
          <option value="">-- hướng dẫn sử dụng --</option>
          {(catalogs.data?.usageInstructions ?? []).map((u) => <option key={u.id} value={u.id}>{u.instruction}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <input className="w-full rounded-md border px-3 py-2" placeholder="Ghi chú" value={form.notes ?? ''} onChange={(e)=> setForm((f)=> ({ ...f, notes: e.target.value }))} disabled={!canEdit} />
        <button className="btn" onClick={()=> addMut.mutate()} disabled={addMut.isPending || !isReady || !canEdit}>Thêm dòng</button>
      </div>
    </div>
  )
}
