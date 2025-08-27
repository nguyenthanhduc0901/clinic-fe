import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importMedicineStock } from '@/lib/api/medicines'
import { toast } from '@/components/ui/Toast'
import { FormField, Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type Props = { open: boolean; onClose: () => void; id: number }

type FormValues = { quantity: number }

export default function ImportStockModal({ open, onClose, id }: Props) {
	const qc = useQueryClient()
	const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>()

	const mutation = useMutation({
		mutationFn: (values: FormValues) => importMedicineStock(id, { quantity: values.quantity }),
		onSuccess: () => {
			toast.success('Nhập kho thành công')
			qc.invalidateQueries({ queryKey: ['medicines'] })
			onClose()
		},
	})

	return (
		<Modal open={open} onClose={onClose} title={`Nhập kho thuốc #${id}`}>
			<form className="space-y-3" onSubmit={handleSubmit((v)=> mutation.mutate(v))}>
				<FormField id="quantity" label="Số lượng">
					<Input id="quantity" type="number" min={1} {...register('quantity', { valueAsNumber: true })} />
				</FormField>
				<div className="flex justify-end gap-2">
					<Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
					<Button disabled={isSubmitting || mutation.isPending}>{mutation.isPending ? 'Đang lưu...' : 'Xác nhận'}</Button>
				</div>
			</form>
		</Modal>
	)
}


