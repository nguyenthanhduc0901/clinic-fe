import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listAttachments, uploadAttachment, deleteAttachment, downloadAttachment, type Attachment } from '@/lib/api/attachments'
import { toast } from '@/components/ui/Toast'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'

type Props = { recordId: number }

const ACCEPT = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']

export default function AttachmentsPanel({ recordId }: Props) {
	const qc = useQueryClient()
	const { user, permissions } = useAuthStore()
	const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
	const canRead = can(perms, ['medical_record:read'])
	const canWrite = can(perms, ['medical_record:update'])

	const { data, isLoading, isError } = useQuery({
		queryKey: ['attachments', recordId],
		queryFn: () => listAttachments(recordId),
		enabled: !!recordId && canRead,
	})

	const [dragOver, setDragOver] = useState(false)
	const [fileQueue, setFileQueue] = useState<Array<{ file: File; description?: string; progress: number; status: 'pending'|'uploading'|'done'|'error'; error?: string }>>([])
	const [desc, setDesc] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

	const uploadMut = useMutation({
		mutationFn: async (item: { file: File; description?: string }) => {
			return uploadAttachment(recordId, item.file, item.description, (pct)=> {
				setFileQueue((q)=> q.map((it)=> it.file === item.file ? { ...it, progress: pct } : it))
			})
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['attachments', recordId] })
		},
		onError: (e: any, item) => {
			const msg = e?.response?.data?.message || e?.message || 'Tải lên thất bại'
			setFileQueue((q)=> q.map((it)=> it.file === item.file ? { ...it, status: 'error', error: msg } : it))
		},
	})

	function onDropFiles(files: FileList) {
		const arr = Array.from(files)
		const filtered = arr.filter((f) => isAccept(f))
		const rejected = arr.filter((f) => !isAccept(f))
		if (rejected.length) toast.error('Định dạng file không được hỗ trợ')
		const queued = filtered.map((f) => ({ file: f, description: desc || undefined, progress: 0, status: 'pending' as const }))
		setFileQueue((q) => [...q, ...queued])
	}

	async function startUpload() {
		if (!canWrite) return
		for (const item of fileQueue) {
			if (item.status !== 'pending') continue
			setFileQueue((q)=> q.map((it)=> it.file === item.file ? { ...it, status: 'uploading' } : it))
			try {
				await uploadMut.mutateAsync({ file: item.file, description: item.description })
				setFileQueue((q)=> q.map((it)=> it.file === item.file ? { ...it, status: 'done' } : it))
			} catch {}
		}
		toast.success('Tải lên hoàn tất')
		setFileQueue([])
		setDesc('')
	}

	function onBrowseClick() {
		inputRef.current?.click()
	}

	function onChooseFiles(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files
		if (files) onDropFiles(files)
		e.currentTarget.value = ''
	}

	const delMut = useMutation({
		mutationFn: (id: number) => deleteAttachment(recordId, id),
		onSuccess: () => { toast.success('Đã xoá tệp'); qc.invalidateQueries({ queryKey: ['attachments', recordId] }) },
		onError: (e:any)=> toast.error(e?.response?.data?.message || 'Xoá thất bại')
	})

	const [preview, setPreview] = useState<{ type: 'image'|'pdf'; url: string; name: string } | null>(null)
	const dlMut = useMutation({
		mutationFn: async (att: Attachment) => {
			const blob = await downloadAttachment(recordId, att.id)
			const url = URL.createObjectURL(blob)
			if (att.fileType?.includes('pdf')) setPreview({ type: 'pdf', url, name: att.fileName })
			else if (att.fileType?.startsWith('image/')) setPreview({ type: 'image', url, name: att.fileName })
			else {
				triggerDownload(url, att.fileName)
				URL.revokeObjectURL(url)
			}
		},
	})

	useEffect(()=> () => { if (preview) URL.revokeObjectURL(preview.url) }, [preview])

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="font-medium">Đính kèm</h3>
				{canWrite && (
					<div className="flex items-center gap-2">
						<input ref={inputRef} type="file" className="hidden" multiple accept={ACCEPT.join(',')} onChange={onChooseFiles} />
						<input className="rounded-md border px-2 py-1 w-64" placeholder="Mô tả (tuỳ chọn)" value={desc} onChange={(e)=> setDesc(e.target.value)} />
						<button className="btn" onClick={onBrowseClick}>Chọn file</button>
					</div>
				)}
			</div>

			{canWrite && (
				<div
					className={`rounded-md border border-dashed p-4 text-center ${dragOver ? 'bg-slate-50' : ''}`}
					onDragOver={(e)=> { e.preventDefault(); setDragOver(true) }}
					onDragLeave={()=> setDragOver(false)}
					onDrop={(e)=> { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files) onDropFiles(e.dataTransfer.files) }}
				>
					<p>Kéo–thả file vào đây hoặc bấm “Chọn file”</p>
					<p className="text-xs text-slate-500 mt-1">Hỗ trợ: {ACCEPT.join(', ')}; tối đa 10MB</p>
				</div>
			)}

			{fileQueue.length > 0 && (
				<div className="space-y-2">
					{fileQueue.map((f)=> (
						<div key={f.file.name + f.file.size} className="flex items-center justify-between rounded-md border px-3 py-2">
							<div className="truncate w-2/3" title={f.file.name}>{f.file.name}</div>
							<div className="flex items-center gap-2">
								<div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
									<div className="bg-primary-500 h-2" style={{ width: `${f.progress}%` }} />
								</div>
								<span className="text-xs w-10 text-right">{f.progress}%</span>
							</div>
						</div>
					))}
					<div className="text-right">
						<button className="btn-primary" onClick={startUpload} disabled={uploadMut.isPending}>Tải lên</button>
					</div>
				</div>
			)}

			<div className="card">
				{isLoading && <div>Đang tải đính kèm...</div>}
				{isError && <div className="text-danger">Tải đính kèm thất bại</div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) === 0 && <div>Chưa có tệp đính kèm</div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
					<ul className="divide-y">
						{data!.data.map((att) => (
							<li key={att.id} className="flex items-center justify-between py-2">
								<div className="flex items-center gap-3 min-w-0">
									<FileIcon type={att.fileType} />
									<div className="min-w-0">
										<div className="truncate max-w-[40ch]" title={att.fileName}>{att.fileName}</div>
										<div className="text-xs text-slate-500">{att.description || '-'} · {new Date(att.createdAt).toLocaleString('vi-VN')}</div>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<button className="btn-ghost" onClick={()=> dlMut.mutate(att)}>Tải xuống/Preview</button>
									{canWrite && <button className="btn-ghost" onClick={()=> onConfirmDelete(att.id)} disabled={delMut.isPending}>Xoá</button>}
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			{preview && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<div className="absolute inset-0 bg-black/40" onClick={()=> closePreview()} />
					<div className="relative z-10 w-full max-w-5xl rounded-lg bg-white dark:bg-slate-900 p-4 h-[80vh]">
						<div className="flex items-center justify-between mb-2">
							<h4 className="font-medium truncate" title={preview.name}>{preview.name}</h4>
							<div className="flex items-center gap-2">
								<button className="btn-ghost" onClick={()=> downloadCurrent()}>Tải về</button>
								<button className="btn-ghost" onClick={()=> closePreview()}>Đóng</button>
							</div>
						</div>
						<div className="w-full h-full overflow-hidden">
							{preview.type === 'image' ? (
								<img src={preview.url} alt="preview" className="max-h-full object-contain mx-auto" />
							) : (
								<iframe src={preview.url} className="w-full h-full" title="PDF preview" />
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	)

	function isAccept(file: File) {
		const lower = file.name.toLowerCase()
		return ACCEPT.some((ext) => lower.endsWith(ext)) && file.size <= 10 * 1024 * 1024
	}

	function onConfirmDelete(id: number) {
		if (!confirm('Bạn có chắc muốn xoá tệp này?')) return
		delMut.mutate(id)
	}

	function triggerDownload(url: string, fileName: string) {
		const a = document.createElement('a')
		a.href = url
		a.download = fileName
		a.click()
	}

	function closePreview() {
		if (preview) URL.revokeObjectURL(preview.url)
		setPreview(null)
	}

	async function downloadCurrent() {
		if (!preview) return
		triggerDownload(preview.url, preview.name)
	}
}

function FileIcon({ type }: { type?: string }) {
	if (!type) return <span className="inline-block w-5 h-5 bg-slate-300 rounded" />
	if (type.includes('pdf')) return <span className="inline-block w-5 h-5 bg-red-500 rounded" title="PDF" />
	if (type.startsWith('image/')) return <span className="inline-block w-5 h-5 bg-green-500 rounded" title="IMG" />
	return <span className="inline-block w-5 h-5 bg-blue-500 rounded" title="DOC" />
}


