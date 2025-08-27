import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listImportsAdvanced as listImports, createImport, type MedicineImport } from '../../lib/api/inventory'
import ImportDetailModal from '@/pages/inventory/ImportDetailModal'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/Toast'
import { FormField, Input, Select } from '@/components/ui/Input'
import { SkeletonTable } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'

export default function ImportsPage() {
	const [sp, setSp] = useSearchParams()
	const page = Number(sp.get('page') || '1')
	const limit = Number(sp.get('limit') || '10')
	const medicineId = sp.get('medicineId')
	const supplierId = sp.get('supplierId')
	const dateFrom = sp.get('dateFrom')
	const dateTo = sp.get('dateTo')
	const lotNumber = sp.get('lotNumber')
	const expirationDateFrom = sp.get('expirationDateFrom')
	const expirationDateTo = sp.get('expirationDateTo')

	const params = useMemo(() => ({ page, limit, medicineId: medicineId ? Number(medicineId) : undefined, supplierId: supplierId ? Number(supplierId) : undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, lotNumber: lotNumber || undefined, expirationDateFrom: expirationDateFrom || undefined, expirationDateTo: expirationDateTo || undefined }), [page, limit, medicineId, supplierId, dateFrom, dateTo, lotNumber, expirationDateFrom, expirationDateTo])
	const { data, isLoading, isError } = useQuery<{ data: MedicineImport[]; total: number }>({ queryKey: ['imports', params], queryFn: () => listImports(params) })

	function changePage(p: number) { setSp((prev) => { prev.set('page', String(p)); return prev }, { replace: true }) }
	function changeLimit(l: number) { setSp((prev) => { prev.set('limit', String(l)); prev.set('page', '1'); return prev }, { replace: true }) }

	const total = data?.total ?? 0
	const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))

	const [createOpen, setCreateOpen] = useState(false)
	const [detailId, setDetailId] = useState<number | null>(null)
	const qc = useQueryClient()
	const mutation = useMutation({
		mutationFn: (payload: any) => createImport(payload),
		onSuccess: () => { toast.success('Tạo phiếu nhập thành công'); qc.invalidateQueries({ queryKey: ['imports'] }); setCreateOpen(false) },
	})

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h1 className="page-title">Inventory Imports</h1>
				<Button onClick={() => setCreateOpen(true)}>Tạo phiếu nhập</Button>
			</div>

			<div className="card">
				<div className="grid grid-cols-1 md:grid-cols-6 gap-2">
					<FormField id="imp-med" label="Medicine ID">
						<Input id="imp-med" type="number" defaultValue={medicineId ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('medicineId', v); else p.delete('medicineId'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<FormField id="imp-sup" label="Supplier ID">
						<Input id="imp-sup" type="number" defaultValue={supplierId ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('supplierId', v); else p.delete('supplierId'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<FormField id="imp-from" label="Từ ngày">
						<Input id="imp-from" type="date" defaultValue={dateFrom ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('dateFrom', v); else p.delete('dateFrom'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<FormField id="imp-to" label="Đến ngày">
						<Input id="imp-to" type="date" defaultValue={dateTo ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('dateTo', v); else p.delete('dateTo'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<FormField id="imp-lot" label="Lot Number">
						<Input id="imp-lot" defaultValue={lotNumber ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('lotNumber', v); else p.delete('lotNumber'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<FormField id="imp-exp-from" label="HSD từ">
						<Input id="imp-exp-from" type="date" defaultValue={expirationDateFrom ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('expirationDateFrom', v); else p.delete('expirationDateFrom'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<FormField id="imp-exp-to" label="HSD đến">
						<Input id="imp-exp-to" type="date" defaultValue={expirationDateTo ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('expirationDateTo', v); else p.delete('expirationDateTo'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<div className="flex items-end gap-2">
						<span className="text-sm">Hiển thị</span>
						<Select aria-label="Số dòng" value={String(limit)} onChange={(e)=> changeLimit(Number(e.target.value))}>{[10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}</Select>
					</div>
				</div>
			</div>

			<div className="card">
				{isLoading && <SkeletonTable rows={6} />}
				{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) === 0 && <div className="empty-state">Không có dữ liệu</div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm table-fixed-header table-zebra table-hover">
							<thead>
								<tr className="text-left text-slate-600">
									<th className="px-3 py-2">Mã</th>
									<th className="px-3 py-2">Thuốc</th>
									<th className="px-3 py-2">Nhà cung cấp</th>
									<th className="px-3 py-2">Nhân viên</th>
									<th className="px-3 py-2">Số lượng</th>
									<th className="px-3 py-2">Giá nhập</th>
									<th className="px-3 py-2">Lô</th>
									<th className="px-3 py-2">HSD</th>
									<th className="px-3 py-2">Ngày nhập</th>
									<th className="px-3 py-2">Thao tác</th>
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
										<td className="px-3 py-2">{r.importedAt ? new Date(r.importedAt).toLocaleString('vi-VN') : '-'}</td>
										<td className="px-3 py-2"><Button variant="ghost" size="sm" onClick={()=> setDetailId(r.id)}>Chi tiết</Button></td>
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

			{detailId != null && (
				<ImportDetailModal id={detailId} onClose={()=> setDetailId(null)} />
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



