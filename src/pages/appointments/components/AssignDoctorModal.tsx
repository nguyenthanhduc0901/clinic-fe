import { useState } from 'react'
import { listStaff } from '@/lib/api/staff'
import { AutocompleteInput } from '@/components/ui/AutocompleteInput'

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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />
			<div className="relative z-10 w-full max-w-lg rounded-lg bg-white dark:bg-slate-900 p-4 space-y-3">
				<h2 className="text-lg font-medium">Assign Doctor</h2>
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
					<button className="btn-ghost" onClick={onClose} disabled={loading}>Đóng</button>
					<button className="btn" onClick={() => onAssign(null)} disabled={loading}>Bỏ gán</button>
					<button className="btn-primary" onClick={() => onAssign(selectedId ?? null)} disabled={loading || !selectedId}>Gán bác sĩ</button>
				</div>
			</div>
		</div>
	)
}


