import { useQuery } from '@tanstack/react-query'
import { getAppointment } from '@/lib/api/appointments'

export default function AppointmentDetailDrawer({ id, onClose }: { id: number | null; onClose: () => void }) {
	const { data, isLoading, isError } = useQuery({ queryKey: ['appointment', id], enabled: id != null, queryFn: () => getAppointment(id!) })
	if (id == null) return null
	return (
		<div className="fixed inset-0 z-50 flex justify-end">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />
			<div className="relative z-10 w-full max-w-md h-full bg-white dark:bg-slate-900 p-4 overflow-y-auto">
				<div className="flex items-center justify-between mb-2">
					<h3 className="font-medium">Chi tiết lịch hẹn #{id}</h3>
					<button className="btn-ghost" onClick={onClose}>Đóng</button>
				</div>
				{isLoading && <div>Đang tải...</div>}
				{isError && <div className="text-danger">Tải chi tiết thất bại</div>}
				{!isLoading && !isError && data && (
					<div className="space-y-2 text-sm">
						<div><strong>STT:</strong> {data.orderNumber}</div>
						<div><strong>Trạng thái:</strong> {data.status}</div>
						<div><strong>Ngày hẹn:</strong> {data.appointmentDate}</div>
						<div><strong>Bệnh nhân:</strong> {data.patient?.fullName} ({data.patient?.id})</div>
						<div><strong>Bác sĩ:</strong> {data.staff?.fullName ?? '-'} ({data.staff?.id ?? '-'})</div>
						<div><strong>Ghi chú:</strong> {data.notes ?? '-'}</div>
					</div>
				)}
			</div>
		</div>
	)
}


