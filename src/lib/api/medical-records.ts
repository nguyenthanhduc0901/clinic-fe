import { api } from '@/lib/api/axios'

export type MedicalRecordStatus = 'pending' | 'completed' | 'cancelled'

export type MedicalRecord = {
  id: number
  patientId: number
  doctorId: number
  appointmentId?: number
  examinationDate: string
  symptoms?: string | null
  diagnosis?: string | null
  diseaseTypeId?: number | null
  vitalSigns?: unknown | null
  reExaminationDate?: string | null
  notes?: string | null
  status: MedicalRecordStatus
  patient?: { id: number; fullName?: string }
  doctor?: { id: number; fullName?: string }
}

export type Prescription = {
  id: number
  medicalRecordId: number
  medicineId: number
  quantity: number
  usageInstructionId: number
  notes?: string | null
  medicineName?: string
  usageInstruction?: string
  medicinePrice?: string
}

export async function listMedicalRecords(params: {
  page?: number
  limit?: number
  patientId?: number
  doctorId?: number
  dateFrom?: string
  dateTo?: string
  status?: MedicalRecordStatus
}) {
  const res = await api.get('/medical-records', { params })
  return res.data as { data: MedicalRecord[]; total: number }
}

export async function getMedicalRecordDetail(id: number) {
  const res = await api.get(`/medical-records/${id}`)
  return res.data as { medicalRecord: MedicalRecord; prescriptions: Prescription[] }
}

export async function exportMedicalRecordPdf(id: number): Promise<Blob> {
  const res = await api.get(`/medical-records/${id}/export.pdf`, { responseType: 'blob' })
  return res.data as Blob
}


