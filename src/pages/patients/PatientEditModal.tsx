import Modal from '@/components/ui/Modal'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPatient, updatePatient } from '@/lib/api/patients'
import { toast } from '@/components/ui/Toast'

const currentYear = new Date().getFullYear()

type FormValues = {
	fullName?: string
	birthYear?: number
	gender?: 'Nam' | 'Nữ' | 'Khác'
	phone?: string
	address?: string
}

const schema: z.ZodType<FormValues> = z.object({
	fullName: z.string().min(1, 'Họ tên bắt buộc').optional(),
	birthYear: z.coerce.number().int().min(1901).max(currentYear).optional(),
	gender: z.enum(['Nam', 'Nữ', 'Khác']).optional(),
	phone: z.string().optional(),
	address: z.string().optional(),
})

type Props = { open: boolean; onClose: () => void; id: number }

export default function PatientEditModal({ open, onClose, id }: Props) {
	const qc = useQueryClient()
	const { data, isLoading } = useQuery({ queryKey: ['patient', id], queryFn: () => getPatient(id), enabled: open })

	const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setError } = useForm<FormValues>({
		resolver: zodResolver(schema as any) as unknown as Resolver<FormValues>,
	})

	useEffect(() => {
		if (data) {
			reset({ fullName: data.fullName, birthYear: data.birthYear, gender: data.gender as any, phone: data.phone ?? undefined, address: data.address ?? undefined })
		}
	}, [data, reset])

	const mutation = useMutation({
		mutationFn: (values: FormValues) => updatePatient(id, values),
		onSuccess: () => {
			toast.success('Cập nhật thành công')
			qc.invalidateQueries({ queryKey: ['patients'] })
			onClose()
		},
		onError: (err: any) => {
			if (err?.response?.status === 409) {
				setError('phone', { type: 'conflict', message: 'Số điện thoại đã tồn tại' })
				return
			}
			if (err?.response?.status === 400) {
				const msg = err?.response?.data?.message || 'Dữ liệu không hợp lệ'
				const details = err?.response?.data?.details
				toast.error(details ? `${msg}: ${Array.isArray(details) ? details.join(', ') : String(details)}` : msg)
				return
			}
		},
	})

	const onSubmit = (values: FormValues) => mutation.mutate(values)

	return (
		<Modal open={open} onClose={onClose} title={`Sửa bệnh nhân #${id}`}>
			{isLoading ? (
				<div>Đang tải...</div>
			) : (
				<form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
					<div>
						<label className="block text-sm mb-1">Họ tên</label>
						<input className="w-full rounded-md border px-3 py-2" {...register('fullName')} />
						{errors.fullName && <p className="text-danger text-sm mt-1">{errors.fullName.message}</p>}
					</div>
					<div className="grid grid-cols-2 gap-2">
						<div>
							<label className="block text-sm mb-1">Năm sinh</label>
							<input className="w-full rounded-md border px-3 py-2" type="number" {...register('birthYear', { valueAsNumber: true })} />
							{errors.birthYear && <p className="text-danger text-sm mt-1">{errors.birthYear.message}</p>}
						</div>
						<div>
							<label className="block text-sm mb-1">Giới tính</label>
							<select className="w-full rounded-md border px-3 py-2" {...register('gender')}>
								<option value="Nam">Nam</option>
								<option value="Nữ">Nữ</option>
								<option value="Khác">Khác</option>
							</select>
							{errors.gender && <p className="text-danger text-sm mt-1">{errors.gender.message}</p>}
						</div>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<div>
							<label className="block text-sm mb-1">SĐT</label>
							<input className="w-full rounded-md border px-3 py-2" {...register('phone')} />
							{errors.phone && <p className="text-danger text-sm mt-1">{errors.phone.message}</p>}
						</div>
						<div>
							<label className="block text-sm mb-1">Địa chỉ</label>
							<input className="w-full rounded-md border px-3 py-2" {...register('address')} />
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
						<button className="btn-primary" disabled={isSubmitting || mutation.isPending}>
							{mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
						</button>
					</div>
				</form>
			)}
		</Modal>
	)
}
