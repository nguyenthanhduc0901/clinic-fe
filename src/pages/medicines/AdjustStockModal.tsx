import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adjustMedicineStock } from '@/lib/api/medicines'
import { toast } from '@/components/ui/Toast'

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
				<div>
					<label className="block text-sm mb-1">Delta (VD: +10 hoặc -5)</label>
					<input className="w-full rounded-md border px-3 py-2" type="number" {...register('delta', { valueAsNumber: true })} />
				</div>
				<div className="flex justify-end gap-2">
					<button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
					<button className="btn-primary" disabled={isSubmitting || mutation.isPending}>{mutation.isPending ? 'Đang lưu...' : 'Xác nhận'}</button>
				</div>
			</form>
		</Modal>
	)
}
