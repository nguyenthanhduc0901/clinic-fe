import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listLowStock } from '@/lib/api/inventory'

export default function LowStockPage() {
  const [sp, setSp] = useSearchParams()
  const threshold = Number(sp.get('threshold') || '10')
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const params = useMemo(() => ({ threshold, page, limit }), [threshold, page, limit])
  const { data, isLoading, isError } = useQuery({ queryKey: ['low-stock', params], queryFn: () => listLowStock(params) })

  // const total = data?.total ?? 0

  function changeLimit(l: number) { setSp((p)=>{ p.set('limit', String(l)); p.set('page','1'); return p }, { replace:true }) }
  // Optional pagination control could be added here if API supports pages in UI

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Hàng tồn thấp</h1>
      </div>
      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm">Ngưỡng</label>
          <input className="rounded-md border px-3 py-2 w-28" type="number" min={0} defaultValue={threshold} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('threshold', v); else p.delete('threshold'); p.set('page','1'); return p }, { replace:true })} />
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
                  <th className="px-3 py-2">Tên thuốc</th>
                  <th className="px-3 py-2">Đơn vị</th>
                  <th className="px-3 py-2">Giá</th>
                  <th className="px-3 py-2">Tồn kho</th>
                </tr>
              </thead>
              <tbody>
                {data!.data.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2">{m.name}</td>
                    <td className="px-3 py-2">{m.unit?.name ?? '-'}</td>
                    <td className="px-3 py-2">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(m.price))}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${m.quantityInStock <= threshold ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{m.quantityInStock}</span>
                    </td>
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


