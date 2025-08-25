import { useAuthStore } from '@/lib/auth/authStore'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getMyProfile, updateMyProfile } from '@/lib/api/auth'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { toast } from '@/components/ui/Toast'

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
  const { setAuth, user: userInStore } = useAuthStore()
  const q = useQuery({ queryKey: ['my-profile'], queryFn: () => getMyProfile() })
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<any>({ resolver: zodResolver(schema as any) as unknown as Resolver<any> })

  const mut = useMutation({
    mutationFn: (payload: any) => updateMyProfile(payload),
    onSuccess: (data) => {
      toast.success('Cập nhật thành công')
      setAuth({ token: useAuthStore.getState().token!, user: { ...(userInStore as any), email: data.email, role: data.role } as any })
    },
  })

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



