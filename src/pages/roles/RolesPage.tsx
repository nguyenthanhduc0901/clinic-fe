import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listRoles, listAllPermissions, createRole, updateRole, deleteRole, setRolePermissions, type Role } from '@/lib/api/roles'
import Modal from '@/components/ui/Modal'
import { toast } from '@/components/ui/Toast'

export default function RolesPage() {
	const roles = useQuery({ queryKey: ['roles'], queryFn: () => listRoles() })
	const perms = useQuery({ queryKey: ['all-permissions'], queryFn: () => listAllPermissions(), staleTime: 1000 * 60 * 10 })
	const qc = useQueryClient()
	const [createOpen, setCreateOpen] = useState(false)
	const [edit, setEdit] = useState<Role | null>(null)
	const [selected, setSelected] = useState<Role | null>(null)

	const createMut = useMutation({ mutationFn: (payload: { name: string; description?: string }) => createRole(payload), onSuccess: () => { toast.success('Tạo role thành công'); qc.invalidateQueries({ queryKey: ['roles'] }); setCreateOpen(false) } })
	const updateMut = useMutation({ mutationFn: ({ id, payload }: { id: number; payload: { name?: string; description?: string } }) => updateRole(id, payload), onSuccess: () => { toast.success('Cập nhật role thành công'); qc.invalidateQueries({ queryKey: ['roles'] }); setEdit(null) } })
	const delMut = useMutation({ mutationFn: (id: number) => deleteRole(id), onSuccess: () => { toast.success('Xoá role thành công'); qc.invalidateQueries({ queryKey: ['roles'] }) } })
	const setPermsMut = useMutation({ mutationFn: ({ id, permissionIds }: { id: number; permissionIds: number[] }) => setRolePermissions(id, permissionIds), onSuccess: () => { toast.success('Cập nhật permissions thành công'); qc.invalidateQueries({ queryKey: ['roles'] }) } })

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h1 className="page-title">Vai trò</h1>
					<button className="btn-primary" onClick={()=> setCreateOpen(true)}>Thêm role</button>
				</div>
				<div className="card">
					{roles.isLoading && <div>Đang tải...</div>}
					{roles.isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
					{!roles.isLoading && !roles.isError && (
						<div className="overflow-x-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-slate-600">
										<th className="px-3 py-2">Tên</th>
										<th className="px-3 py-2">Mô tả</th>
										<th className="px-3 py-2">Số quyền</th>
										<th className="px-3 py-2">Thao tác</th>
									</tr>
								</thead>
								<tbody>
									{(roles.data ?? []).map((r) => (
										<tr key={r.id} className="border-t">
											<td className="px-3 py-2 cursor-pointer hover:underline" onClick={()=> setSelected(r)}>{r.name}</td>
											<td className="px-3 py-2">{r.description ?? '-'}</td>
											<td className="px-3 py-2">{r.permissions?.length ?? 0}</td>
											<td className="px-3 py-2 flex gap-2">
												<button className="btn-ghost" onClick={()=> setEdit(r)}>Sửa</button>
												<button className="btn-ghost" onClick={()=> window.confirm('Xoá role này?') && delMut.mutate(r.id)}>Xoá</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
			<div className="space-y-3">
				<h2 className="page-title text-base">Permissions of role</h2>
				<div className="card">
					{!selected ? (
						<div>Chọn một role để quản lý permissions</div>
					) : perms.isLoading ? (
						<div>Đang tải...</div>
					) : (
						<div className="space-y-2">
							<div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[50vh] overflow-auto">
								{(perms.data ?? []).map((p) => (
									<label key={p.id} className="flex items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={Boolean(selected.permissions?.some((x)=> x.id === p.id))}
											onChange={(e)=> {
												setSelected((prev) => {
													if (!prev) return prev
													const current = new Set(prev.permissions?.map((x)=> x.id) ?? [])
													if (e.target.checked) current.add(p.id); else current.delete(p.id)
													return {
														...prev,
														permissions: Array.from(current).map((id)=> ({ id, name: (perms.data ?? []).find((x)=> x.id===id)?.name || '' }))
													}
												})
											}}
										/>
										<span>{p.name}</span>
									</label>
								))}
							</div>
							<div className="text-right">
								<button className="btn" onClick={()=> setPermsMut.mutate({ id: selected.id, permissionIds: selected.permissions?.map((x)=> x.id) ?? [] })}>Lưu</button>
							</div>
						</div>
					)}
				</div>
			</div>

			{createOpen && <RoleModal mode="create" onClose={()=> setCreateOpen(false)} onSubmit={(payload)=> createMut.mutate(payload)} />}
			{edit && <RoleModal mode="edit" role={edit} onClose={()=> setEdit(null)} onSubmit={(payload)=> updateMut.mutate({ id: edit.id, payload })} />}
		</div>
	)
}

function RoleModal({ mode, role, onClose, onSubmit }: { mode: 'create' | 'edit'; role?: Role; onClose: () => void; onSubmit: (payload: { name: string; description?: string }) => void }) {
	const [name, setName] = useState(role?.name ?? '')
	const [desc, setDesc] = useState(role?.description ?? '')
	return (
		<Modal open onClose={onClose} title={mode === 'create' ? 'Thêm role' : `Sửa role #${role?.id}`}>
			<div className="space-y-3">
				<div>
					<label className="block text-sm mb-1">Tên</label>
					<input className="w-full rounded-md border px-3 py-2" value={name} onChange={(e)=> setName(e.target.value)} />
				</div>
				<div>
					<label className="block text-sm mb-1">Mô tả</label>
					<input className="w-full rounded-md border px-3 py-2" value={desc} onChange={(e)=> setDesc(e.target.value)} />
				</div>
				<div className="text-right">
					<button className="btn" onClick={()=> onSubmit({ name, description: desc || undefined })}>Lưu</button>
				</div>
			</div>
		</Modal>
	)
}



