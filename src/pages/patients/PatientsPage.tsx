import { useQuery } from '@tanstack/react-query'
import { listPatients, type Patient } from '@/lib/api/patients'
import { useState, useMemo } from 'react'
import Pagination from '@/components/ui/Pagination'
import { useSearchParams } from 'react-router-dom'
import PatientCreateModal from '@/pages/patients/PatientCreateModal'
import PatientEditModal from '@/pages/patients/PatientEditModal'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'

export default function PatientsPage() {
  const [sp, setSp] = useSearchParams()
  const pageParam = Number(sp.get('page') || '1')
  const limitParam = Number(sp.get('limit') || '10')
  const qParam = sp.get('q') || ''

  const [q, setQ] = useState(qParam)
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState<{ id: number | null }>({ id: null })
  const { permissions } = useAuthStore()
  const perms = permissions

  const params = useMemo(() => ({ page: pageParam, limit: limitParam, q: qParam }), [pageParam, limitParam, qParam])
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Bệnh nhân</h1>
        {canCreate && (
          <button className="btn-primary" onClick={() => setOpen(true)}>Thêm bệnh nhân</button>
        )}
      </div>
      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <input className="rounded-md border px-3 py-2" placeholder="Tìm tên/SĐT" value={q} onChange={(e) => applySearch(e.target.value)} />
          <button className="btn-ghost" onClick={() => applySearch('')}>Clear</button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm">Hiển thị</span>
            <select className="rounded-md border px-2 py-1" value={limitParam} onChange={(e) => changeLimit(Number(e.target.value))}>
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="card">
        {isLoading && <div>Đang tải...</div>}
        {isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
        {!isLoading && !isError && rows.length === 0 && <div>Không có dữ liệu</div>}
        {!isLoading && !isError && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
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
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2">{p.fullName}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${genderColor(p.gender)}`}>{p.gender}</span>
                    </td>
                    <td className="px-3 py-2">{p.birthYear}</td>
                    <td className="px-3 py-2">{p.phone ?? '-'}</td>
                    <td className="px-3 py-2 max-w-[280px] truncate" title={p.address ?? ''}>{p.address ?? '-'}</td>
                    {canEdit && (
                      <td className="px-3 py-2">
                        <button className="btn-ghost" onClick={() => setEdit({ id: p.id })}>Edit</button>
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



