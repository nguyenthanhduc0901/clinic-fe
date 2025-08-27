import Modal from '@/components/ui/Modal'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getPatient, updatePatient } from '@/lib/api/patients'
import { toast } from '@/components/ui/Toast'
import { FormField, Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'

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
					<FormField id="fullName" label="Họ tên" error={errors.fullName?.message as any}>
						<Input id="fullName" {...register('fullName')} />
					</FormField>
					<div className="grid grid-cols-2 gap-2">
						<FormField id="birthYear" label="Năm sinh" error={errors.birthYear?.message as any}>
							<Input id="birthYear" type="number" {...register('birthYear', { valueAsNumber: true })} />
						</FormField>
						<FormField id="gender" label="Giới tính" error={errors.gender?.message as any}>
							<select id="gender" className="w-full rounded-md border px-3 py-2" {...register('gender')}>
								<option value="Nam">Nam</option>
								<option value="Nữ">Nữ</option>
								<option value="Khác">Khác</option>
							</select>
						</FormField>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<FormField id="phone" label="SĐT" error={errors.phone?.message as any}>
							<Input id="phone" {...register('phone')} />
						</FormField>
						<FormField id="address" label="Địa chỉ" error={errors.address?.message as any}>
							<Input id="address" {...register('address')} />
						</FormField>
					</div>
					<div className="flex justify-end gap-2">
						<Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
						<Button disabled={isSubmitting || mutation.isPending}>
							{mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
						</Button>
					</div>
				</form>
			)}
		</Modal>
	)
}
