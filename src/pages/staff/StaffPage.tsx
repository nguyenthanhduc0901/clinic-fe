import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listStaff, updateStaff } from '@/lib/api/staff'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'
import { toast } from '@/components/ui/Toast'

export default function StaffPage() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const q = sp.get('q') || ''

  const params = useMemo(() => ({ page, limit, q: q || undefined }), [page, limit, q])
  const { data, isLoading, isError } = useQuery({ queryKey: ['staff', params], queryFn: () => listStaff(params) })

  function changePage(p: number) { setSp((prev) => { prev.set('page', String(p)); return prev }, { replace: true }) }
  function changeLimit(l: number) { setSp((prev) => { prev.set('limit', String(l)); prev.set('page', '1'); return prev }, { replace: true }) }

  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))

  const { permissions, user } = useAuthStore()
  const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
  const canEdit = can(perms, ['staff:update'])

  const [edit, setEdit] = useState<any | null>(null)
  const qc = useQueryClient()
  const mut = useMutation({ mutationFn: ({ id, payload }: { id: number; payload: any }) => updateStaff(id, payload), onSuccess: () => { toast.success('Cập nhật staff thành công'); qc.invalidateQueries({ queryKey: ['staff'] }); setEdit(null) } })

  return (
    <div className="space-y-3">
      <h1 className="page-title">Staff</h1>
      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <input className="rounded-md border px-3 py-2" placeholder="Tìm tên/email/phone" defaultValue={q} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('q', v); else p.delete('q'); p.set('page','1'); return p }, { replace:true })} />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm">Hiển thị</span>
            <select className="rounded-md border px-2 py-1" value={limit} onChange={(e)=> changeLimit(Number(e.target.value))}>{[10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}</select>
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
                  <th className="px-3 py-2">Họ tên</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Giới tính</th>
                  <th className="px-3 py-2">Năm sinh</th>
                  <th className="px-3 py-2">Địa chỉ</th>
                  {canEdit && <th className="px-3 py-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data!.data.map((s: any) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-2">{s.fullName}</td>
                    <td className="px-3 py-2">{s.user?.email ?? '-'}</td>
                    <td className="px-3 py-2">{s.user?.phone ?? '-'}</td>
                    <td className="px-3 py-2">{s.gender ?? '-'}</td>
                    <td className="px-3 py-2">{s.birthDate ? s.birthDate.slice(0,10) : '-'}</td>
                    <td className="px-3 py-2 max-w-[280px] truncate" title={s.address ?? ''}>{s.address ?? '-'}</td>
                    {canEdit && (
                      <td className="px-3 py-2">
                        <button className="btn-ghost" onClick={()=> setEdit(s)}>Edit</button>
                      </td>
                    )}
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

      {canEdit && edit && <StaffEditModal staff={edit} onClose={()=> setEdit(null)} onSubmit={(payload)=> mut.mutate({ id: edit.id, payload })} />}
    </div>
  )
}

function StaffEditModal({ staff, onClose, onSubmit }: { staff: any; onClose: () => void; onSubmit: (payload: any) => void }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<any>({ defaultValues: { fullName: staff.fullName, gender: staff.gender ?? '', birthDate: staff.birthDate ? staff.birthDate.slice(0,10) : '', address: staff.address ?? '', avatarUrl: staff.avatarUrl ?? '' } })
  return (
    <Modal open onClose={onClose} title={`Sửa hồ sơ #${staff.id}`}>
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm mb-1">Họ tên</label>
            <input className="w-full rounded-md border px-3 py-2" {...register('fullName')} />
          </div>
          <div>
            <label className="block text-sm mb-1">Giới tính</label>
            <select className="w-full rounded-md border px-3 py-2" {...register('gender')}>
              <option value="">--</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm mb-1">Birth date</label>
            <input className="w-full rounded-md border px-3 py-2" type="date" {...register('birthDate')} />
          </div>
          <div>
            <label className="block text-sm mb-1">Avatar URL</label>
            <input className="w-full rounded-md border px-3 py-2" {...register('avatarUrl')} />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Địa chỉ</label>
          <input className="w-full rounded-md border px-3 py-2" {...register('address')} />
        </div>
        <div className="text-right">
          <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn-primary" disabled={isSubmitting}>Lưu thay đổi</button>
        </div>
      </form>
    </Modal>
  )
}



