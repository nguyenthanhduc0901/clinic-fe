import Modal from '@/components/ui/Modal'
import { useQuery } from '@tanstack/react-query'
import { getImport } from '@/lib/api/inventory'

export default function ImportDetailModal({ id, onClose }: { id: number | null; onClose: () => void }) {
	const { data, isLoading, isError } = useQuery({ queryKey: ['import', id], enabled: id != null, queryFn: () => getImport(id!) })
	if (id == null) return null
	return (
		<Modal open onClose={onClose} title={`Chi tiết phiếu nhập #${id}`}>
			{isLoading && <div>Đang tải...</div>}
			{isError && <div className="text-danger">Tải chi tiết thất bại</div>}
			{!isLoading && !isError && data && (
				<div className="grid grid-cols-2 gap-2 text-sm">
					<div><strong>ID:</strong> {data.id}</div>
					<div><strong>Medicine:</strong> {data.medicineId}</div>
					<div><strong>Supplier:</strong> {data.supplierId ?? '-'}</div>
					<div><strong>Staff:</strong> {data.staffId ?? '-'}</div>
					<div><strong>Qty:</strong> {data.quantityImported}</div>
					<div><strong>Import Price:</strong> {data.importPrice ?? '-'}</div>
					<div><strong>Lot:</strong> {data.lotNumber ?? '-'}</div>
					<div><strong>Expiration:</strong> {data.expirationDate ?? '-'}</div>
					<div className="col-span-2"><strong>Imported At:</strong> {data.importedAt ?? '-'}</div>
				</div>
			)}
		</Modal>
	)
}


