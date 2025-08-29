import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { updateMedicalRecord } from '@/lib/api/medical-records'
import { toast } from '@/components/ui/Toast'
import DermAIAnalyzer from '@/components/ai/DermAIAnalyzer'
import TextAIAnalyzer from '@/components/ai/TextAIAnalyzer'

type Values = { symptoms?: string; diagnosis?: string; diseaseTypeId?: number; reExaminationDate?: string; notes?: string; status?: 'pending' | 'completed' | 'cancelled' }

export default function MRUpdateModal({ id, initial, open, onClose, onUpdated }: { id: number; initial: any; open: boolean; onClose: () => void; onUpdated: () => void }) {
	const { register, handleSubmit } = useForm<Values>({ defaultValues: {
		symptoms: initial.symptoms ?? '',
		diagnosis: initial.diagnosis ?? '',
		diseaseTypeId: initial.diseaseTypeId ?? undefined,
		reExaminationDate: initial.reExaminationDate ?? '',
		notes: initial.notes ?? '',
		status: initial.status ?? 'pending',
	} })
	const mut = useMutation({
		mutationFn: (v: Values) => updateMedicalRecord(id, {
			symptoms: v.symptoms?.trim() || undefined,
			diagnosis: v.diagnosis?.trim() || undefined,
			diseaseTypeId: v.diseaseTypeId || undefined,
			reExaminationDate: v.reExaminationDate?.trim() || undefined,
			notes: v.notes?.trim() || undefined,
			status: v.status,
		}),
		onSuccess: () => { toast.success('Cập nhật thành công'); onUpdated(); onClose() },
		onError: (e:any)=> toast.error(e?.response?.data?.message || 'Cập nhật thất bại')
	})
	if (!open) return null
	return (
		<Modal open onClose={onClose} title={`Sửa hồ sơ #${id}`}>
			<form className="space-y-3" onSubmit={handleSubmit((v)=> mut.mutate(v))}>
				<div>
					<label className="block text-sm mb-1">Chẩn đoán</label>
					<input className="w-full rounded-md border px-3 py-2" {...register('diagnosis')} />
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Triệu chứng</label>
						<input className="w-full rounded-md border px-3 py-2" {...register('symptoms')} />
					</div>
					<div>
						<label className="block text-sm mb-1">Nhóm bệnh</label>
						<input className="w-full rounded-md border px-3 py-2" type="number" {...register('diseaseTypeId', { valueAsNumber: true })} />
					</div>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Ngày tái khám</label>
						<input className="w-full rounded-md border px-3 py-2" type="date" {...register('reExaminationDate')} />
					</div>
					<div>
						<label className="block text-sm mb-1">Trạng thái</label>
						<select className="w-full rounded-md border px-3 py-2" {...register('status')}>
							<option value="pending">pending</option>
							<option value="completed">completed</option>
							<option value="cancelled">cancelled</option>
						</select>
					</div>
				</div>
				<div>
					<label className="block text-sm mb-1">Ghi chú</label>
					<input id="notes" className="w-full rounded-md border px-3 py-2" {...register('notes')} />
				</div>
				<DermAIAnalyzer onInsertNote={(txt)=> {
					const el = document.getElementById('notes') as HTMLInputElement | null
					if (el) el.value = (el.value ? el.value + ' ' : '') + txt
				}} />
				<TextAIAnalyzer
					initialTranscript={''}
					onInsertSymptoms={(csv)=> {
						const cur = (document.querySelector('input[name="symptoms"]') as HTMLInputElement | null)?.value || ''
						const next = (cur ? cur + ', ' : '') + csv
						try { (document.querySelector('input[name="symptoms"]') as HTMLInputElement | null)!.value = next } catch {}
					}}
					onInsertDiagnosis={(d)=> {
						try { (document.querySelector('input[name="diagnosis"]') as HTMLInputElement | null)!.value = d || '' } catch {}
					}}
				/>
				<div className="text-right">
					<button type="button" className="btn-ghost" onClick={onClose}>Huỷ</button>
					<button className="btn-primary" disabled={mut.isPending}>Lưu</button>
				</div>
			</form>
		</Modal>
	)
}



