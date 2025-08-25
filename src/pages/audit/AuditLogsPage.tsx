import { useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listAuditLogs, type AuditLog } from '@/lib/api/audit-logs'

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
	const { data, isLoading, isError } = useQuery<{ data: AuditLog[]; page: number; limit: number }>({ queryKey: ['audit-logs', params], queryFn: () => listAuditLogs(params) })

	function changePage(p: number) { setSp((prev) => { prev.set('page', String(p)); return prev }, { replace: true }) }

	const [detail, setDetail] = useState<AuditLog | null>(null)

	return (
		<div className="space-y-3">
			<h1 className="page-title">Audit Logs</h1>
			<div className="card">
				<div className="grid grid-cols-1 md:grid-cols-6 gap-2">
					<select className="rounded-md border px-3 py-2" value={table} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('table', v); else p.delete('table'); p.set('page','1'); return p }, { replace:true })}>
						<option value="">Tất cả bảng</option>
						{TABLE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
					</select>
					<input className="rounded-md border px-3 py-2" type="number" placeholder="Record ID" defaultValue={recordId ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('recordId', v); else p.delete('recordId'); p.set('page','1'); return p }, { replace:true })} />
					<input className="rounded-md border px-3 py-2" type="number" placeholder="User ID" defaultValue={userId ?? ''} onBlur={(e)=> setSp((p)=>{ const v=e.target.value.trim(); if(v) p.set('userId', v); else p.delete('userId'); p.set('page','1'); return p }, { replace:true })} />
					<input className="rounded-md border px-3 py-2" type="date" value={from} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('from', v); else p.delete('from'); p.set('page','1'); return p }, { replace:true })} />
					<input className="rounded-md border px-3 py-2" type="date" value={to} onChange={(e)=> setSp((p)=>{ const v=e.target.value; if(v) p.set('to', v); else p.delete('to'); p.set('page','1'); return p }, { replace:true })} />
					<div className="flex items-center gap-2">
						<span className="text-sm">Hiển thị</span>
						<select className="rounded-md border px-2 py-1" value={limit} onChange={(e)=> setSp((p)=>{ p.set('limit', e.target.value); p.set('page','1'); return p }, { replace:true })}>{[20,50,100].map(n=> <option key={n} value={n}>{n}</option>)}</select>
					</div>
				</div>
			</div>

			<div className="card">
				{isLoading && <div>Đang tải...</div>}
				{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) === 0 && <div>Không có dữ liệu</div>}
				{!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="text-left text-slate-600">
									<th className="px-3 py-2">ID</th>
									<th className="px-3 py-2">Table</th>
									<th className="px-3 py-2">Record</th>
									<th className="px-3 py-2">Action</th>
									<th className="px-3 py-2">ChangedAt</th>
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
										<td className="px-3 py-2"><button className="btn-ghost" onClick={()=> setDetail(r)}>Chi tiết</button></td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				<div className="mt-3 flex items-center justify-between">
					<button className="btn-ghost" disabled={page <= 1} onClick={()=> changePage(Math.max(1, page - 1))}>Prev</button>
					<span className="text-sm text-slate-600">Page {page}</span>
					<button className="btn-ghost" onClick={()=> changePage(page + 1)}>Next</button>
				</div>
			</div>

			{detail && <DetailModal log={detail} onClose={()=> setDetail(null)} />}
		</div>
	)
}

function DetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/40" onClick={onClose} />
			<div className="relative z-10 w-full max-w-4xl rounded-lg bg-white dark:bg-slate-900 p-4">
				<div className="flex items-center justify-between mb-2">
					<h2 className="text-lg font-medium">Audit #{log.id} — {log.table_name}</h2>
					<button className="btn-ghost" onClick={onClose}>Đóng</button>
				</div>
				<div className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<h3 className="font-medium mb-1">Old data</h3>
						<pre className="bg-slate-100 dark:bg-slate-800 rounded p-2 overflow-auto max-h-[60vh]">{log.old_data ? JSON.stringify(log.old_data, null, 2) : 'N/A'}</pre>
					</div>
					<div>
						<h3 className="font-medium mb-1">New data</h3>
						<pre className="bg-slate-100 dark:bg-slate-800 rounded p-2 overflow-auto max-h-[60vh]">{log.new_data ? JSON.stringify(log.new_data, null, 2) : 'N/A'}</pre>
					</div>
				</div>
			</div>
		</div>
	)
}



