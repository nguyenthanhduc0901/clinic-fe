import { useForm } from 'react-hook-form'
import { resetPassword } from '@/lib/api/auth'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@/components/ui/Toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FormField, Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function ResetPassword() {
	const [sp] = useSearchParams()
	const token = sp.get('token') || ''
	const navigate = useNavigate()
	const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ newPassword: string }>()
	const mut = useMutation({
		mutationFn: ({ newPassword }: { newPassword: string }) => resetPassword(token, newPassword),
		onSuccess: (res) => { toast.success(res?.message || 'Đặt lại mật khẩu thành công'); navigate('/login') },
		onError: (e:any) => toast.error(e?.response?.data?.message || 'Đặt lại mật khẩu thất bại'),
	})

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="w-full max-w-md card">
				<h1 className="page-title mb-3">Đặt lại mật khẩu</h1>
				<form className="space-y-3" onSubmit={handleSubmit((v)=> mut.mutate(v))}>
					<FormField id="newPassword" label="Mật khẩu mới">
						<Input id="newPassword" type="password" {...register('newPassword', { required: true })} />
					</FormField>
					<div className="text-right">
						<Button disabled={isSubmitting || mut.isPending || !token}>Đặt lại</Button>
					</div>
				</form>
			</div>
		</div>
	)
}



