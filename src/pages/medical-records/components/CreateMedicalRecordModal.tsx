import Modal from '@/components/ui/Modal'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createMedicalRecord } from '@/lib/api/medical-records'
import { useNavigate } from 'react-router-dom'
import { getCatalogs } from '@/lib/api/catalogs'
import { listMedicines } from '@/lib/api/medicines'
import { useState } from 'react'
import { toast } from '@/components/ui/Toast'

type Props = { open: boolean; onClose: () => void; appointmentId: number | null }

type PrescriptionRow = { medicineId?: number; quantity?: number; usageInstructionId?: number; notes?: string }

type FormValues = {
	diagnosis: string
	symptoms?: string
	diseaseTypeId?: number
	reExaminationDate?: string
	notes?: string
	prescriptions: PrescriptionRow[]
}

export default function CreateMedicalRecordModal({ open, onClose, appointmentId }: Props) {
	const navigate = useNavigate()
	const qc = useQueryClient()
	const catalogs = useQuery({ queryKey: ['catalogs'], queryFn: () => getCatalogs(), staleTime: 1000 * 60 * 10 })
	const { register, handleSubmit, control } = useForm<FormValues>({ defaultValues: { prescriptions: [{}] } })
	const { fields, append, remove } = useFieldArray({ control, name: 'prescriptions' })
	const [q, setQ] = useState('')
	const meds = useQuery({ queryKey: ['medicines-autocomplete', q], queryFn: () => listMedicines({ q, page: 1, limit: 10 }), enabled: q.length > 0 })

	const mut = useMutation({
		mutationFn: (values: FormValues) => {
			const validPres = (values.prescriptions || []).filter((r)=> r.medicineId && r.quantity && r.usageInstructionId) as Array<{ medicineId: number; quantity: number; usageInstructionId: number; notes?: string }>
			const payload = {
				appointmentId: appointmentId!,
				diagnosis: values.diagnosis,
				symptoms: values.symptoms?.trim() ? values.symptoms : undefined,
				diseaseTypeId: values.diseaseTypeId && !Number.isNaN(values.diseaseTypeId as any) ? values.diseaseTypeId : undefined,
				reExaminationDate: values.reExaminationDate?.trim() ? values.reExaminationDate : undefined,
				notes: values.notes?.trim() ? values.notes : undefined,
				prescriptions: validPres.length ? validPres : undefined,
			}
			return createMedicalRecord(payload as any)
		},
		onSuccess: (data: any) => {
			toast.success('Tạo hồ sơ thành công')
			qc.invalidateQueries({ queryKey: ['medical-records'] })
			onClose()
			navigate(`/medical-records?recordId=${data?.medicalRecord?.id}`)
		},
		onError: (err: any) => {
			toast.error(err?.response?.data?.message || 'Tạo hồ sơ thất bại')
		},
	})

	if (!open || !appointmentId) return null

	return (
		<Modal open onClose={onClose} title={`Tạo bệnh án từ lịch hẹn #${appointmentId}`}>
			<form className="space-y-3" onSubmit={handleSubmit((v)=> mut.mutate(v))}>
				<div>
					<label className="block text-sm mb-1">Chẩn đoán</label>
					<input className="w-full rounded-md border px-3 py-2" {...register('diagnosis', { required: true })} />
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Triệu chứng</label>
						<input className="w-full rounded-md border px-3 py-2" {...register('symptoms')} />
					</div>
					<div>
						<label className="block text-sm mb-1">Nhóm bệnh</label>
						<select className="w-full rounded-md border px-3 py-2" {...register('diseaseTypeId', { valueAsNumber: true })}> 
							<option value="">--</option>
							{(catalogs.data?.diseaseTypes ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
						</select>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Ngày tái khám</label>
						<input className="w-full rounded-md border px-3 py-2" type="date" {...register('reExaminationDate')} />
					</div>
					<div>
						<label className="block text-sm mb-1">Ghi chú</label>
						<input className="w-full rounded-md border px-3 py-2" {...register('notes')} />
					</div>
				</div>

				<div>
					<h3 className="font-medium mb-1">Prescriptions</h3>
					<div className="space-y-2">
						{fields.map((f, idx) => (
							<div key={f.id} className="grid grid-cols-4 gap-2">
								<div>
									<input className="w-full rounded-md border px-3 py-2" placeholder="Tìm thuốc..." onChange={(e)=> setQ(e.target.value)} />
									<select className="w-full rounded-md border px-3 py-2 mt-1" {...register(`prescriptions.${idx}.medicineId` as const, { valueAsNumber: true })}>
										<option value="">-- chọn thuốc --</option>
										{(meds.data?.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
									</select>
								</div>
								<div>
									<input className="w-full rounded-md border px-3 py-2" type="number" placeholder="Số lượng" {...register(`prescriptions.${idx}.quantity` as const, { valueAsNumber: true })} />
								</div>
								<div>
									<select className="w-full rounded-md border px-3 py-2" {...register(`prescriptions.${idx}.usageInstructionId` as const, { valueAsNumber: true })}>
										<option value="">-- hướng dẫn sử dụng --</option>
										{(catalogs.data?.usageInstructions ?? []).map((u) => <option key={u.id} value={u.id}>{u.instruction}</option>)}
									</select>
								</div>
								<div className="flex gap-2">
									<input className="w-full rounded-md border px-3 py-2" placeholder="Ghi chú" {...register(`prescriptions.${idx}.notes` as const)} />
									<button type="button" className="btn-ghost" onClick={()=> remove(idx)}>Xóa</button>
								</div>
							</div>
						))}
						<button type="button" className="btn-ghost" onClick={()=> append({})}>+ Thêm dòng</button>
					</div>
				</div>

				<div className="text-right">
					<button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
					<button className="btn-primary" disabled={mut.isPending}>{mut.isPending ? 'Đang lưu...' : 'Tạo hồ sơ'}</button>
				</div>
			</form>
		</Modal>
	)
}
