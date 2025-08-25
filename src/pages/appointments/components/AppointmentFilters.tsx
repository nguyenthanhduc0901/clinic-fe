import { useState, useEffect } from 'react'

export type Filters = {
  date: string
  q?: string
  status?: string
  page: number
  limit: number
}

type Props = {
  value: Filters
  onChange: (next: Filters) => void
}

export default function AppointmentFilters({ value, onChange }: Props) {
  const [local, setLocal] = useState<Filters>(value)
  useEffect(() => setLocal(value), [value])

  function patch(p: Partial<Filters>) {
    const next = { ...local, ...p }
    setLocal(next)
    onChange(next)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
      <input className="rounded-md border px-3 py-2" placeholder="Tìm tên/SĐT" value={local.q ?? ''} onChange={(e) => patch({ q: e.target.value, page: 1 })} />
      <input className="rounded-md border px-3 py-2" type="date" value={local.date} onChange={(e) => patch({ date: e.target.value, page: 1 })} />
      <select className="rounded-md border px-3 py-2" value={local.status ?? ''} onChange={(e) => patch({ status: e.target.value || undefined, page: 1 })}>
        <option value="">Tất cả trạng thái</option>
        <option value="waiting">waiting</option>
        <option value="confirmed">confirmed</option>
        <option value="checked_in">checked_in</option>
        <option value="in_progress">in_progress</option>
        <option value="completed">completed</option>
        <option value="cancelled">cancelled</option>
      </select>
      <button className="btn-ghost" onClick={() => patch({ q: '', status: undefined, page: 1 })}>Clear</button>
      <div className="flex items-center gap-2">
        <span className="text-sm">Hiển thị</span>
        <select className="rounded-md border px-2 py-1" value={local.limit} onChange={(e) => patch({ limit: Number(e.target.value), page: 1 })}>
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  )
}



