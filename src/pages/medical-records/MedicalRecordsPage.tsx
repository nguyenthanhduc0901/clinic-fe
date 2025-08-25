import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listMedicalRecords, type MedicalRecord, getMedicalRecordDetail, exportMedicalRecordPdf } from '@/lib/api/medical-records'
import { listPatients } from '@/lib/api/patients'
import { listStaff } from '@/lib/api/staff'
import Pagination from '@/components/ui/Pagination'
import { useAuthStore } from '@/lib/auth/authStore'
import { toast } from '@/components/ui/Toast'
import { AutocompleteInput } from '@/components/ui/AutocompleteInput'

export default function MedicalRecordsPage() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const status = sp.get('status') || ''
  const dateFrom = sp.get('dateFrom') || ''
  const dateTo = sp.get('dateTo') || ''
  const patientId = sp.get('patientId')
  const doctorIdSp = sp.get('doctorId')

  const { user } = useAuthStore()
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
        {isLoading && <div>Đang tải...</div>}
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
                  <th className="px-3 py-2">Actions</th>
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
                      <button className="btn-ghost" onClick={() => setDetailId(r.id)}>Chi tiết</button>
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailId(null)} />
          <div className="relative z-10 w-full max-w-3xl rounded-lg bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium">Chi tiết hồ sơ #{detail.data.medicalRecord.id}</h2>
              <button className="btn-ghost" onClick={() => setDetailId(null)}>Đóng</button>
            </div>
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
                  </tr>
                </thead>
                <tbody>
                  {detail.data.prescriptions.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">{p.medicineName ?? '-'}</td>
                      <td className="px-3 py-2">{p.quantity}</td>
                      <td className="px-3 py-2">{p.usageInstruction ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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



