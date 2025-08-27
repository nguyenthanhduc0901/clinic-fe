import { useQuery } from '@tanstack/react-query'
import { listPatients, type Patient } from '@/lib/api/patients'
import { useState, useMemo } from 'react'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import Pagination from '@/components/ui/Pagination'
import { useSearchParams } from 'react-router-dom'
import PatientCreateModal from '@/pages/patients/PatientCreateModal'
import { deletePatient, getPatientMedicalHistory } from '@/lib/api/patients'
import { useMutation, useQuery as useQuery2, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/Toast'
//
import PatientEditModal from '@/pages/patients/PatientEditModal'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'
import { FormField, Input, Select } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function PatientsPage() {
  const [sp, setSp] = useSearchParams()
  const pageParam = Number(sp.get('page') || '1')
  const limitParam = Number(sp.get('limit') || '10')
  const qParam = sp.get('q') || ''

  const [q, setQ] = useState(qParam)
  const debouncedQ = useDebouncedValue(q, 350)
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<{ id: number | null }>({ id: null })
  const { permissions } = useAuthStore()
  const perms = permissions

  const params = useMemo(() => ({ page: pageParam, limit: limitParam, q: debouncedQ || undefined }), [pageParam, limitParam, debouncedQ])
  const { data, isLoading, isError } = useQuery<{ data: Patient[]; total: number }>({
    queryKey: ['patients', params],
    queryFn: () => listPatients(params),
  })

  // debounce 400ms: simple approach using useEffect + timeout
  const [timer, setTimer] = useState<number | null>(null)
  function applySearch(nextQ: string) {
    setQ(nextQ)
    if (timer) window.clearTimeout(timer)
    const t = window.setTimeout(() => {
      setSp((prev) => {
        if (nextQ) prev.set('q', nextQ); else prev.delete('q')
        prev.set('page', '1')
        return prev
      }, { replace: true })
    }, 400)
    setTimer(t)
  }

  function changePage(p: number) {
    setSp((prev) => { prev.set('page', String(p)); return prev }, { replace: true })
  }
  function changeLimit(l: number) {
    setSp((prev) => { prev.set('limit', String(l)); prev.set('page', '1'); return prev }, { replace: true })
  }

  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / (limitParam || 10)))
  const rows = data?.data ?? []

  const canCreate = can(perms, ['patient:create'])
  const canEdit = can(perms, ['patient:update'])
  const canDelete = can(perms, ['patient:delete'])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Bệnh nhân</h1>
        {canCreate && (
          <button className="btn-primary" onClick={() => setOpen(true)}>Thêm bệnh nhân</button>
        )}
      </div>
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <FormField id="q" label="Tìm tên/SĐT">
            <Input id="q" placeholder="Nhập tên hoặc SĐT" value={q} onChange={(e)=> applySearch(e.target.value)} />
          </FormField>
          <div className="flex items-end gap-2">
            <Button variant="ghost" onClick={()=> applySearch('')}>Xoá</Button>
          </div>
          <div className="ml-auto flex items-end gap-2">
            <span className="text-sm">Hiển thị</span>
            <Select aria-label="Số dòng mỗi trang" value={String(limitParam)} onChange={(e)=> changeLimit(Number(e.target.value))}>
              {[10,20,50].map((n)=> <option key={n} value={n}>{n}</option>)}
            </Select>
          </div>
        </div>
      </div>
      <div className="card">
        {isLoading && <SkeletonTable rows={6} />}
        {isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
        {!isLoading && !isError && rows.length === 0 && <div>Không có dữ liệu</div>}
        {!isLoading && !isError && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-neutral-900 z-[1]">
                <tr className="text-left text-neutral-600 dark:text-neutral-300">
                  <th className="px-3 py-2">Họ tên</th>
                  <th className="px-3 py-2">Giới tính</th>
                  <th className="px-3 py-2">Năm sinh</th>
                  <th className="px-3 py-2">SĐT</th>
                  <th className="px-3 py-2">Địa chỉ</th>
                  {canEdit && <th className="px-3 py-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((p: Patient) => (
                  <tr key={p.id} className="border-t odd:bg-neutral-50 dark:odd:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <td className="px-3 py-2">{p.fullName}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${genderColor(p.gender)}`}>{p.gender}</span>
                    </td>
                    <td className="px-3 py-2">{p.birthYear}</td>
                    <td className="px-3 py-2">{p.phone ?? '-'}</td>
                    <td className="px-3 py-2 max-w-[280px] truncate" title={p.address ?? ''}>{p.address ?? '-'}</td>
                    {(canEdit || canDelete) && (
                      <td className="px-3 py-2 flex gap-2">
                        {canEdit && <Button variant="ghost" size="sm" onClick={() => setEdit({ id: p.id })}>Cập nhật</Button>}
                        {canDelete && <PatientDeleteButton id={p.id} />}
                        <PatientHistoryButton id={p.id} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={pageParam} pageCount={pageCount} onPageChange={changePage} />
        </div>
      </div>

      {canCreate && <PatientCreateModal open={open} onClose={() => setOpen(false)} />}
      {canEdit && edit.id != null && (
        <PatientEditModal open={!!edit.id} onClose={() => setEdit({ id: null })} id={edit.id!} />
      )}
      <PatientHistoryModalHolder />
    </div>
  )
}

function genderColor(gender?: string) {
  switch (gender) {
    case 'Nam':
      return 'bg-blue-600 text-white'
    case 'Nữ':
      return 'bg-rose-500 text-white'
    default:
      return 'bg-slate-500 text-white'
  }
}

function PatientDeleteButton({ id }: { id: number }) {
  const qc = useQueryClient()
  const mut = useMutation({ mutationFn: () => deletePatient(id), onSuccess: () => { toast.success('Đã xoá bệnh nhân'); qc.invalidateQueries({ queryKey: ['patients'] }) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Xoá thất bại') })
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="danger" size="sm" onClick={()=> setOpen(true)} disabled={mut.isPending}>Xoá</Button>
      <ConfirmModal open={open} title={`Xoá bệnh nhân #${id}?`} onClose={()=> setOpen(false)} onConfirm={()=> mut.mutate()} loading={mut.isPending} confirmText="Xoá">
        <div className="text-sm">Thao tác này không thể hoàn tác.</div>
      </ConfirmModal>
    </>
  )
}

function PatientHistoryButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="sm" onClick={()=> setOpen(true)}>Lịch sử khám</Button>
      {open && <PatientHistoryModal id={id} onClose={()=> setOpen(false)} />}
    </>
  )
}

function PatientHistoryModalHolder() { return null }

function PatientHistoryModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery2({ queryKey: ['patient-history', id], queryFn: () => getPatientMedicalHistory(id) })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Lịch sử khám (Patient #{id})</h3>
          <button className="btn-ghost" onClick={onClose}>Đóng</button>
        </div>
        {isLoading && <div>Đang tải...</div>}
        {isError && <div className="text-danger">Tải lịch sử thất bại</div>}
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Ngày khám</th>
                  <th className="px-3 py-2">Chẩn đoán</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.id}</td>
                    <td className="px-3 py-2">{new Date(r.examinationDate).toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-2">{r.diagnosis ?? '-'}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2"><a className="btn-ghost" href={`/medical-records?recordId=${r.id}`}>Xem hồ sơ</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
