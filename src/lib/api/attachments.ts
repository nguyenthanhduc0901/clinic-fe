import { api } from '@/lib/api/axios'

export type Attachment = {
	id: number
	medicalRecordId: number
	uploadedByUserId: number
	fileName: string
	filePath: string
	fileType: string
	description?: string | null
	createdAt: string
}

export async function listAttachments(recordId: number): Promise<{ data: Attachment[] }> {
	const res = await api.get(`/medical-records/${recordId}/attachments`)
	return res.data as { data: Attachment[] }
}

export async function uploadAttachment(
	recordId: number,
	file: File,
	description?: string,
	onProgress?: (pct: number) => void,
): Promise<Attachment> {
	const form = new FormData()
	form.append('file', file)
	if (description && description.trim()) form.append('description', description)
	const res = await api.post(`/medical-records/${recordId}/attachments`, form, {
		headers: { 'Content-Type': 'multipart/form-data' },
		onUploadProgress: (evt) => {
			if (!evt.total) return
			const pct = Math.round((evt.loaded * 100) / evt.total)
			onProgress?.(pct)
		},
	})
	return res.data as Attachment
}

export async function downloadAttachment(recordId: number, attachmentId: number): Promise<Blob> {
	const res = await api.get(`/medical-records/${recordId}/attachments/${attachmentId}/download`, { responseType: 'blob' })
	return res.data as Blob
}

export async function deleteAttachment(recordId: number, attachmentId: number): Promise<{ success: boolean }> {
	const res = await api.delete(`/medical-records/${recordId}/attachments/${attachmentId}`)
	return res.data as { success: boolean }
}


