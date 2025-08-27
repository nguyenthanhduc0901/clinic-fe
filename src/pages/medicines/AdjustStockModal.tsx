import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adjustMedicineStock } from '@/lib/api/medicines'
import { toast } from '@/components/ui/Toast'
import { FormField, Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type Props = { open: boolean; onClose: () => void; id: number }

type FormValues = { delta: number }

export default function AdjustStockModal({ open, onClose, id }: Props) {
	const qc = useQueryClient()
	const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>()

	const mutation = useMutation({
		mutationFn: (values: FormValues) => adjustMedicineStock(id, { delta: values.delta }),
		onSuccess: () => {
			toast.success('Điều chỉnh tồn kho thành công')
			qc.invalidateQueries({ queryKey: ['medicines'] })
			onClose()
		},
	})

	return (
		<Modal open={open} onClose={onClose} title={`Điều chỉnh tồn kho #${id}`}>
			<form className="space-y-3" onSubmit={handleSubmit((v)=> mutation.mutate(v))}>
				<FormField id="delta" label="Delta (VD: +10 hoặc -5)">
					<Input id="delta" type="number" {...register('delta', { valueAsNumber: true })} />
				</FormField>
				<div className="flex justify-end gap-2">
					<Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
					<Button disabled={isSubmitting || mutation.isPending}>{mutation.isPending ? 'Đang lưu...' : 'Xác nhận'}</Button>
				</div>
			</form>
		</Modal>
	)
}


