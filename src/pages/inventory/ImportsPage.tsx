import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listImports, createImport, type MedicineImport } from '@/lib/api/inventory'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/Toast'

export default function ImportsPage() {
	const [sp, setSp] = useSearchParams()
	const page = Number(sp.get('page') || '1')
	const limit = Number(sp.get('limit') || '10')
	const medicineId = sp.get('medicineId')
	const supplierId = sp.get('supplierId')

	const params = useMemo(() => ({ page, limit, medicineId: medicineId ? Number(medicineId) : undefined, supplierId: supplierId ? Number(supplierId) : undefined }), [page, limit, medicineId, supplierId])
	const { data, isLoading, isError } = useQuery<{ data: MedicineImport[]; total: number }>({ queryKey: ['imports', params], queryFn: () => listImports(params) })

	function changePage(p: number) { setSp((prev) => { prev.set('page', String(p)); return prev }, { replace: true }) }
	function changeLimit(l: number) { setSp((prev) => { prev.set('limit', String(l)); prev.set('page', '1'); return prev }, { replace: true }) }

	const total = data?.total ?? 0
	const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))

	const [createOpen, setCreateOpen] = useState(false)
	const qc = useQueryClient()
	const mutation = useMutation({
		mutationFn: (payload: any) => createImport(payload),
		onSuccess: () => { toast.success('Tạo phiếu nhập thành công'); qc.invalidateQueries({ queryKey: ['imports'] }); setCreateOpen(false) },
	})

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h1 className="page-title">Inventory Imports</h1>
				<button className="btn-primary" onClick={() => setCreateOpen(true)}>Tạo phiếu nhập</button>
			</div>

			<div className="card">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-2">
					<input className="rounded-md border px-3 py-2" type="number" placeholder="Medicine ID" defaultValue={medicineId ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('medicineId', v); else p.delete('medicineId'); p.set('page','1'); return p }, { replace:true })} />
					<input className="rounded-md border px-3 py-2" type="number" placeholder="Supplier ID" defaultValue={supplierId ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('supplierId', v); else p.delete('supplierId'); p.set('page','1'); return p }, { replace:true })} />
					<div className="flex items-center gap-2">
						<span className="text-sm">Hiển thị</span>
						<select className="rounded-md border px-2 py-1" value={limit} onChange={(e)=> changeLimit(Number(e.target.value))}>{[10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}</select>
					</div>
				</div>
			</div>

			<div className="card">
				{isLoading && <div>Đang tải...</div>}
				{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) === 0 && <div>Không có dữ liệu</div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="text-left text-slate-600">
									<th className="px-3 py-2">ID</th>
									<th className="px-3 py-2">Medicine</th>
									<th className="px-3 py-2">Supplier</th>
									<th className="px-3 py-2">Staff</th>
									<th className="px-3 py-2">Qty</th>
									<th className="px-3 py-2">Import Price</th>
									<th className="px-3 py-2">Lot</th>
									<th className="px-3 py-2">ExpDate</th>
									<th className="px-3 py-2">ImportedAt</th>
								</tr>
							</thead>
							<tbody>
								{data!.data.map((r) => (
									<tr key={r.id} className="border-t">
										<td className="px-3 py-2">{r.id}</td>
										<td className="px-3 py-2">{r.medicineId}</td>
										<td className="px-3 py-2">{r.supplierId ?? '-'}</td>
										<td className="px-3 py-2">{r.staffId ?? '-'}</td>
										<td className="px-3 py-2">{r.quantityImported}</td>
										<td className="px-3 py-2">{r.importPrice ?? '-'}</td>
										<td className="px-3 py-2">{r.lotNumber ?? '-'}</td>
										<td className="px-3 py-2">{r.expirationDate ?? '-'}</td>
										<td className="px-3 py-2">{r.importedAt ?? '-'}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				<div className="mt-3">
					<Pagination page={page} pageCount={pageCount} onPageChange={changePage} />
				</div>
			</div>

			{createOpen && (
				<CreateImportModal
					onClose={()=> setCreateOpen(false)}
					onSubmit={(payload)=> mutation.mutate(payload)}
				/>
			)}
		</div>
	)
}

function CreateImportModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (payload: any) => void }) {
	const { register, handleSubmit, formState: { isSubmitting } } = useForm<any>()
	return (
		<Modal open onClose={onClose} title="Tạo phiếu nhập">
			<form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Medicine ID</label>
						<input className="w-full rounded-md border px-3 py-2" type="number" {...register('medicineId', { valueAsNumber: true, required: true })} />
					</div>
					<div>
						<label className="block text-sm mb-1">Supplier ID (tuỳ chọn)</label>
						<input className="w-full rounded-md border px-3 py-2" type="number" {...register('supplierId', { valueAsNumber: true })} />
					</div>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Staff ID (tuỳ chọn)</label>
						<input className="w-full rounded-md border px-3 py-2" type="number" {...register('staffId', { valueAsNumber: true })} />
					</div>
					<div>
						<label className="block text-sm mb-1">Số lượng nhập</label>
						<input className="w-full rounded-md border px-3 py-2" type="number" min={1} {...register('quantityImported', { valueAsNumber: true, required: true })} />
					</div>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Import Price (VND)</label>
						<input className="w-full rounded-md border px-3 py-2" placeholder="900.00" {...register('importPrice')} />
					</div>
					<div>
						<label className="block text-sm mb-1">Lot Number</label>
						<input className="w-full rounded-md border px-3 py-2" {...register('lotNumber')} />
					</div>
				</div>
				<div>
					<label className="block text-sm mb-1">Expiration Date</label>
					<input className="w-full rounded-md border px-3 py-2" type="date" {...register('expirationDate')} />
				</div>
				<div className="flex justify-end gap-2">
					<button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
					<button className="btn-primary" disabled={isSubmitting}>Tạo</button>
				</div>
			</form>
		</Modal>
	)
}



