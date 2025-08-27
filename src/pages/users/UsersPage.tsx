import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listUsers, createUser, updateUser, activateUser, deactivateUser, resetUserPassword, deleteUser, type User } from '@/lib/api/users'
import { listRoles } from '@/lib/api/roles'
import Pagination from '@/components/ui/Pagination'
import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'
import { toast } from '@/components/ui/Toast'
import { FormField, Input, Select } from '@/components/ui/Input'
import { SkeletonTable } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import ConfirmModal from '@/components/ui/ConfirmModal'
import Badge from '@/components/ui/Badge'

export default function UsersPage() {
	const [sp, setSp] = useSearchParams()
	const page = Number(sp.get('page') || '1')
	const limit = Number(sp.get('limit') || '10')
	const q = sp.get('q') || ''
	const roleId = sp.get('roleId')

	const params = useMemo(() => ({ page, limit, q: q || undefined, roleId: roleId ? Number(roleId) : undefined }), [page, limit, q, roleId])
	const { data, isLoading, isError, refetch } = useQuery<{ data: User[]; total: number }>({ queryKey: ['users', params], queryFn: () => listUsers(params) })
	const roles = useQuery({ queryKey: ['roles'], queryFn: () => listRoles(), staleTime: 1000 * 60 * 10 })

	function changePage(p: number) { setSp((prev) => { prev.set('page', String(p)); return prev }, { replace: true }) }
	function changeLimit(l: number) { setSp((prev) => { prev.set('limit', String(l)); prev.set('page', '1'); return prev }, { replace: true }) }

	const total = data?.total ?? 0
	const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))

	const { permissions, user } = useAuthStore()
	const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
	const canCreate = can(perms, ['user:create'])
	const canUpdate = can(perms, ['user:update'])
	const canDelete = can(perms, ['user:delete'])

	const qc = useQueryClient()
	const [createOpen, setCreateOpen] = useState(false)
	const [edit, setEdit] = useState<User | null>(null)
	const [resetPwd, setResetPwd] = useState<User | null>(null)
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

	const createMut = useMutation({ mutationFn: (payload: any) => createUser(payload), onSuccess: () => { toast.success('Tạo user thành công'); qc.invalidateQueries({ queryKey: ['users'] }); setCreateOpen(false) } })
	const updateMut = useMutation({ mutationFn: ({ id, payload }: { id: number; payload: any }) => updateUser(id, payload), onSuccess: () => { toast.success('Cập nhật user thành công'); qc.invalidateQueries({ queryKey: ['users'] }); setEdit(null) } })
	const delMut = useMutation({ mutationFn: (id: number) => deleteUser(id), onSuccess: () => { toast.success('Xoá user thành công'); qc.invalidateQueries({ queryKey: ['users'] }) } })
	const actMut = useMutation({ mutationFn: ({ id, active }: { id: number; active: boolean }) => active ? activateUser(id) : deactivateUser(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }) } })
	const resetMut = useMutation({ mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) => resetUserPassword(id, newPassword), onSuccess: () => { toast.success('Đặt lại mật khẩu thành công'); setResetPwd(null) } })

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h1 className="page-title">Users</h1>
				{canCreate && <Button onClick={()=> setCreateOpen(true)}>Thêm user</Button>}
			</div>
			<div className="card">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-2">
					<FormField id="user-q" label="Tìm email/phone/tên">
						<Input id="user-q" placeholder="Nhập email/SĐT/tên" defaultValue={q} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('q', v); else p.delete('q'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<FormField id="user-role" label="Vai trò">
						<Select id="user-role" value={roleId ?? ''} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('roleId', v); else p.delete('roleId'); p.set('page','1'); return p }, { replace:true })}>
							<option value="">Tất cả vai trò</option>
							{(roles.data ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
						</Select>
					</FormField>
					<div className="flex items-end gap-2">
						<span className="text-sm">Hiển thị</span>
						<Select aria-label="Số dòng" value={String(limit)} onChange={(e)=> changeLimit(Number(e.target.value))}>{[10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}</Select>
					</div>
				</div>
			</div>
			<div className="card">
				{isLoading && <SkeletonTable rows={6} />}
				{isError && <div className="text-danger">Tải dữ liệu thất bại <Button variant="ghost" onClick={()=> refetch()}>Thử lại</Button></div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) === 0 && <div className="empty_state">Không có dữ liệu</div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm table-fixed-header table-zebra table-hover">
							<thead>
								<tr className="text-left text-slate-600">
									<th className="px-3 py-2">Email</th>
									<th className="px-3 py-2">SĐT</th>
									<th className="px-3 py-2">Vai trò</th>
									<th className="px-3 py-2">Active</th>
									<th className="px-3 py-2">Lần đăng nhập cuối</th>
									<th className="px-3 py-2">Thao tác</th>
								</tr>
							</thead>
							<tbody>
								{data!.data.map((u) => (
									<tr key={u.id} className="border-t">
										<td className="px-3 py-2">{u.email}</td>
										<td className="px-3 py-2">{u.phone ?? '-'}</td>
										<td className="px-3 py-2">{u.role?.name ?? '-'}</td>
										<td className="px-3 py-2"><Badge color={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Active' : 'Inactive'}</Badge></td>
										<td className="px-3 py-2">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('vi-VN') : '-'}</td>
										<td className="px-3 py-2 flex flex-wrap gap-2">
											{canUpdate && <Button variant="ghost" size="sm" onClick={()=> setEdit(u)}>Cập nhật</Button>}
											{canUpdate && <Button variant="ghost" size="sm" onClick={()=> actMut.mutate({ id: u.id, active: !u.isActive })}>{u.isActive ? 'Hủy kích hoạt' : 'Kích hoạt'}</Button>}
											{canUpdate && <Button variant="ghost" size="sm" onClick={()=> setResetPwd(u)}>Đổi mật khẩu</Button>}
											{canDelete && <Button variant="danger" size="sm" onClick={()=> setConfirmDeleteId(u.id)}>Xóa</Button>}
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

			{canCreate && createOpen && <UserCreateModal roles={roles.data ?? []} onClose={()=> setCreateOpen(false)} onSubmit={(payload)=> createMut.mutate(payload)} />}
			{canUpdate && edit && <UserEditModal roles={roles.data ?? []} user={edit} onClose={()=> setEdit(null)} onSubmit={(payload)=> updateMut.mutate({ id: edit.id, payload })} />}
			{canUpdate && resetPwd && <ResetPasswordModal user={resetPwd} onClose={()=> setResetPwd(null)} onSubmit={(newPassword)=> resetMut.mutate({ id: resetPwd.id, newPassword })} />}

			{confirmDeleteId != null && (
				<ConfirmModal
					open={true}
					title={`Xoá user #${confirmDeleteId}?`}
					onClose={()=> setConfirmDeleteId(null)}
					onConfirm={()=> { delMut.mutate(confirmDeleteId!); setConfirmDeleteId(null) }}
					confirmText="Xoá"
				>
					<div className="text-sm">Thao tác này không thể hoàn tác.</div>
				</ConfirmModal>
			)}
		</div>
	)
}

const emailSchema = z.string().email('Email không hợp lệ')
const phoneSchema = z.string().regex(/^\d{8,12}$/, 'SĐT không hợp lệ').optional()

function UserCreateModal({ roles, onClose, onSubmit }: { roles: Array<{ id: number; name: string }>; onClose: () => void; onSubmit: (payload: any) => void }) {
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<any>({
		resolver: zodResolver(z.object({ email: emailSchema, phone: phoneSchema, password: z.string().min(6), roleId: z.coerce.number().int().min(1), staff: z.object({ fullName: z.string().min(1) }).partial().optional() }) as any) as unknown as Resolver<any>,
	})
	return (
		<Modal open onClose={onClose} title="Thêm user">
			<form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
				<div className="grid grid-cols-2 gap-2">
					<FormField id="email" label="Email" error={errors.email?.message as any}>
						<Input id="email" {...register('email')} invalid={!!errors.email} />
					</FormField>
					<FormField id="phone" label="Phone (optional)">
						<Input id="phone" {...register('phone')} />
					</FormField>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<FormField id="password" label="Password">
						<Input id="password" type="password" {...register('password')} />
					</FormField>
					<FormField id="roleId" label="Role">
						<Select id="roleId" {...register('roleId')}>
							<option value="">-- Chọn --</option>
							{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
						</Select>
					</FormField>
				</div>
				<fieldset className="space-y-2">
					<legend className="text-sm font-medium">Staff (optional)</legend>
					<FormField id="staffName" label="Full name">
						<Input id="staffName" {...register('staff.fullName')} />
					</FormField>
				</fieldset>
				<div className="flex justify-end gap-2">
					<Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
					<Button type="submit" loading={isSubmitting}>Tạo mới</Button>
				</div>
			</form>
		</Modal>
	)
}

function UserEditModal({ roles, user, onClose, onSubmit }: { roles: Array<{ id: number; name: string }>; user: User; onClose: () => void; onSubmit: (payload: any) => void }) {
	const { register, handleSubmit, formState: { isSubmitting } } = useForm<any>({
		defaultValues: { email: user.email, phone: user.phone ?? '', roleId: user.roleId ?? user.role?.id }
	})
	return (
		<Modal open onClose={onClose} title={`Sửa user #${user.id}`}>
			<form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
				<div className="grid grid-cols-2 gap-2">
					<FormField id="email-edit" label="Email">
						<Input id="email-edit" {...register('email')} />
					</FormField>
					<FormField id="phone-edit" label="Phone">
						<Input id="phone-edit" {...register('phone')} />
					</FormField>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<FormField id="pwd-edit" label="New password (optional)">
						<Input id="pwd-edit" type="password" {...register('password')} />
					</FormField>
					<FormField id="role-edit" label="Role">
						<Select id="role-edit" {...register('roleId')}>
							{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
						</Select>
					</FormField>
				</div>
				<div className="flex justify-end gap-2">
					<Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
					<Button type="submit" loading={isSubmitting}>Lưu thay đổi</Button>
				</div>
			</form>
		</Modal>
	)
}

function ResetPasswordModal({ user, onClose, onSubmit }: { user: User; onClose: () => void; onSubmit: (newPassword: string) => void }) {
	const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ newPassword: string }>()
	return (
		<Modal open onClose={onClose} title={`Reset password #${user.id}`}>
			<form className="space-y-3" onSubmit={handleSubmit((v)=> onSubmit(v.newPassword))}>
				<FormField id="new-pwd" label="New password">
					<Input id="new-pwd" type="password" {...register('newPassword')} />
				</FormField>
				<div className="flex justify-end gap-2">
					<Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
					<Button type="submit" loading={isSubmitting}>Xác nhận</Button>
				</div>
			</form>
		</Modal>
	)
}



