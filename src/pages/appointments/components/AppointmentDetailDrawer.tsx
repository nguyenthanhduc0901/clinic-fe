import { useQuery } from '@tanstack/react-query'
import { getAppointment } from '@/lib/api/appointments'
import Modal from '@/components/ui/Modal'

export default function AppointmentDetailDrawer({ id, onClose }: { id: number | null; onClose: () => void }) {
	const { data, isLoading, isError } = useQuery({ queryKey: ['appointment', id], enabled: id != null, queryFn: () => getAppointment(id!) })
	if (id == null) return null
	return (
		<Modal open onClose={onClose} title={`Chi tiết lịch hẹn #${id}`}>
			{isLoading && <div>Đang tải...</div>}
			{isError && <div className="text-danger">Tải chi tiết thất bại</div>}
			{!isLoading && !isError && data && (
				<div className="space-y-2 text-sm">
					<div><strong>Mã lịch hẹn:</strong> {data.id}</div>
					<div><strong>STT:</strong> {data.orderNumber}</div>
					<div><strong>Trạng thái:</strong> {data.status}</div>
					<div><strong>Ngày hẹn:</strong> {data.appointmentDate ? new Date(data.appointmentDate).toLocaleString('vi-VN') : '-'}</div>
					<div><strong>Bệnh nhân:</strong> {data.patient?.fullName ?? `#${data.patientId}`} ({data.patient?.id ?? data.patientId})</div>
					<div><strong>Bác sĩ:</strong> {data.staff?.fullName ?? '-'} {data.staff?.id ? `(#${data.staff.id})` : ''}</div>
					<div><strong>Ghi chú:</strong> {data.notes ?? '-'}</div>
				</div>
			)}
			<div className="text-right mt-4">
				<button className="btn-ghost" onClick={onClose}>Đóng</button>
			</div>
		</Modal>
	)
}



