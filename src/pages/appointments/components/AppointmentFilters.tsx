import { useState, useEffect } from 'react'
import { FormField, Input, Select } from '@/components/ui/Input'
import Button from '@/components/ui/Button'

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
    <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
      <FormField id="appt-q" label="Tìm tên/SĐT">
        <Input id="appt-q" placeholder="Nhập tên hoặc SĐT" value={local.q ?? ''} onChange={(e) => patch({ q: e.target.value, page: 1 })} />
      </FormField>
      <FormField id="appt-date" label="Ngày">
        <Input id="appt-date" type="date" value={local.date} onChange={(e) => patch({ date: e.target.value, page: 1 })} />
      </FormField>
      <FormField id="appt-status" label="Trạng thái">
        <Select id="appt-status" value={local.status ?? ''} onChange={(e) => patch({ status: (e.target.value || undefined) as any, page: 1 })}>
          <option value="">Tất cả trạng thái</option>
          <option value="waiting">waiting</option>
          <option value="confirmed">confirmed</option>
          <option value="checked_in">checked_in</option>
          <option value="in_progress">in_progress</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </Select>
      </FormField>
      <div className="flex items-end">
        <Button variant="ghost" onClick={() => patch({ q: '', status: undefined, page: 1 })}>Clear</Button>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-sm">Hiển thị</span>
        <Select aria-label="Số dòng" value={String(local.limit)} onChange={(e) => patch({ limit: Number(e.target.value), page: 1 })}>
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>
      </div>
    </div>
  )
}



