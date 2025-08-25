import { useQuery } from '@tanstack/react-query'
import { getCatalogs } from '@/lib/api/catalogs'
import { useState, useMemo } from 'react'

export default function CatalogsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['catalogs'], queryFn: () => getCatalogs(), staleTime: 1000 * 60 * 10 })
  const [uQ, setUQ] = useState('')
  const [iQ, setIQ] = useState('')
  const [dQ, setDQ] = useState('')

  const units = useMemo(() => (data?.units ?? []).filter((x) => x.name.toLowerCase().includes(uQ.toLowerCase())), [data?.units, uQ])
  const insts = useMemo(() => (data?.usageInstructions ?? []).filter((x) => x.instruction.toLowerCase().includes(iQ.toLowerCase())), [data?.usageInstructions, iQ])
  const diseases = useMemo(() => (data?.diseaseTypes ?? []).filter((x) => x.name.toLowerCase().includes(dQ.toLowerCase())), [data?.diseaseTypes, dQ])

  return (
    <div className="space-y-3">
      <h1 className="page-title">Catalogs</h1>

      <div className="card">
        <h2 className="font-medium mb-2">Units</h2>
        <div className="mb-2">
          <input className="rounded-md border px-3 py-2" placeholder="Tìm unit" value={uQ} onChange={(e)=> setUQ(e.target.value)} />
        </div>
        {isLoading && <div>Đang tải...</div>}
        {isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">Id</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">UpdatedAt</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2">{u.id}</td>
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2 max-w-[320px] truncate" title={u.description ?? ''}>{u.description ?? '-'}</td>
                    <td className="px-3 py-2">{u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-medium mb-2">Usage Instructions</h2>
        <div className="mb-2">
          <input className="rounded-md border px-3 py-2" placeholder="Tìm hướng dẫn" value={iQ} onChange={(e)=> setIQ(e.target.value)} />
        </div>
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">Id</th>
                  <th className="px-3 py-2">Instruction</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">UpdatedAt</th>
                </tr>
              </thead>
              <tbody>
                {insts.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2">{u.id}</td>
                    <td className="px-3 py-2">{u.instruction}</td>
                    <td className="px-3 py-2 max-w-[320px] truncate" title={u.description ?? ''}>{u.description ?? '-'}</td>
                    <td className="px-3 py-2">{u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-medium mb-2">Disease Types</h2>
        <div className="mb-2">
          <input className="rounded-md border px-3 py-2" placeholder="Tìm bệnh" value={dQ} onChange={(e)=> setDQ(e.target.value)} />
        </div>
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="px-3 py-2">Id</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">UpdatedAt</th>
                </tr>
              </thead>
              <tbody>
                {diseases.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2">{u.id}</td>
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2 max-w-[320px] truncate" title={u.description ?? ''}>{u.description ?? '-'}</td>
                    <td className="px-3 py-2">{u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : '-'}</td>
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



