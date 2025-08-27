import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier, type Supplier, getSupplier } from '../../lib/api/inventory'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'
import { toast } from '@/components/ui/Toast'
import { FormField, Input, Select } from '@/components/ui/Input'
import { SkeletonTable } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import ConfirmModal from '@/components/ui/ConfirmModal'

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
	const { data, isLoading, isError, refetch } = useQuery<{ data: Supplier[]; total: number }>({
		queryKey: ['suppliers', params],
		queryFn: () => listSuppliers(params),
		enabled: canViewList,
	})

	function changePage(p: number) { setSp((prev) => { prev.set('page', String(p)); return prev }, { replace: true }) }
	function changeLimit(l: number) { setSp((prev) => { prev.set('limit', String(l)); prev.set('page', '1'); return prev }, { replace: true }) }

	const total = data?.total ?? 0
	const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))

	const [modal, setModal] = useState<{ mode: 'create' | 'edit' | null; supplier?: Supplier | null }>({ mode: null, supplier: null })
	const [detailId, setDetailId] = useState<number | null>(null)
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
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
				{canManage && <Button onClick={() => setModal({ mode: 'create' })}>Thêm NCC</Button>}
			</div>

			<div className="card">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-2">
					<FormField id="q" label="Tìm NCC">
						<Input id="q" placeholder="Nhập tên/điện thoại/email" defaultValue={q} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('q', v); else p.delete('q'); p.set('page','1'); return p }, { replace: true })} />
					</FormField>
					<div className="flex items-end gap-2 ml-auto">
						<span className="text-sm">Hiển thị</span>
						<Select aria-label="Số dòng" value={String(limit)} onChange={(e)=> changeLimit(Number(e.target.value))}>{[10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}</Select>
					</div>
				</div>
			</div>

			{!canViewList ? (
				<div className="card text-sm text-slate-600">Không đủ quyền để xem danh sách nhà cung cấp.</div>
			) : (
				<div className="card">
					{isLoading && <SkeletonTable rows={6} />}
					{isError && <div className="text-danger">Tải dữ liệu thất bại <button className="btn-ghost" onClick={()=> refetch()}>Thử lại</button></div>}
					{!isLoading && !isError && (data?.data?.length ?? 0) === 0 && <div className="empty-state">Không có dữ liệu</div>}
					{!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm table-fixed-header table-zebra table-hover">
								<thead>
									<tr className="text-left text-slate-600">
										<th className="px-3 py-2">Tên</th>
										<th className="px-3 py-2">Liên hệ</th>
										<th className="px-3 py-2">Phone</th>
										<th className="px-3 py-2">Email</th>
										<th className="px-3 py-2">Địa chỉ</th>
										<th className="px-3 py-2">Thao tác</th>
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
											<td className="px-3 py-2 flex gap-2">
												<Button variant="ghost" size="sm" onClick={()=> setDetailId(s.id)}>Xem chi tiết</Button>
												{canManage && <Button variant="ghost" size="sm" onClick={()=> setModal({ mode: 'edit', supplier: s })}>Cập nhật</Button>}
												{canManage && <Button variant="danger" size="sm" onClick={()=> setConfirmDeleteId(s.id)}>Xóa</Button>}
											</td>
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

			{detailId != null && (
				<SupplierDetailDrawer id={detailId} onClose={()=> setDetailId(null)} />
			)}

			{confirmDeleteId != null && (
				<ConfirmModal
					open={true}
					title={`Xóa nhà cung cấp #${confirmDeleteId}?`}
					onClose={()=> setConfirmDeleteId(null)}
					onConfirm={()=> { deleteMut.mutate(confirmDeleteId!); setConfirmDeleteId(null) }}
					confirmText="Xóa"
				>
					<div className="text-sm">Thao tác này không thể hoàn tác.</div>
				</ConfirmModal>
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
				<FormField id="name" label="Tên">
					<Input id="name" {...register('name', { required: true })} />
				</FormField>
				<div className="grid grid-cols-2 gap-2">
					<FormField id="contactPerson" label="Liên hệ">
						<Input id="contactPerson" {...register('contactPerson')} />
					</FormField>
					<FormField id="phone" label="Phone">
						<Input id="phone" {...register('phone')} />
					</FormField>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<FormField id="email" label="Email">
						<Input id="email" type="email" {...register('email')} />
					</FormField>
					<FormField id="address" label="Địa chỉ">
						<Input id="address" {...register('address')} />
					</FormField>
				</div>
				<div className="flex justify-end gap-2">
					<Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
					<Button type="submit" loading={isSubmitting}>{mode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}</Button>
				</div>
			</form>
		</Modal>
	)
}

function SupplierDetailDrawer({ id, onClose }: { id: number; onClose: () => void }) {
	const q = useQuery({ queryKey: ['supplier', id], queryFn: () => getSupplier(id) })
	return (
		<div className="fixed inset-0 z-50 flex">
			<div className="flex-1 bg-black/40" onClick={onClose} />
			<div className="relative z-10 w-full max-w-md bg_white dark:bg-slate-900 p-4 overflow-y-auto">
				<div className="flex items-center justify-between mb-2">
					<h2 className="text-lg font-medium">Chi tiết NCC #{id}</h2>
					<button className="btn-ghost" onClick={onClose}>Đóng</button>
				</div>
				{q.isLoading && <div>Đang tải...</div>}
				{q.isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
				{q.data && (
					<div className="space-y-1 text-sm">
						<div><strong>Tên:</strong> {q.data.name}</div>
						<div><strong>Liên hệ:</strong> {q.data.contactPerson ?? '-'}</div>
						<div><strong>Phone:</strong> {q.data.phone ?? '-'}</div>
						<div><strong>Email:</strong> {q.data.email ?? '-'}</div>
						<div className="max-w-full break-words"><strong>Địa chỉ:</strong> {q.data.address ?? '-'}</div>
						<div><strong>Created:</strong> {q.data.createdAt ?? '-'}</div>
						<div><strong>Updated:</strong> {q.data.updatedAt ?? '-'}</div>
					</div>
				)}
			</div>
		</div>
	)
}



