import { useState } from 'react'
import { listStaff } from '@/lib/api/staff'
import { AutocompleteInput } from '@/components/ui/AutocompleteInput'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

type Props = {
	open: boolean
	onClose: () => void
	onAssign: (staffId: number | null) => void
	canReadStaff: boolean
	loading?: boolean
	initialStaffName?: string | null
}

export default function AssignDoctorModal({ open, onClose, onAssign, canReadStaff, loading }: Props) {
	const [selectedId, setSelectedId] = useState<number | undefined>(undefined)

	if (!open) return null

	return (
		<Modal open={open} onClose={onClose} title="Gán bác sĩ">
			<div className="space-y-3">
				{canReadStaff ? (
					<AutocompleteInput
						label="Bác sĩ"
						placeholder="Tìm bác sĩ theo tên/email/phone"
						value={selectedId}
						onChange={(v) => setSelectedId(v ?? undefined)}
						fetchOptions={listStaff}
						queryKey={['staff', 'assign']}
						mapOption={(item) => ({ id: item.id, fullName: item.fullName || item.user?.email || `#${item.id}` })}
					/>
				) : (
					<div className="text-sm text-slate-600">Bạn không có quyền xem danh sách bác sĩ.</div>
				)}
				<div className="flex justify-end gap-2">
					<Button variant="ghost" onClick={onClose} disabled={loading}>Đóng</Button>
					<Button onClick={() => onAssign(null)} disabled={loading}>Bỏ gán</Button>
					<Button onClick={() => onAssign(selectedId ?? null)} disabled={loading || !selectedId}>Gán bác sĩ</Button>
				</div>
			</div>
		</Modal>
	)
}


