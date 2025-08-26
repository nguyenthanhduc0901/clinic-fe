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

export async function createMedicalRecord(payload: {
  appointmentId: number
  symptoms?: string
  diagnosis: string
  diseaseTypeId?: number
  reExaminationDate?: string
  notes?: string
  prescriptions?: Array<{ medicineId: number; quantity: number; usageInstructionId: number; notes?: string }>
}) {
  const res = await api.post('/medical-records', payload)
  return res.data as { medicalRecord: MedicalRecord; invoiceId: number }
}

export async function addPrescription(recordId: number, payload: { medicineId: number; quantity: number; usageInstructionId: number; notes?: string }) {
  const res = await api.post(`/medical-records/${recordId}/prescriptions`, payload)
  return res.data as Prescription
}

export async function updatePrescription(recordId: number, prescriptionId: number, payload: Partial<{ medicineId: number; quantity: number; usageInstructionId: number; notes?: string }>) {
  const res = await api.patch(`/medical-records/${recordId}/prescriptions/${prescriptionId}`, payload)
  return res.data as Prescription
}

export async function removePrescription(recordId: number, prescriptionId: number) {
  const res = await api.delete(`/medical-records/${recordId}/prescriptions/${prescriptionId}`)
  return res.data as { success: boolean }
}

export async function getInvoiceByRecord(recordId: number) {
  const res = await api.get(`/medical-records/${recordId}/invoice`)
  return res.data as any
}


