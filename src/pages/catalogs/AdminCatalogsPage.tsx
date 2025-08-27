import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listUnits, createUnit, updateUnit, deleteUnit, listUsageInstructions, createUsageInstruction, updateUsageInstruction, deleteUsageInstruction, listDiseaseTypes, createDiseaseType, updateDiseaseType, deleteDiseaseType } from '@/lib/api/catalogs-admin'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'
import { FormField, Input, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { SkeletonTable } from '@/components/ui/Skeleton'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function AdminCatalogsPage() {
	const { permissions, user } = useAuthStore()
	const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any)=> p.name) ?? []
	if (!can(perms, ['permission:manage'])) return <div className="card">Bạn không có quyền truy cập trang này.</div>

	const [sp, setSp] = useSearchParams()
	const tab = sp.get('tab') || 'units'
	const page = Number(sp.get('page') || '1')
	const limit = Number(sp.get('limit') || '10')

	return (
		<div className="space-y-3">
			<h1 className="page-title">Quản trị Catalogs</h1>
			<div className="card">
				<div className="flex gap-2">
					<Button variant="ghost" className={tab==='units'?'font-medium':''} onClick={()=> setSp((p)=> { p.set('tab','units'); p.set('page','1'); return p }, { replace:true })}>Đơn vị</Button>
					<Button variant="ghost" className={tab==='usage'?'font-medium':''} onClick={()=> setSp((p)=> { p.set('tab','usage'); p.set('page','1'); return p }, { replace:true })}>Hướng dẫn sử dụng</Button>
					<Button variant="ghost" className={tab==='disease'?'font-medium':''} onClick={()=> setSp((p)=> { p.set('tab','disease'); p.set('page','1'); return p }, { replace:true })}>Nhóm bệnh</Button>
				</div>
			</div>
			{tab === 'units' && <UnitsTab page={page} limit={limit} onChangePage={(p)=> setSp((q)=> { q.set('page', String(p)); return q }, { replace:true })} />}
			{tab === 'usage' && <UsageTab page={page} limit={limit} onChangePage={(p)=> setSp((q)=> { q.set('page', String(p)); return q }, { replace:true })} />}
			{tab === 'disease' && <DiseaseTab page={page} limit={limit} onChangePage={(p)=> setSp((q)=> { q.set('page', String(p)); return q }, { replace:true })} />}
		</div>
	)
}

function UnitsTab({ page, limit, onChangePage }: { page: number; limit: number; onChangePage: (p:number)=>void }) {
	const qc = useQueryClient()
	const { data, isLoading, isError } = useQuery({ queryKey: ['catalogs-admin','units',{ page, limit }], queryFn: () => listUnits({ page, limit }) })
	const [createOpen, setCreateOpen] = useState(false)
	const [edit, setEdit] = useState<any | null>(null)
	const [q, setQ] = useState('')
	const dq = useDebouncedValue(q, 300)
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
	const createMut = useMutation({ mutationFn: (v:any)=> createUnit(v), onSuccess: ()=> { toast.success('Tạo thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','units'] }); setCreateOpen(false) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi tạo') })
	const updateMut = useMutation({ mutationFn: ({ id, payload }: any)=> updateUnit(id, payload), onSuccess: ()=> { toast.success('Cập nhật thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','units'] }); setEdit(null) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi cập nhật') })
	const deleteMut = useMutation({ mutationFn: (id:number)=> deleteUnit(id), onSuccess: ()=> { toast.success('Xoá thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','units'] }) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi xoá') })
	const total = data?.total ?? 0
	const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))
	const rows = (data?.data ?? []).filter((u)=> u.name.toLowerCase().includes(dq.toLowerCase()) || (u.description ?? '').toLowerCase().includes(dq.toLowerCase()))
	return (
		<div className="card">
			<div className="flex items-center justify-between">
				<h2 className="font-medium">Đơn vị</h2>
				<Button onClick={()=> setCreateOpen(true)}>Thêm mới</Button>
			</div>
			<div className="mb-2">
				<FormField id="units-q" label="Tìm kiếm">
					<Input id="units-q" placeholder="Tìm theo tên/mô tả" value={q} onChange={(e)=> setQ(e.target.value)} />
				</FormField>
			</div>
			{isLoading && <SkeletonTable rows={6} />}
			{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
			{!isLoading && !isError && (
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm table-fixed-header table-zebra table-hover">
						<thead>
							<tr className="text-left text-slate-600">
								<th className="px-3 py-2">Mã</th>
								<th className="px-3 py-2">Tên</th>
								<th className="px-3 py-2">Mô tả</th>
								<th className="px-3 py-2">Cập nhật</th>
								<th className="px-3 py-2">Thao tác</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((u) => (
								<tr key={u.id} className="border-t">
									<td className="px-3 py-2">{u.id}</td>
									<td className="px-3 py-2">{u.name}</td>
									<td className="px-3 py-2 max-w-[320px] truncate" title={u.description ?? ''}>{u.description ?? '-'}</td>
									<td className="px-3 py-2">{u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : '-'}</td>
									<td className="px-3 py-2 flex gap-2">
										<Button variant="ghost" size="sm" onClick={()=> setEdit(u)}>Sửa</Button>
										<Button variant="danger" size="sm" onClick={()=> setConfirmDeleteId(u.id)}>Xoá</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<div className="mt-3">
				<Pagination page={page} pageCount={pageCount} onPageChange={onChangePage} />
			</div>

			{createOpen && (
				<Modal open onClose={()=> setCreateOpen(false)} title="Thêm đơn vị">
					<UnitForm onSubmit={(v)=> createMut.mutate(v)} onClose={()=> setCreateOpen(false)} pending={createMut.isPending} />
				</Modal>
			)}
			{edit && (
				<Modal open onClose={()=> setEdit(null)} title={`Sửa đơn vị #${edit.id}`}>
					<UnitForm initial={{ name: edit.name, description: edit.description ?? '' }} onSubmit={(v)=> updateMut.mutate({ id: edit.id, payload: v })} onClose={()=> setEdit(null)} pending={updateMut.isPending} />
				</Modal>
			)}
			{confirmDeleteId != null && (
				<ConfirmModal open title={`Xoá đơn vị #${confirmDeleteId}?`} onClose={()=> setConfirmDeleteId(null)} onConfirm={()=> { deleteMut.mutate(confirmDeleteId!); setConfirmDeleteId(null) }} confirmText="Xoá">
					<div className="text-sm">Thao tác này không thể hoàn tác.</div>
				</ConfirmModal>
			)}
		</div>
	)
}

function UnitForm({ initial, onSubmit, onClose, pending }: { initial?: any; onSubmit: (v:any)=>void; onClose: ()=>void; pending?: boolean }) {
	const [name, setName] = useState(initial?.name ?? '')
	const [desc, setDesc] = useState(initial?.description ?? '')
	return (
		<form className="space-y-3" onSubmit={(e)=> { e.preventDefault(); onSubmit({ name, description: desc || undefined }) }}>
			<FormField id="u-name" label="Tên">
				<Input id="u-name" value={name} onChange={(e)=> setName(e.target.value)} required aria-invalid={!name ? true : undefined} />
			</FormField>
			<FormField id="u-desc" label="Mô tả">
				<Textarea id="u-desc" rows={3} value={desc} onChange={(e)=> setDesc(e.target.value)} />
			</FormField>
			<div className="text-right space-x-2">
				<Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
				<Button disabled={pending}>{pending?'Đang lưu...':'Lưu'}</Button>
			</div>
		</form>
	)
}

// Usage Instructions Tab and form (similar pattern)
function UsageTab({ page, limit, onChangePage }: { page: number; limit: number; onChangePage: (p:number)=>void }) {
	const qc = useQueryClient()
	const { data, isLoading, isError } = useQuery({ queryKey: ['catalogs-admin','usage',{ page, limit }], queryFn: () => listUsageInstructions({ page, limit }) })
	const [createOpen, setCreateOpen] = useState(false)
	const [edit, setEdit] = useState<any | null>(null)
	const [q, setQ] = useState('')
	const dq = useDebouncedValue(q, 300)
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
	const createMut = useMutation({ mutationFn: (v:any)=> createUsageInstruction(v), onSuccess: ()=> { toast.success('Tạo thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','usage'] }); setCreateOpen(false) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi tạo') })
	const updateMut = useMutation({ mutationFn: ({ id, payload }: any)=> updateUsageInstruction(id, payload), onSuccess: ()=> { toast.success('Cập nhật thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','usage'] }); setEdit(null) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi cập nhật') })
	const deleteMut = useMutation({ mutationFn: (id:number)=> deleteUsageInstruction(id), onSuccess: ()=> { toast.success('Xoá thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','usage'] }) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi xoá') })
	const total = data?.total ?? 0
	const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))
	const rows = (data?.data ?? []).filter((u)=> u.instruction.toLowerCase().includes(dq.toLowerCase()) || (u.description ?? '').toLowerCase().includes(dq.toLowerCase()))
	return (
		<div className="card">
			<div className="flex items-center justify-between">
				<h2 className="font-medium">Hướng dẫn sử dụng</h2>
				<Button onClick={()=> setCreateOpen(true)}>Thêm mới</Button>
			</div>
			<div className="mb-2">
				<FormField id="usage-q" label="Tìm kiếm">
					<Input id="usage-q" placeholder="Tìm theo hướng dẫn/mô tả" value={q} onChange={(e)=> setQ(e.target.value)} />
				</FormField>
			</div>
			{isLoading && <SkeletonTable rows={6} />}
			{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
			{!isLoading && !isError && (
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm table-fixed-header table-zebra table-hover">
						<thead>
							<tr className="text-left text-slate-600">
								<th className="px-3 py-2">Mã</th>
								<th className="px-3 py-2">Hướng dẫn</th>
								<th className="px-3 py-2">Mô tả</th>
								<th className="px-3 py-2">Cập nhật</th>
								<th className="px-3 py-2">Thao tác</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((u) => (
								<tr key={u.id} className="border-t">
									<td className="px-3 py-2">{u.id}</td>
									<td className="px-3 py-2">{u.instruction}</td>
									<td className="px-3 py-2 max-w-[320px] truncate" title={u.description ?? ''}>{u.description ?? '-'}</td>
									<td className="px-3 py-2">{u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : '-'}</td>
									<td className="px-3 py-2 flex gap-2">
										<Button variant="ghost" size="sm" onClick={()=> setEdit(u)}>Sửa</Button>
										<Button variant="danger" size="sm" onClick={()=> setConfirmDeleteId(u.id)}>Xoá</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<div className="mt-3">
				<Pagination page={page} pageCount={pageCount} onPageChange={onChangePage} />
			</div>

			{createOpen && (
				<Modal open onClose={()=> setCreateOpen(false)} title="Thêm hướng dẫn sử dụng">
					<UsageForm onSubmit={(v)=> createMut.mutate(v)} onClose={()=> setCreateOpen(false)} pending={createMut.isPending} />
				</Modal>
			)}
			{edit && (
				<Modal open onClose={()=> setEdit(null)} title={`Sửa hướng dẫn #${edit.id}`}>
					<UsageForm initial={{ instruction: edit.instruction, description: edit.description ?? '' }} onSubmit={(v)=> updateMut.mutate({ id: edit.id, payload: v })} onClose={()=> setEdit(null)} pending={updateMut.isPending} />
				</Modal>
			)}
			{confirmDeleteId != null && (
				<ConfirmModal open title={`Xoá hướng dẫn #${confirmDeleteId}?`} onClose={()=> setConfirmDeleteId(null)} onConfirm={()=> { deleteMut.mutate(confirmDeleteId!); setConfirmDeleteId(null) }} confirmText="Xoá">
					<div className="text-sm">Thao tác này không thể hoàn tác.</div>
				</ConfirmModal>
			)}
		</div>
	)
}

function UsageForm({ initial, onSubmit, onClose, pending }: { initial?: any; onSubmit: (v:any)=>void; onClose: ()=>void; pending?: boolean }) {
	const [instruction, setInstruction] = useState(initial?.instruction ?? '')
	const [desc, setDesc] = useState(initial?.description ?? '')
	return (
		<form className="space-y-3" onSubmit={(e)=> { e.preventDefault(); onSubmit({ instruction, description: desc || undefined }) }}>
			<FormField id="i-name" label="Hướng dẫn">
				<Input id="i-name" value={instruction} onChange={(e)=> setInstruction(e.target.value)} required aria-invalid={!instruction ? true : undefined} />
			</FormField>
			<FormField id="i-desc" label="Mô tả">
				<Textarea id="i-desc" rows={3} value={desc} onChange={(e)=> setDesc(e.target.value)} />
			</FormField>
			<div className="text-right space-x-2">
				<Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
				<Button disabled={pending}>{pending?'Đang lưu...':'Lưu'}</Button>
			</div>
		</form>
	)
}

// Disease Types
function DiseaseTab({ page, limit, onChangePage }: { page: number; limit: number; onChangePage: (p:number)=>void }) {
	const qc = useQueryClient()
	const { data, isLoading, isError } = useQuery({ queryKey: ['catalogs-admin','disease',{ page, limit }], queryFn: () => listDiseaseTypes({ page, limit }) })
	const [createOpen, setCreateOpen] = useState(false)
	const [edit, setEdit] = useState<any | null>(null)
	const [q, setQ] = useState('')
	const dq = useDebouncedValue(q, 300)
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
	const createMut = useMutation({ mutationFn: (v:any)=> createDiseaseType(v), onSuccess: ()=> { toast.success('Tạo thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','disease'] }); setCreateOpen(false) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi tạo') })
	const updateMut = useMutation({ mutationFn: ({ id, payload }: any)=> updateDiseaseType(id, payload), onSuccess: ()=> { toast.success('Cập nhật thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','disease'] }); setEdit(null) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi cập nhật') })
	const deleteMut = useMutation({ mutationFn: (id:number)=> deleteDiseaseType(id), onSuccess: ()=> { toast.success('Xoá thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','disease'] }) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi xoá') })
	const total = data?.total ?? 0
	const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))
	const rows = (data?.data ?? []).filter((u)=> u.name.toLowerCase().includes(dq.toLowerCase()) || (u.description ?? '').toLowerCase().includes(dq.toLowerCase()))
	return (
		<div className="card">
			<div className="flex items-center justify-between">
				<h2 className="font-medium">Nhóm bệnh</h2>
				<Button onClick={()=> setCreateOpen(true)}>Thêm mới</Button>
			</div>
			<div className="mb-2">
				<FormField id="disease-q" label="Tìm kiếm">
					<Input id="disease-q" placeholder="Tìm theo tên/mô tả" value={q} onChange={(e)=> setQ(e.target.value)} />
				</FormField>
			</div>
			{isLoading && <SkeletonTable rows={6} />}
			{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
			{!isLoading && !isError && (
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm table-fixed-header table-zebra table-hover">
						<thead>
							<tr className="text-left text-slate-600">
								<th className="px-3 py-2">Mã</th>
								<th className="px-3 py-2">Tên</th>
								<th className="px-3 py-2">Mô tả</th>
								<th className="px-3 py-2">Cập nhật</th>
								<th className="px-3 py-2">Thao tác</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((u) => (
								<tr key={u.id} className="border-t">
									<td className="px-3 py-2">{u.id}</td>
									<td className="px-3 py-2">{u.name}</td>
									<td className="px-3 py-2 max-w-[320px] truncate" title={u.description ?? ''}>{u.description ?? '-'}</td>
									<td className="px-3 py-2">{u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : '-'}</td>
									<td className="px-3 py-2 flex gap-2">
										<Button variant="ghost" size="sm" onClick={()=> setEdit(u)}>Sửa</Button>
										<Button variant="danger" size="sm" onClick={()=> setConfirmDeleteId(u.id)}>Xoá</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
			<div className="mt-3">
				<Pagination page={page} pageCount={pageCount} onPageChange={onChangePage} />
			</div>

			{createOpen && (
				<Modal open onClose={()=> setCreateOpen(false)} title="Thêm nhóm bệnh">
					<DiseaseForm onSubmit={(v)=> createMut.mutate(v)} onClose={()=> setCreateOpen(false)} pending={createMut.isPending} />
				</Modal>
			)}
			{edit && (
				<Modal open onClose={()=> setEdit(null)} title={`Sửa nhóm bệnh #${edit.id}`}>
					<DiseaseForm initial={{ name: edit.name, description: edit.description ?? '' }} onSubmit={(v)=> updateMut.mutate({ id: edit.id, payload: v })} onClose={()=> setEdit(null)} pending={updateMut.isPending} />
				</Modal>
			)}
			{confirmDeleteId != null && (
				<ConfirmModal open title={`Xoá nhóm bệnh #${confirmDeleteId}?`} onClose={()=> setConfirmDeleteId(null)} onConfirm={()=> { deleteMut.mutate(confirmDeleteId!); setConfirmDeleteId(null) }} confirmText="Xoá">
					<div className="text-sm">Thao tác này không thể hoàn tác.</div>
				</ConfirmModal>
			)}
		</div>
	)
}

function DiseaseForm({ initial, onSubmit, onClose, pending }: { initial?: any; onSubmit: (v:any)=>void; onClose: ()=>void; pending?: boolean }) {
	const [name, setName] = useState(initial?.name ?? '')
	const [desc, setDesc] = useState(initial?.description ?? '')
	return (
		<form className="space-y-3" onSubmit={(e)=> { e.preventDefault(); onSubmit({ name, description: desc || undefined }) }}>
			<FormField id="d-name" label="Tên">
				<Input id="d-name" value={name} onChange={(e)=> setName(e.target.value)} required aria-invalid={!name ? true : undefined} />
			</FormField>
			<FormField id="d-desc" label="Mô tả">
				<Textarea id="d-desc" rows={3} value={desc} onChange={(e)=> setDesc(e.target.value)} />
			</FormField>
			<div className="text-right space-x-2">
				<Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
				<Button disabled={pending}>{pending?'Đang lưu...':'Lưu'}</Button>
			</div>
		</form>
	)
}


