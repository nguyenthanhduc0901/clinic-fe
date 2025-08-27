import { useForm } from 'react-hook-form'
import { forgotPassword } from '@/lib/api/auth'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@/components/ui/Toast'

export default function ForgotPassword() {
	const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>()
	const mut = useMutation({
		mutationFn: ({ email }: { email: string }) => forgotPassword(email),
		onSuccess: (res) => toast.success(res?.message || 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn.'),
		onError: (e:any) => toast.error(e?.response?.data?.message || 'Gửi yêu cầu thất bại'),
	})

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="w-full max-w-md card">
				<h1 className="page-title mb-3">Quên mật khẩu</h1>
				<form className="space-y-3" onSubmit={handleSubmit((v)=> mut.mutate(v))}>
					<div>
						<label className="block text-sm mb-1">Email</label>
						<input className="w-full rounded-md border px-3 py-2" type="email" placeholder="you@clinic.com" {...register('email', { required: true })} />
					</div>
					<p className="text-sm text-slate-600">Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được một liên kết đặt lại mật khẩu. Vui lòng kiểm tra email.</p>
					<div className="text-right">
						<button className="btn-primary" disabled={isSubmitting || mut.isPending}>Gửi yêu cầu</button>
					</div>
				</form>
			</div>
		</div>
	)
}



