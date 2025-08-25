import { useState, useEffect } from 'react'

export type Filters = {
  date: string
  q?: string
  status?: string
  page: number
  limit: number
}

type Props = {
  variant: 'basic' | 'advanced'
  value: Filters
  onChange: (next: Filters) => void
}

export default function AppointmentFilters({ variant, value, onChange }: Props) {
  const [local, setLocal] = useState<Filters>(value)
  useEffect(() => setLocal(value), [value])

  function patch(p: Partial<Filters>) {
    const next = { ...local, ...p }
    setLocal(next)
    onChange(next)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      <input className="rounded-md border px-3 py-2" placeholder="Search by name/phone" value={local.q ?? ''} onChange={(e) => patch({ q: e.target.value, page: 1 })} />
      <input className="rounded-md border px-3 py-2" type="date" value={local.date} onChange={(e) => patch({ date: e.target.value, page: 1 })} />
      <select className="rounded-md border px-3 py-2" value={local.status ?? ''} onChange={(e) => patch({ status: e.target.value || undefined, page: 1 })}>
        <option value="">All status</option>
        <option value="scheduled">Scheduled</option>
        <option value="checked_in">Checked in</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      {variant === 'advanced' && (
        <input className="rounded-md border px-3 py-2" placeholder="Doctor ID" />
      )}
    </div>
  )
}



