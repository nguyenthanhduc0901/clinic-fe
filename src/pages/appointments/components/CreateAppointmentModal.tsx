import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createAppointment } from '@/lib/api/appointments'
import { listPatients } from '@/lib/api/patients'
import { listStaff } from '@/lib/api/staff'
import { useState } from 'react'
import { toast } from '@/components/ui/Toast'

type Values = { patientId?: number; appointmentDate: string; staffId?: number; notes?: string }

export default function CreateAppointmentModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
	const { register, handleSubmit, reset } = useForm<Values>()
	const [qPatient, setQPatient] = useState('')
	const [qStaff, setQStaff] = useState('')
	const patients = useQuery({ queryKey: ['patients-autocomplete', qPatient], queryFn: () => listPatients({ q: qPatient, page: 1, limit: 10 }), enabled: qPatient.length > 0 })
	const staff = useQuery({ queryKey: ['staff-autocomplete', qStaff], queryFn: () => listStaff({ q: qStaff, page: 1, limit: 10 }), enabled: qStaff.length > 0 })
	const mut = useMutation({
		mutationFn: (v: Values) => createAppointment({ patientId: v.patientId!, appointmentDate: v.appointmentDate, staffId: v.staffId || undefined, notes: v.notes?.trim() || undefined }),
		onSuccess: () => { toast.success('Tạo lịch hẹn thành công'); onCreated(); reset(); onClose() },
		onError: (e:any)=> toast.error(e?.response?.data?.message || 'Tạo lịch hẹn thất bại'),
	})
	if (!open) return null
	return (
		<Modal open onClose={onClose} title="Tạo lịch hẹn">
			<form className="space-y-3" onSubmit={handleSubmit((v)=> mut.mutate(v))}>
				<div>
					<label className="block text-sm mb-1">Bệnh nhân</label>
					<input className="w-full rounded-md border px-3 py-2" placeholder="Tìm bệnh nhân..." onChange={(e)=> setQPatient(e.target.value)} />
					<select className="w-full rounded-md border px-3 py-2 mt-1" {...register('patientId', { valueAsNumber: true, required: true })}>
						<option value="">-- chọn bệnh nhân --</option>
						{(patients.data?.data ?? []).map((p)=> <option key={p.id} value={p.id}>{p.fullName}</option>)}
					</select>
				</div>
				<div className="grid grid-cols-2 gap-2">
					<div>
						<label className="block text-sm mb-1">Ngày hẹn</label>
						<input className="w-full rounded-md border px-3 py-2" type="date" {...register('appointmentDate', { required: true })} />
					</div>
					<div>
						<label className="block text-sm mb-1">Bác sĩ (tuỳ chọn)</label>
						<input className="w-full rounded-md border px-3 py-2" placeholder="Tìm bác sĩ..." onChange={(e)=> setQStaff(e.target.value)} />
						<select className="w-full rounded-md border px-3 py-2 mt-1" {...register('staffId', { valueAsNumber: true })}>
							<option value="">-- chọn bác sĩ --</option>
							{(staff.data?.data ?? []).map((s)=> <option key={s.id} value={s.id}>{s.fullName}</option>)}
						</select>
					</div>
				</div>
				<div>
					<label className="block text-sm mb-1">Ghi chú</label>
					<input className="w-full rounded-md border px-3 py-2" {...register('notes')} />
				</div>
				<div className="text-right">
					<button type="button" className="btn-ghost" onClick={onClose}>Huỷ</button>
					<button className="btn-primary" disabled={mut.isPending}>Tạo</button>
				</div>
			</form>
		</Modal>
	)
}



