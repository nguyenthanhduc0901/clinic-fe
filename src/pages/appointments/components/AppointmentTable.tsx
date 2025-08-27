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

type Props = {
  rows: AppointmentRow[]
  onChangeStatus?: (id: string, status: string) => void
  onOpenReschedule?: (id: string) => void
  onOpenAssignDoctor?: (id: string) => void
  onCreateMedicalRecord?: (id: string) => void
  onOpenDetail?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function AppointmentTable({ rows, onChangeStatus, onOpenReschedule, onOpenAssignDoctor, onCreateMedicalRecord, onOpenDetail, onDelete }: Props) {
  const showActions = Boolean(onOpenDetail || onChangeStatus || onOpenReschedule || onOpenAssignDoctor || onCreateMedicalRecord || onDelete)
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-600">
            <th className="px-3 py-2">STT</th>
            <th className="px-3 py-2">Bệnh nhân</th>
            <th className="px-3 py-2">Bác sĩ</th>
            <th className="px-3 py-2">Trạng thái</th>
            <th className="px-3 py-2">Ghi chú</th>
            <th className="px-3 py-2">Ngày hẹn</th>
            {showActions && <th className="px-3 py-2">Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr className="border-t">
              <td className="px-3 py-4 text-center" colSpan={showActions ? 7 : 6}>Không có dữ liệu</td>
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
              {showActions && (
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {onOpenDetail && (
                      <button className="btn-ghost" onClick={() => onOpenDetail(r.id)}>Xem chi tiết</button>
                    )}
                    {onChangeStatus && (
                      <select
                        className="rounded-md border px-2 py-1"
                        defaultValue={r.status}
                        onChange={(e) => onChangeStatus(r.id, e.target.value)}
                      >
                        <option value="waiting">Chờ</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="checked_in">Đã đến</option>
                        <option value="in_progress">Đang khám</option>
                        <option value="completed">Hoàn tất</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    )}
                    {onOpenReschedule && (
                      <button className="btn-ghost" onClick={() => onOpenReschedule(r.id)}>Dời lịch</button>
                    )}
                    {onOpenAssignDoctor && (
                      <button className="btn-ghost" onClick={() => onOpenAssignDoctor(r.id)}>Gán bác sĩ</button>
                    )}
                    {onCreateMedicalRecord && (
                      <button className="btn-ghost" onClick={() => onCreateMedicalRecord(r.id)}>Tạo bệnh án</button>
                    )}
                    {onDelete && (
                      <button className="btn-ghost text-danger" onClick={() => onDelete(r.id)}>Xoá</button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function mapStatusColor(status?: string): 'primary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'waiting':
      return 'primary'
    case 'confirmed':
      return 'primary'
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



