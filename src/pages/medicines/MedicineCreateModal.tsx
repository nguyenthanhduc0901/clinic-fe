import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMedicine } from '@/lib/api/medicines'
import { getCatalogs } from '@/lib/api/catalogs'
import { toast } from '@/components/ui/Toast'

const pricePattern = /^\d+(\.\d{1,2})?$/

type FormValues = {
	name: string
	unitId: number
	defaultSupplierId?: number
	price: string
	quantityInStock?: number
	description?: string | null
}

const schema: z.ZodType<FormValues> = z.object({
	name: z.string().min(1, 'Tên bắt buộc'),
	unitId: z.coerce.number().int().min(1, 'Chọn đơn vị'),
	defaultSupplierId: z.coerce.number().int().optional(),
	price: z.string().regex(pricePattern, 'Giá không hợp lệ (vd: 1000 hoặc 1000.50)'),
	quantityInStock: z.coerce.number().int().min(0).optional(),
	description: z.string().optional(),
})

type Props = { open: boolean; onClose: () => void }

export default function MedicineCreateModal({ open, onClose }: Props) {
	const qc = useQueryClient()
	const catalogs = useQuery({ queryKey: ['catalogs'], queryFn: () => getCatalogs(), staleTime: 1000 * 60 * 60 })
	const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
		resolver: zodResolver(schema as any) as unknown as Resolver<FormValues>,
	})

	const mutation = useMutation({
		mutationFn: (values: FormValues) => createMedicine(values),
		onSuccess: () => {
			toast.success('Tạo thuốc thành công')
			qc.invalidateQueries({ queryKey: ['medicines'] })
			reset()
			onClose()
		},
	})

	const onSubmit = (values: FormValues) => mutation.mutate(values)

	return (
		<Modal open={open} onClose={onClose} title="Thêm thuốc">
			<form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
				<div>
					<label className="block text-sm mb-1">Tên thuốc</label>
					<input className="w-full rounded-md border px-3 py-2" {...register('name')} />
					{errors.name && <p className="text-danger text-sm mt-1">{errors.name.message}</p>}
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Đơn vị</label>
						<select className="w-full rounded-md border px-3 py-2" {...register('unitId')}>
							<option value="">-- Chọn --</option>
							{(catalogs.data?.units ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
						</select>
						{errors.unitId && <p className="text-danger text-sm mt-1">{errors.unitId.message as any}</p>}
					</div>
					<div>
						<label className="block text-sm mb-1">Supplier ID (tuỳ chọn)</label>
						<input className="w-full rounded-md border px-3 py-2" type="number" {...register('defaultSupplierId', { valueAsNumber: true })} />
					</div>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Giá</label>
						<input className="w-full rounded-md border px-3 py-2" placeholder="1000.00" {...register('price')} />
						{errors.price && <p className="text-danger text-sm mt-1">{errors.price.message}</p>}
					</div>
					<div>
						<label className="block text-sm mb-1">Tồn kho (khởi tạo)</label>
						<input className="w-full rounded-md border px-3 py-2" type="number" {...register('quantityInStock', { valueAsNumber: true })} />
					</div>
				</div>
				<div>
					<label className="block text-sm mb-1">Mô tả</label>
					<input className="w-full rounded-md border px-3 py-2" {...register('description')} />
				</div>
				<div className="flex justify-end gap-2">
					<button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
					<button className="btn-primary" disabled={isSubmitting || mutation.isPending}>{mutation.isPending ? 'Đang lưu...' : 'Tạo mới'}</button>
				</div>
			</form>
		</Modal>
	)
}
