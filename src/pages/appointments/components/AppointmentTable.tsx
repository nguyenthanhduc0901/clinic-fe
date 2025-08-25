import Badge from '@/components/ui/Badge'

export type AppointmentRow = {
  id: string
  orderNumber: number
  patient?: { fullName?: string; phone?: string }
  staff?: { fullName?: string }
  status?: string
  note?: string
  date?: string
}

type Props = { rows: AppointmentRow[] }

export default function AppointmentTable({ rows }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-600">
            <th className="px-3 py-2">Order</th>
            <th className="px-3 py-2">Patient</th>
            <th className="px-3 py-2">Doctor</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Note</th>
            <th className="px-3 py-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr className="border-t">
              <td className="px-3 py-4 text-center" colSpan={6}>No data</td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-3 py-2">{r.orderNumber}</td>
              <td className="px-3 py-2">{r.patient?.fullName} {r.patient?.phone ? `(${r.patient?.phone})` : ''}</td>
              <td className="px-3 py-2">{r.staff?.fullName ?? '-'}</td>
              <td className="px-3 py-2">
                <Badge color={mapStatusColor(r.status)}>{r.status ?? '-'}</Badge>
              </td>
              <td className="px-3 py-2">{r.note ?? '-'}</td>
              <td className="px-3 py-2">{r.date ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function mapStatusColor(status?: string): 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'completed':
      return 'success'
    case 'checked_in':
    case 'in_progress':
      return 'warning'
    case 'cancelled':
      return 'danger'
    default:
      return 'primary'
  }
}



