import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listUnits, createUnit, updateUnit, deleteUnit, listUsageInstructions, createUsageInstruction, updateUsageInstruction, deleteUsageInstruction, listDiseaseTypes, createDiseaseType, updateDiseaseType, deleteDiseaseType } from '@/lib/api/catalogs-admin'
import Modal from '@/components/ui/Modal'
import Pagination from '@/components/ui/Pagination'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'

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
					<button className={`btn-ghost ${tab==='units'?'font-medium':''}`} onClick={()=> setSp((p)=> { p.set('tab','units'); p.set('page','1'); return p }, { replace:true })}>Units</button>
					<button className={`btn-ghost ${tab==='usage'?'font-medium':''}`} onClick={()=> setSp((p)=> { p.set('tab','usage'); p.set('page','1'); return p }, { replace:true })}>Usage Instructions</button>
					<button className={`btn-ghost ${tab==='disease'?'font-medium':''}`} onClick={()=> setSp((p)=> { p.set('tab','disease'); p.set('page','1'); return p }, { replace:true })}>Disease Types</button>
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
	const createMut = useMutation({ mutationFn: (v:any)=> createUnit(v), onSuccess: ()=> { toast.success('Tạo thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','units'] }); setCreateOpen(false) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi tạo') })
	const updateMut = useMutation({ mutationFn: ({ id, payload }: any)=> updateUnit(id, payload), onSuccess: ()=> { toast.success('Cập nhật thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','units'] }); setEdit(null) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi cập nhật') })
	const deleteMut = useMutation({ mutationFn: (id:number)=> deleteUnit(id), onSuccess: ()=> { toast.success('Xoá thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','units'] }) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi xoá') })
	const total = data?.total ?? 0
	const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))
	return (
		<div className="card">
			<div className="flex items-center justify-between">
				<h2 className="font-medium">Units</h2>
				<button className="btn-primary" onClick={()=> setCreateOpen(true)}>Thêm mới</button>
			</div>
			{isLoading && <div>Đang tải...</div>}
			{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
			{!isLoading && !isError && (
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left text-slate-600">
								<th className="px-3 py-2">Id</th>
								<th className="px-3 py-2">Name</th>
								<th className="px-3 py-2">Description</th>
								<th className="px-3 py-2">UpdatedAt</th>
								<th className="px-3 py-2">Actions</th>
							</tr>
						</thead>
						<tbody>
							{data!.data.map((u) => (
								<tr key={u.id} className="border-t">
									<td className="px-3 py-2">{u.id}</td>
									<td className="px-3 py-2">{u.name}</td>
									<td className="px-3 py-2 max-w-[320px] truncate" title={u.description ?? ''}>{u.description ?? '-'}</td>
									<td className="px-3 py-2">{u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : '-'}</td>
									<td className="px-3 py-2 flex gap-2">
										<button className="btn-ghost" onClick={()=> setEdit(u)}>Sửa</button>
										<button className="btn-ghost text-danger" onClick={()=> { if (confirm('Xoá?')) deleteMut.mutate(u.id) }}>Xoá</button>
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
				<Modal open onClose={()=> setCreateOpen(false)} title="Thêm Unit">
					<UnitForm onSubmit={(v)=> createMut.mutate(v)} onClose={()=> setCreateOpen(false)} pending={createMut.isPending} />
				</Modal>
			)}
			{edit && (
				<Modal open onClose={()=> setEdit(null)} title={`Sửa Unit #${edit.id}`}>
					<UnitForm initial={{ name: edit.name, description: edit.description ?? '' }} onSubmit={(v)=> updateMut.mutate({ id: edit.id, payload: v })} onClose={()=> setEdit(null)} pending={updateMut.isPending} />
				</Modal>
			)}
		</div>
	)
}

function UnitForm({ initial, onSubmit, onClose, pending }: { initial?: any; onSubmit: (v:any)=>void; onClose: ()=>void; pending?: boolean }) {
	const [name, setName] = useState(initial?.name ?? '')
	const [desc, setDesc] = useState(initial?.description ?? '')
	return (
		<form className="space-y-3" onSubmit={(e)=> { e.preventDefault(); onSubmit({ name, description: desc || undefined }) }}>
			<div>
				<label className="block text-sm mb-1" htmlFor="u-name">Name</label>
				<input id="u-name" className="w-full rounded-md border px-3 py-2" value={name} onChange={(e)=> setName(e.target.value)} required aria-invalid={!name ? true : undefined} />
			</div>
			<div>
				<label className="block text-sm mb-1" htmlFor="u-desc">Description</label>
				<textarea id="u-desc" className="w-full rounded-md border px-3 py-2" rows={3} value={desc} onChange={(e)=> setDesc(e.target.value)} />
			</div>
			<div className="text-right">
				<button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
				<button className="btn-primary" disabled={pending}>{pending?'Đang lưu...':'Lưu'}</button>
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
	const createMut = useMutation({ mutationFn: (v:any)=> createUsageInstruction(v), onSuccess: ()=> { toast.success('Tạo thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','usage'] }); setCreateOpen(false) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi tạo') })
	const updateMut = useMutation({ mutationFn: ({ id, payload }: any)=> updateUsageInstruction(id, payload), onSuccess: ()=> { toast.success('Cập nhật thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','usage'] }); setEdit(null) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi cập nhật') })
	const deleteMut = useMutation({ mutationFn: (id:number)=> deleteUsageInstruction(id), onSuccess: ()=> { toast.success('Xoá thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','usage'] }) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi xoá') })
	const total = data?.total ?? 0
	const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))
	return (
		<div className="card">
			<div className="flex items-center justify-between">
				<h2 className="font-medium">Usage Instructions</h2>
				<button className="btn-primary" onClick={()=> setCreateOpen(true)}>Thêm mới</button>
			</div>
			{isLoading && <div>Đang tải...</div>}
			{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
			{!isLoading && !isError && (
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left text-slate-600">
								<th className="px-3 py-2">Id</th>
								<th className="px-3 py-2">Instruction</th>
								<th className="px-3 py-2">Description</th>
								<th className="px-3 py-2">UpdatedAt</th>
								<th className="px-3 py-2">Actions</th>
							</tr>
						</thead>
						<tbody>
							{data!.data.map((u) => (
								<tr key={u.id} className="border-t">
									<td className="px-3 py-2">{u.id}</td>
									<td className="px-3 py-2">{u.instruction}</td>
									<td className="px-3 py-2 max-w-[320px] truncate" title={u.description ?? ''}>{u.description ?? '-'}</td>
									<td className="px-3 py-2">{u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : '-'}</td>
									<td className="px-3 py-2 flex gap-2">
										<button className="btn-ghost" onClick={()=> setEdit(u)}>Sửa</button>
										<button className="btn-ghost text-danger" onClick={()=> { if (confirm('Xoá?')) deleteMut.mutate(u.id) }}>Xoá</button>
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
				<Modal open onClose={()=> setCreateOpen(false)} title="Thêm Usage Instruction">
					<UsageForm onSubmit={(v)=> createMut.mutate(v)} onClose={()=> setCreateOpen(false)} pending={createMut.isPending} />
				</Modal>
			)}
			{edit && (
				<Modal open onClose={()=> setEdit(null)} title={`Sửa Usage #${edit.id}`}>
					<UsageForm initial={{ instruction: edit.instruction, description: edit.description ?? '' }} onSubmit={(v)=> updateMut.mutate({ id: edit.id, payload: v })} onClose={()=> setEdit(null)} pending={updateMut.isPending} />
				</Modal>
			)}
		</div>
	)
}

function UsageForm({ initial, onSubmit, onClose, pending }: { initial?: any; onSubmit: (v:any)=>void; onClose: ()=>void; pending?: boolean }) {
	const [instruction, setInstruction] = useState(initial?.instruction ?? '')
	const [desc, setDesc] = useState(initial?.description ?? '')
	return (
		<form className="space-y-3" onSubmit={(e)=> { e.preventDefault(); onSubmit({ instruction, description: desc || undefined }) }}>
			<div>
				<label className="block text-sm mb-1" htmlFor="i-name">Instruction</label>
				<input id="i-name" className="w-full rounded-md border px-3 py-2" value={instruction} onChange={(e)=> setInstruction(e.target.value)} required aria-invalid={!instruction ? true : undefined} />
			</div>
			<div>
				<label className="block text-sm mb-1" htmlFor="i-desc">Description</label>
				<textarea id="i-desc" className="w-full rounded-md border px-3 py-2" rows={3} value={desc} onChange={(e)=> setDesc(e.target.value)} />
			</div>
			<div className="text-right">
				<button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
				<button className="btn-primary" disabled={pending}>{pending?'Đang lưu...':'Lưu'}</button>
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
	const createMut = useMutation({ mutationFn: (v:any)=> createDiseaseType(v), onSuccess: ()=> { toast.success('Tạo thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','disease'] }); setCreateOpen(false) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi tạo') })
	const updateMut = useMutation({ mutationFn: ({ id, payload }: any)=> updateDiseaseType(id, payload), onSuccess: ()=> { toast.success('Cập nhật thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','disease'] }); setEdit(null) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi cập nhật') })
	const deleteMut = useMutation({ mutationFn: (id:number)=> deleteDiseaseType(id), onSuccess: ()=> { toast.success('Xoá thành công'); qc.invalidateQueries({ queryKey: ['catalogs-admin','disease'] }) }, onError: (e:any)=> toast.error(e?.response?.data?.message || 'Lỗi xoá') })
	const total = data?.total ?? 0
	const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))
	return (
		<div className="card">
			<div className="flex items-center justify-between">
				<h2 className="font-medium">Disease Types</h2>
				<button className="btn-primary" onClick={()=> setCreateOpen(true)}>Thêm mới</button>
			</div>
			{isLoading && <div>Đang tải...</div>}
			{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
			{!isLoading && !isError && (
				<div className="overflow-x-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="text-left text-slate-600">
								<th className="px-3 py-2">Id</th>
								<th className="px-3 py-2">Name</th>
								<th className="px-3 py-2">Description</th>
								<th className="px-3 py-2">UpdatedAt</th>
								<th className="px-3 py-2">Actions</th>
							</tr>
						</thead>
						<tbody>
							{data!.data.map((u) => (
								<tr key={u.id} className="border-t">
									<td className="px-3 py-2">{u.id}</td>
									<td className="px-3 py-2">{u.name}</td>
									<td className="px-3 py-2 max-w-[320px] truncate" title={u.description ?? ''}>{u.description ?? '-'}</td>
									<td className="px-3 py-2">{u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : '-'}</td>
									<td className="px-3 py-2 flex gap-2">
										<button className="btn-ghost" onClick={()=> setEdit(u)}>Sửa</button>
										<button className="btn-ghost text-danger" onClick={()=> { if (confirm('Xoá?')) deleteMut.mutate(u.id) }}>Xoá</button>
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
				<Modal open onClose={()=> setCreateOpen(false)} title="Thêm Disease Type">
					<DiseaseForm onSubmit={(v)=> createMut.mutate(v)} onClose={()=> setCreateOpen(false)} pending={createMut.isPending} />
				</Modal>
			)}
			{edit && (
				<Modal open onClose={()=> setEdit(null)} title={`Sửa Disease #${edit.id}`}>
					<DiseaseForm initial={{ name: edit.name, description: edit.description ?? '' }} onSubmit={(v)=> updateMut.mutate({ id: edit.id, payload: v })} onClose={()=> setEdit(null)} pending={updateMut.isPending} />
				</Modal>
			)}
		</div>
	)
}

function DiseaseForm({ initial, onSubmit, onClose, pending }: { initial?: any; onSubmit: (v:any)=>void; onClose: ()=>void; pending?: boolean }) {
	const [name, setName] = useState(initial?.name ?? '')
	const [desc, setDesc] = useState(initial?.description ?? '')
	return (
		<form className="space-y-3" onSubmit={(e)=> { e.preventDefault(); onSubmit({ name, description: desc || undefined }) }}>
			<div>
				<label className="block text-sm mb-1" htmlFor="d-name">Name</label>
				<input id="d-name" className="w-full rounded-md border px-3 py-2" value={name} onChange={(e)=> setName(e.target.value)} required aria-invalid={!name ? true : undefined} />
			</div>
			<div>
				<label className="block text-sm mb-1" htmlFor="d-desc">Description</label>
				<textarea id="d-desc" className="w-full rounded-md border px-3 py-2" rows={3} value={desc} onChange={(e)=> setDesc(e.target.value)} />
			</div>
			<div className="text-right">
				<button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
				<button className="btn-primary" disabled={pending}>{pending?'Đang lưu...':'Lưu'}</button>
			</div>
		</form>
	)
}


