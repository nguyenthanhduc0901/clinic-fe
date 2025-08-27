import { useAuthStore } from '@/lib/auth/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyProfile, updateMyProfile } from '@/lib/api/auth'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { toast } from '@/components/ui/Toast'
import { useEffect, useState } from 'react'
import { uploadStaffAvatar, deleteStaffAvatar, getStaffAvatarBlob } from '@/lib/api/staff'
import { can } from '@/lib/auth/ability'

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^\d{8,12}$/, 'SĐT không hợp lệ').optional().or(z.literal('')),
  fullName: z.string().optional(),
  gender: z.enum(['Nam','Nữ','Khác']).optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
})

export default function ProfilePage() {
  const { setAuth, user: userInStore, permissions } = useAuthStore()
  const perms = permissions.length ? permissions : userInStore?.role?.permissions?.map((p: any) => p.name) ?? []
  const q = useQuery({ queryKey: ['my-profile'], queryFn: () => getMyProfile() })
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<any>({ resolver: zodResolver(schema as any) as unknown as Resolver<any> })
  const qc = useQueryClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number>(0)

  const mut = useMutation({
    mutationFn: (payload: any) => updateMyProfile(payload),
    onSuccess: (data) => {
      toast.success('Cập nhật thành công')
      setAuth({ token: useAuthStore.getState().token!, user: { ...(userInStore as any), email: data.email, role: data.role } as any })
    },
  })

  const staffId = q.data?.staff?.id as number | undefined
  const staffHasAvatar = Boolean(q.data?.staff?.avatarUrl)
  const canReadOwnAvatar = can(perms, ['staff:read_own'])
  const canUpdateAvatar = can(perms, ['staff:update_own'])

  useQuery({
    queryKey: ['my-avatar', staffId],
    enabled: Boolean(staffId && staffHasAvatar && canReadOwnAvatar),
    queryFn: async () => {
      try {
        const blob = await getStaffAvatarBlob(staffId!)
        const url = URL.createObjectURL(blob)
        setAvatarUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url })
        return true
      } catch {
        setAvatarUrl(null)
        return false
      }
    },
  })

  useEffect(() => {
    return () => { if (avatarUrl) URL.revokeObjectURL(avatarUrl) }
  }, [avatarUrl])

  function validateFile(file: File) {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) { toast.error('Định dạng không hỗ trợ. Chọn PNG/JPG/JPEG/WEBP.'); return false }
    if (file.size > 5 * 1024 * 1024) { toast.error('Kích thước tối đa 5MB.'); return false }
    return true
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !staffId) return
    if (!validateFile(file)) return
    setUploading(true); setProgress(0)
    try {
      await uploadStaffAvatar(staffId, file, (p) => setProgress(p))
      toast.success('Tải ảnh thành công')
      const blob = await getStaffAvatarBlob(staffId)
      const url = URL.createObjectURL(blob)
      setAvatarUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return url })
      qc.invalidateQueries({ queryKey: ['my-profile'] })
    } catch (err: any) {
      const code = err?.response?.status
      if (code === 400) toast.error(err?.response?.data?.message || 'File không hợp lệ')
      else if (code === 401) toast.error('Phiên đăng nhập hết hạn')
      else if (code === 403) toast.error('Không đủ quyền cập nhật ảnh')
      else toast.error('Tải ảnh thất bại')
    } finally { setUploading(false) }
  }

  async function onDeleteAvatar() {
    if (!staffId) return
    if (!confirm('Xoá ảnh hiện tại?')) return
    try {
      await deleteStaffAvatar(staffId)
      setAvatarUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
      toast.success('Đã xoá ảnh')
      qc.invalidateQueries({ queryKey: ['my-profile'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xoá ảnh thất bại')
    }
  }

  if (q.isLoading) return <div className="card">Đang tải...</div>
  if (q.isError) return <div className="card text-danger">Tải dữ liệu thất bại</div>

  const onSubmit = (values: any) => {
    const payload: any = {}
    for (const k of Object.keys(values)) {
      const v = (values as any)[k]
      if (v !== undefined && v !== '') payload[k] = v
    }
    mut.mutate(payload)
  }

  return (
    <div className="space-y-3">
      <h1 className="page-title">Profile</h1>
      <div className="card">
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          {q.data?.staff && (
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="h-28 w-28 rounded-full bg-slate-100 overflow-hidden grid place-items-center text-xl font-medium text-slate-600">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Ảnh đại diện" className="h-full w-full object-cover" onError={() => setAvatarUrl(null)} />
                  ) : (
                    <span>{(q.data.staff.fullName || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {canUpdateAvatar && (
                  <div className="flex flex-col items-center gap-2">
                    <label className="btn-ghost cursor-pointer">
                      <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={onPickFile} disabled={uploading} />
                      Upload ảnh
                    </label>
                    {Boolean(q.data.staff.avatarUrl) && avatarUrl && (
                      <button type="button" className="btn-ghost text-danger" onClick={onDeleteAvatar} disabled={uploading}>Xoá ảnh</button>
                    )}
                    {uploading && (
                      <div className="w-28">
                        <div className="h-2 bg-slate-200 rounded">
                          <div className="h-2 bg-blue-600 rounded" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="text-xs text-center mt-1">{progress}%</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input className="w-full rounded-md border px-3 py-2" defaultValue={q.data?.email ?? ''} {...register('email')} />
              {errors.email && <p className="text-danger text-sm mt-1">{String(errors.email.message)}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input className="w-full rounded-md border px-3 py-2" defaultValue={q.data?.phone ?? ''} {...register('phone')} />
            </div>
          </div>
          {q.data?.staff && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1">Full name</label>
                  <input className="w-full rounded-md border px-3 py-2" defaultValue={q.data.staff.fullName ?? ''} {...register('fullName')} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Gender</label>
                  <select className="w-full rounded-md border px-3 py-2" defaultValue={(q.data.staff.gender as any) ?? ''} {...register('gender')}>
                    <option value="">--</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1">Birth date</label>
                  <input className="w-full rounded-md border px-3 py-2" type="date" defaultValue={q.data.staff.birthDate ? q.data.staff.birthDate.slice(0,10) : ''} {...register('birthDate')} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Avatar URL</label>
                  <input className="w-full rounded-md border px-3 py-2" defaultValue={q.data.staff.avatarUrl ?? ''} {...register('avatarUrl')} />
                  {errors.avatarUrl && <p className="text-danger text-sm mt-1">{String(errors.avatarUrl.message)}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Address</label>
                <input className="w-full rounded-md border px-3 py-2" defaultValue={q.data.staff.address ?? ''} {...register('address')} />
              </div>
            </>
          )}
          <div className="text-right">
            <button className="btn-primary" disabled={isSubmitting || mut.isPending}>{mut.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}



