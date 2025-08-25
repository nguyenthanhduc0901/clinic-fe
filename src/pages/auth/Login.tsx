import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/lib/auth/authStore'
import { getDefaultRouteForRole } from '@/lib/auth/ability'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
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

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (_: FormValues) => {
    // Not wired yet
  }

  function signInAs(role: keyof typeof DEV_PERMS) {
    const token = 'dev_' + Date.now()
    const email = `${role}@dev`
    setAuth({ token, user: { email, role: { name: role, permissions: DEV_PERMS[role].map((p) => ({ name: p })) } } })
    navigate(getDefaultRouteForRole(role), { replace: true })
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md card">
        <h1 className="page-title">Đăng nhập</h1>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full rounded-md border px-3 py-2 bg-white" placeholder="you@example.com" {...register('email')} />
            {errors.email && <p className="text-danger text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Mật khẩu</label>
            <input type="password" className="w-full rounded-md border px-3 py-2 bg-white" {...register('password')} />
            {errors.password && <p className="text-danger text-sm mt-1">{errors.password.message}</p>}
          </div>
          <button className="btn-primary w-full" type="submit">Sign in (mock)</button>
        </form>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <button className="btn-ghost" onClick={() => signInAs('admin')}>Dev: Sign in as Admin</button>
          <button className="btn-ghost" onClick={() => signInAs('receptionist')}>Dev: Sign in as Receptionist</button>
          <button className="btn-ghost" onClick={() => signInAs('doctor')}>Dev: Sign in as Doctor</button>
        </div>
      </div>
    </div>
  )
}



