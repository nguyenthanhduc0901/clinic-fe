import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/lib/auth/authStore'
import { getDefaultRouteForRole } from '@/lib/auth/ability'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api/axios'
import { toast } from '@/components/ui/Toast'
import { FormField, Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const schema = z.object({
  email: z.string().email(),
  // Bypass password constraint: accept any string (including empty)
  password: z.string(),
})

type FormValues = z.infer<typeof schema>

const DEV_PERMS = {
  admin: [
    'permission:manage','report:view','audit_log:view','appointment:read','appointment:update','appointment:create','appointment:delete','patient:*','invoice:*','medicine:*','setting:manage','user:read','staff:read','catalog:read','inventory:read','medical_record:read'
  ],
  receptionist: [
    'appointment:read','appointment:update','appointment:create','patient:read','patient:create','invoice:read','invoice:update'
  ],
  doctor: [
    'medical_record:read','medical_record:create','medical_record:update','patient:read','appointment:read'
  ],
} as const

const DEV_MODE = (import.meta.env.VITE_DEV_FAKE_LOGIN as string | undefined) === 'true'

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setPermissions = useAuthStore((s) => s.setPermissions)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await api.post('/auth/login', values)
      const { accessToken, user } = res.data
      if (!accessToken || !user) throw new Error('Invalid login response')
      setAuth({ token: accessToken, user })
      // fetch permissions
      const permsRes = await api.get('/auth/my-permissions')
      const perms = (permsRes.data?.permissions as string[]) ?? []
      setPermissions(perms)
      const roleName = user?.role?.name ?? 'admin'
      navigate(getDefaultRouteForRole(roleName as any), { replace: true })
      toast.success('Đăng nhập thành công')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đăng nhập thất bại')
    }
  }

  function signInAs(role: keyof typeof DEV_PERMS) {
    const token = 'dev_' + Date.now()
    const email = `${role}@dev`
    setAuth({ token, user: { email, role: { name: role, permissions: DEV_PERMS[role].map((p) => ({ name: p })) } } })
    navigate(getDefaultRouteForRole(role), { replace: true })
  }

  return (
    <div
      className="min-h-screen grid place-items-center p-4 bg-center bg-no-repeat bg-cover"
      style={{ backgroundImage: "url('/banner.webp')" }}
    >
      <div className="w-full max-w-md card bg-white/90 backdrop-blur-sm">
        <h1 className="page-title">Đăng nhập</h1>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <FormField id="email" label="Email" error={errors.email?.message as any}>
            <Input id="email" placeholder="you@example.com" invalid={!!errors.email} describedBy={errors.email ? 'email-error' : undefined} {...register('email')} />
          </FormField>
          <FormField id="password" label="Mật khẩu" error={errors.password?.message as any}>
            <Input id="password" type="password" invalid={!!errors.password} describedBy={errors.password ? 'password-error' : undefined} {...register('password')} />
          </FormField>
          <Button className="w-full" type="submit">Đăng nhập</Button>
        </form>

        {DEV_MODE && (
          <div className="mt-4 grid grid-cols-1 gap-2">
            <Button variant="ghost" onClick={() => signInAs('admin')}>Dev: Sign in as Admin</Button>
            <Button variant="ghost" onClick={() => signInAs('receptionist')}>Dev: Sign in as Receptionist</Button>
            <Button variant="ghost" onClick={() => signInAs('doctor')}>Dev: Sign in as Doctor</Button>
          </div>
        )}
      </div>
    </div>
  )
}



