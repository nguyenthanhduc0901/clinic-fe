import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier, type Supplier } from '@/lib/api/inventory'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'
import { toast } from '@/components/ui/Toast'

export default function SuppliersPage() {
	const [sp, setSp] = useSearchParams()
	const page = Number(sp.get('page') || '1')
	const limit = Number(sp.get('limit') || '10')
	const q = sp.get('q') || ''

	const { permissions, user } = useAuthStore()
	const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
	const canManage = can(perms, ['permission:manage'])
	const canViewList = can(perms, ['permission:manage']) && can(perms, ['medicine:import'])

	const params = useMemo(() => ({ page, limit, q: q || undefined }), [page, limit, q])
	const { data, isLoading, isError } = useQuery<{ data: Supplier[]; total: number }>({
		queryKey: ['suppliers', params],
		queryFn: () => listSuppliers(params),
		enabled: canViewList,
	})

	function changePage(p: number) { setSp((prev) => { prev.set('page', String(p)); return prev }, { replace: true }) }
	function changeLimit(l: number) { setSp((prev) => { prev.set('limit', String(l)); prev.set('page', '1'); return prev }, { replace: true }) }

	const total = data?.total ?? 0
	const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))

	const [modal, setModal] = useState<{ mode: 'create' | 'edit' | null; supplier?: Supplier | null }>({ mode: null, supplier: null })
	const qc = useQueryClient()
	const createMut = useMutation({
		mutationFn: (payload: Partial<Supplier> & { name: string }) => createSupplier(payload),
		onSuccess: () => { toast.success('Tạo nhà cung cấp thành công'); qc.invalidateQueries({ queryKey: ['suppliers'] }); setModal({ mode: null, supplier: null }) },
	})
	const updateMut = useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: Partial<Supplier> }) => updateSupplier(id, payload),
		onSuccess: () => { toast.success('Cập nhật nhà cung cấp thành công'); qc.invalidateQueries({ queryKey: ['suppliers'] }); setModal({ mode: null, supplier: null }) },
	})
	const deleteMut = useMutation({
		mutationFn: (id: number) => deleteSupplier(id),
		onSuccess: () => { toast.success('Xoá nhà cung cấp thành công'); qc.invalidateQueries({ queryKey: ['suppliers'] }) },
	})

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h1 className="page-title">Suppliers</h1>
				{canManage && <button className="btn-primary" onClick={() => setModal({ mode: 'create' })}>Thêm NCC</button>}
			</div>

			<div className="card">
				<div className="flex flex-wrap items-center gap-2">
					<input className="rounded-md border px-3 py-2" placeholder="Tìm NCC" defaultValue={q} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('q', v); else p.delete('q'); p.set('page','1'); return p }, { replace: true })} />
					<div className="ml-auto flex items-center gap-2">
						<span className="text-sm">Hiển thị</span>
						<select className="rounded-md border px-2 py-1" value={limit} onChange={(e)=> changeLimit(Number(e.target.value))}>{[10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}</select>
					</div>
				</div>
			</div>

			{!canViewList ? (
				<div className="card text-sm text-slate-600">Không đủ quyền để xem danh sách nhà cung cấp.</div>
			) : (
				<div className="card">
					{isLoading && <div>Đang tải...</div>}
					{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
					{!isLoading && !isError && (data?.data?.length ?? 0) === 0 && <div>Không có dữ liệu</div>}
					{!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-slate-600">
										<th className="px-3 py-2">Tên</th>
										<th className="px-3 py-2">Liên hệ</th>
										<th className="px-3 py-2">Phone</th>
										<th className="px-3 py-2">Email</th>
										<th className="px-3 py-2">Địa chỉ</th>
										{canManage && <th className="px-3 py-2">Actions</th>}
									</tr>
								</thead>
								<tbody>
									{data!.data.map((s) => (
										<tr key={s.id} className="border-t">
											<td className="px-3 py-2">{s.name}</td>
											<td className="px-3 py-2">{s.contactPerson ?? '-'}</td>
											<td className="px-3 py-2">{s.phone ?? '-'}</td>
											<td className="px-3 py-2">{s.email ?? '-'}</td>
											<td className="px-3 py-2 max-w-[280px] truncate" title={s.address ?? ''}>{s.address ?? '-'}</td>
											{canManage && (
												<td className="px-3 py-2 flex gap-2">
													<button className="btn-ghost" onClick={()=> setModal({ mode: 'edit', supplier: s })}>Edit</button>
													<button className="btn-ghost" onClick={()=> window.confirm('Xoá nhà cung cấp này?') && deleteMut.mutate(s.id)}>Delete</button>
												</td>
											)}
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
			)}

			{canManage && modal.mode && (
				<SupplierModal
					mode={modal.mode}
					supplier={modal.supplier ?? undefined}
					onClose={()=> setModal({ mode: null, supplier: null })}
					onSubmit={(payload) => modal.mode === 'create' ? createMut.mutate(payload as any) : updateMut.mutate({ id: (modal.supplier as Supplier).id, payload })}
				/>
			)}
		</div>
	)
}

function SupplierModal({ mode, supplier, onClose, onSubmit }: { mode: 'create' | 'edit'; supplier?: Supplier; onClose: () => void; onSubmit: (payload: Partial<Supplier> & { name: string }) => void }) {
	const { register, handleSubmit, formState: { isSubmitting } } = useForm<Partial<Supplier> & { name: string }>({
		defaultValues: supplier ? { name: supplier.name, contactPerson: supplier.contactPerson ?? undefined, phone: supplier.phone ?? undefined, email: supplier.email ?? undefined, address: supplier.address ?? undefined } : undefined,
	})
	return (
		<Modal open onClose={onClose} title={mode === 'create' ? 'Thêm NCC' : `Sửa NCC #${supplier?.id}`}>
			<form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
				<div>
					<label className="block text-sm mb-1">Tên</label>
					<input className="w-full rounded-md border px-3 py-2" {...register('name', { required: true })} />
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Liên hệ</label>
						<input className="w-full rounded-md border px-3 py-2" {...register('contactPerson')} />
					</div>
					<div>
						<label className="block text-sm mb-1">Phone</label>
						<input className="w-full rounded-md border px-3 py-2" {...register('phone')} />
					</div>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Email</label>
						<input className="w-full rounded-md border px-3 py-2" {...register('email')} />
					</div>
					<div>
						<label className="block text-sm mb-1">Địa chỉ</label>
						<input className="w-full rounded-md border px-3 py-2" {...register('address')} />
					</div>
				</div>
				<div className="flex justify-end gap-2">
					<button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
					<button className="btn-primary" disabled={isSubmitting}>{mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}</button>
				</div>
			</form>
		</Modal>
	)
}



