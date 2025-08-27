import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAuditLogs, type AuditLog } from '@/lib/api/audit-logs'
import { FormField, Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { SkeletonTable } from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'

const TABLE_OPTIONS = ['patients','appointments','medical_records','invoices','medicines','users','staff','settings','role_permissions']

export default function AuditLogsPage() {
	const [sp, setSp] = useSearchParams()
	const page = Number(sp.get('page') || '1')
	const limit = Number(sp.get('limit') || '50')
	const table = sp.get('table') || ''
	const recordId = sp.get('recordId')
	const userId = sp.get('userId')
	const from = sp.get('from') || ''
	const to = sp.get('to') || ''

	const params = useMemo(() => ({ page, limit, table: table || undefined, recordId: recordId ? Number(recordId) : undefined, userId: userId ? Number(userId) : undefined, from: from || undefined, to: to || undefined }), [page, limit, table, recordId, userId, from, to])
	const { data, isLoading, isError, refetch } = useQuery<{ data: AuditLog[]; page: number; limit: number }>({ queryKey: ['audit-logs', params], queryFn: () => listAuditLogs(params) })

	function changePage(p: number) { setSp((prev) => { prev.set('page', String(p)); return prev }, { replace: true }) }

	const [detail, setDetail] = useState<AuditLog | null>(null)

	return (
		<div className="space-y-3">
			<h1 className="page-title">Audit Logs</h1>
			<div className="card">
				<div className="grid grid-cols-1 md:grid-cols-6 gap-2">
					<FormField id="table" label="Bảng">
						<select id="table" className="w-full rounded-md border px-3 py-2" value={table} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('table', v); else p.delete('table'); p.set('page','1'); return p }, { replace:true })}>
							<option value="">Tất cả bảng</option>
							{TABLE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
						</select>
					</FormField>
					<FormField id="record-id" label="Record ID">
						<Input id="record-id" type="number" placeholder="Record ID" defaultValue={recordId ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('recordId', v); else p.delete('recordId'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<FormField id="user-id" label="User ID">
						<Input id="user-id" type="number" placeholder="User ID" defaultValue={userId ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('userId', v); else p.delete('userId'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<FormField id="from" label="Từ ngày">
						<Input id="from" type="date" value={from} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('from', v); else p.delete('from'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<FormField id="to" label="Đến ngày">
						<Input id="to" type="date" value={to} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('to', v); else p.delete('to'); p.set('page','1'); return p }, { replace:true })} />
					</FormField>
					<FormField id="limit" label="Hiển thị">
						<select id="limit" className="w-full rounded-md border px-2 py-2" value={limit} onChange={(e)=> setSp((p)=>{ p.set('limit', e.target.value); p.set('page','1'); return p }, { replace:true })}>{[20,50,100].map(n=> <option key={n} value={n}>{n}</option>)}</select>
					</FormField>
				</div>
			</div>

			<div className="card">
				{isLoading && <SkeletonTable rows={8} />}
				{isError && <div className="text-danger flex items-center justify-between">Tải dữ liệu thất bại <Button variant="ghost" onClick={()=> refetch()}>Thử lại</Button></div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) === 0 && <div className="empty-state">Không có dữ liệu</div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm table-fixed-header table-zebra table-hover">
							<thead>
								<tr className="text-left text-slate-600">
									<th className="px-3 py-2">ID</th>
									<th className="px-3 py-2">Bảng</th>
									<th className="px-3 py-2">Record</th>
									<th className="px-3 py-2">Hành động</th>
									<th className="px-3 py-2">Thay đổi lúc</th>
									<th className="px-3 py-2">UserId</th>
									<th className="px-3 py-2">Thao tác</th>
								</tr>
							</thead>
							<tbody>
								{data!.data.map((r) => (
									<tr key={r.id} className="border-t">
										<td className="px-3 py-2">{r.id}</td>
										<td className="px-3 py-2">{r.table_name}</td>
										<td className="px-3 py-2">{r.record_id}</td>
										<td className="px-3 py-2">{r.action}</td>
										<td className="px-3 py-2">{new Date(r.changed_at).toLocaleString('vi-VN')}</td>
										<td className="px-3 py-2">{r.changed_by_user_id ?? '-'}</td>
										<td className="px-3 py-2"><Button variant="ghost" size="sm" onClick={()=> setDetail(r)}>Chi tiết</Button></td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				<div className="mt-3 flex items-center justify-between">
					<Button variant="ghost" disabled={page <= 1} onClick={()=> changePage(Math.max(1, page - 1))}>Prev</Button>
					<span className="text-sm text-slate-600">Page {page}</span>
					<Button variant="ghost" onClick={()=> changePage(page + 1)}>Next</Button>
				</div>
			</div>

			{detail && (
				<Modal open onClose={()=> setDetail(null)} title={`Audit #${detail.id} — ${detail.table_name}`}>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div>
							<h3 className="font-medium mb-1">Old data</h3>
							<pre className="bg-slate-100 dark:bg-slate-800 rounded p-2 overflow-auto max-h-[60vh]">{detail.old_data ? JSON.stringify(detail.old_data, null, 2) : 'N/A'}</pre>
						</div>
						<div>
							<h3 className="font-medium mb-1">New data</h3>
							<pre className="bg-slate-100 dark:bg-slate-800 rounded p-2 overflow-auto max-h-[60vh]">{detail.new_data ? JSON.stringify(detail.new_data, null, 2) : 'N/A'}</pre>
						</div>
					</div>
					<div className="text-right mt-3">
						<Button variant="secondary" onClick={()=> setDetail(null)}>Đóng</Button>
					</div>
				</Modal>
			)}
		</div>
	)
}



