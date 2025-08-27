import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listMedicines, type Medicine, getMedicineById, deleteMedicine } from '@/lib/api/medicines'
import { getCatalogs } from '@/lib/api/catalogs'
import Pagination from '@/components/ui/Pagination'
// Inline create/edit modals were removed; hide these actions if components are absent
import ImportStockModal from '@/pages/medicines/ImportStockModal'
import AdjustStockModal from '@/pages/medicines/AdjustStockModal'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/Toast'

export default function MedicinesPage() {
  const [sp, setSp] = useSearchParams()
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '20')
  const q = sp.get('q') || ''
  const unitId = sp.get('unitId')
  const supplierId = sp.get('supplierId')
  const priceMin = sp.get('priceMin')
  const priceMax = sp.get('priceMax')
  const stockMin = sp.get('stockMin')
  const stockMax = sp.get('stockMax')

  const params = useMemo(() => ({
    page,
    limit,
    q: q || undefined,
    unitId: unitId ? Number(unitId) : undefined,
    supplierId: supplierId ? Number(supplierId) : undefined,
    priceMin: priceMin ? Number(priceMin) : undefined,
    priceMax: priceMax ? Number(priceMax) : undefined,
    stockMin: stockMin ? Number(stockMin) : undefined,
    stockMax: stockMax ? Number(stockMax) : undefined,
  }), [page, limit, q, unitId, supplierId, priceMin, priceMax, stockMin, stockMax])

  const { data, isLoading, isError } = useQuery<{ data: Medicine[]; total: number }>({
    queryKey: ['medicines', params],
    queryFn: () => listMedicines(params),
  })

  const catalogs = useQuery({
    queryKey: ['catalogs'],
    queryFn: () => getCatalogs(),
    staleTime: 1000 * 60 * 60,
  })

  function changePage(p: number) {
    setSp((prev) => { prev.set('page', String(p)); return prev }, { replace: true })
  }
  function changeLimit(l: number) {
    setSp((prev) => { prev.set('limit', String(l)); prev.set('page', '1'); return prev }, { replace: true })
  }

  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / (limit || 20)))

  const { permissions, user } = useAuthStore()
  const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
  // Create/Edit are not available in this build
  const canDelete = can(perms, ['permission:manage'])
  const canImport = can(perms, ['medicine:import'])
  const canAdjust = can(perms, ['permission:manage'])

  const qc = useQueryClient()
  const delMut = useMutation({
    mutationFn: (id: number) => deleteMedicine(id),
    onSuccess: () => {
      toast.success('Xoá thuốc thành công')
      qc.invalidateQueries({ queryKey: ['medicines'] })
    },
  })

  // const [createOpen, setCreateOpen] = useState(false)
  // const [edit, setEdit] = useState<{ id: number | null }>({ id: null })
  const [importState, setImportState] = useState<{ id: number | null }>({ id: null })
  const [adjustState, setAdjustState] = useState<{ id: number | null }>({ id: null })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Thuốc</h1>
        {/* Create button hidden (feature not available) */}
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <input className="rounded-md border px-3 py-2" placeholder="Tìm thuốc" defaultValue={q} onChange={(e) => setSp((p)=>{ const v=e.target.value; if(v) p.set('q', v); else p.delete('q'); p.set('page','1'); return p }, { replace:true })} />
          <select className="rounded-md border px-3 py-2" value={unitId ?? ''} onChange={(e) => setSp((p)=>{ const v=e.target.value; if(v) p.set('unitId', v); else p.delete('unitId'); p.set('page','1'); return p }, { replace:true })}>
            <option value="">Tất cả đơn vị</option>
            {(catalogs.data?.units ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input className="rounded-md border px-3 py-2" type="number" placeholder="Supplier ID" defaultValue={supplierId ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('supplierId', v); else p.delete('supplierId'); p.set('page','1'); return p }, { replace:true })} />
          <input className="rounded-md border px-3 py-2" type="number" placeholder="Giá từ" defaultValue={priceMin ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('priceMin', v); else p.delete('priceMin'); p.set('page','1'); return p }, { replace:true })} />
          <input className="rounded-md border px-3 py-2" type="number" placeholder="Giá đến" defaultValue={priceMax ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('priceMax', v); else p.delete('priceMax'); p.set('page','1'); return p }, { replace:true })} />
          <input className="rounded-md border px-3 py-2" type="number" placeholder="Tồn từ" defaultValue={stockMin ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('stockMin', v); else p.delete('stockMin'); p.set('page','1'); return p }, { replace:true })} />
          <input className="rounded-md border px-3 py-2" type="number" placeholder="Tồn đến" defaultValue={stockMax ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('stockMax', v); else p.delete('stockMax'); p.set('page','1'); return p }, { replace:true })} />
          <div className="flex items-center gap-2">
            <span className="text-sm">Hiển thị</span>
            <select className="rounded-md border px-2 py-1" value={limit} onChange={(e)=> changeLimit(Number(e.target.value))}>
              {[10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}
            </select>
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
                  <th className="px-3 py-2">Tên thuốc</th>
                  <th className="px-3 py-2">Đơn vị</th>
                  <th className="px-3 py-2">Giá</th>
                  <th className="px-3 py-2">Tồn kho</th>
                  <th className="px-3 py-2">Ghi chú</th>
                  {(canDelete || canImport || canAdjust) && <th className="px-3 py-2">Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {data!.data.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap cursor-pointer hover:underline" onClick={()=> setSp((p)=>{ p.set('detailId', String(m.id)); return p }, { replace:true })}>{m.name}</td>
                    <td className="px-3 py-2">{m.unit?.name ?? '-'}</td>
                    <td className="px-3 py-2">{formatVnd(m.price)}</td>
                    <td className="px-3 py-2">{m.quantityInStock}</td>
                    <td className="px-3 py-2 max-w-[280px] truncate" title={m.description ?? ''}>{m.description ?? '-'}</td>
                    {(canDelete || canImport || canAdjust) && (
                      <td className="px-3 py-2 flex flex-wrap gap-2">
                        {canDelete && <button className="btn-ghost" onClick={()=> window.confirm('Xoá thuốc này?') && delMut.mutate(m.id)}>Xóa</button>}
                        {canImport && <button className="btn-ghost" onClick={()=> setImportState({ id: m.id })}>Nhập kho</button>}
                        {canAdjust && <button className="btn-ghost" onClick={()=> setAdjustState({ id: m.id })}>Điều chỉnh số lượng</button>}
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

      {/* Detail drawer */}
      {!!sp.get('detailId') && <MedicineDetail id={Number(sp.get('detailId'))} onClose={()=> setSp((p)=>{ p.delete('detailId'); return p }, { replace:true })} />}

      {/* Create/Edit modals not available in this build */}
      {canImport && importState.id != null && <ImportStockModal open={!!importState.id} onClose={()=> setImportState({ id: null })} id={importState.id!} />}
      {canAdjust && adjustState.id != null && <AdjustStockModal open={!!adjustState.id} onClose={()=> setAdjustState({ id: null })} id={adjustState.id!} />}
    </div>
  )
}

function MedicineDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const detail = useQuery({ queryKey: ['medicine', id], queryFn: () => getMedicineById(id) })
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-medium">Chi tiết thuốc #{id}</h2>
          <button className="btn-ghost" onClick={onClose}>Đóng</button>
        </div>
        {detail.isLoading && <div>Đang tải...</div>}
        {detail.isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
        {detail.data && (
          <div className="space-y-2 text-sm">
            <div><strong>Tên:</strong> {detail.data.name}</div>
            <div><strong>Đơn vị:</strong> {detail.data.unitId}</div>
            <div><strong>Giá:</strong> {formatVnd(detail.data.price)}</div>
            <div><strong>Tồn kho:</strong> {detail.data.quantityInStock}</div>
            <div><strong>Ghi chú:</strong> {detail.data.description ?? '-'}</div>
          </div>
        )}
      </div>
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



