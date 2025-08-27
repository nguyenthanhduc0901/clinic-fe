import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listInvoices, type Invoice, getInvoiceDetail, payInvoice, cancelInvoice, refundInvoice } from '@/lib/api/invoices'
import Pagination from '@/components/ui/Pagination'
import Badge from '@/components/ui/Badge'
import { can } from '@/lib/auth/ability'
import { useAuthStore } from '@/lib/auth/authStore'
import { toast } from '@/components/ui/Toast'

export default function InvoicesPage() {
  const today = new Date().toISOString().slice(0, 10)
  const [filters, setFilters] = useState<{ status: '' | 'pending' | 'paid' | 'cancelled' | 'refunded'; date: string; page: number; limit: number }>({ status: '', date: today, page: 1, limit: 10 })

  const { permissions, user } = useAuthStore()
  const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
  const canUpdate = can(perms, ['invoice:update'])

  const { data, isLoading, isError } = useQuery<{ data: Invoice[]; total: number }>({
    queryKey: ['invoices', filters],
    queryFn: () => listInvoices({ status: filters.status || undefined, date: filters.date || undefined, page: filters.page, limit: filters.limit }),
  })

  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / (filters.limit || 10)))

  const qc = useQueryClient()
  const [detailId, setDetailId] = useState<number | null>(null)
  const detail = useQuery({
    queryKey: ['invoice-detail', detailId],
    enabled: detailId != null,
    queryFn: () => getInvoiceDetail(detailId!),
  })

  const payMut = useMutation({
    mutationFn: ({ id, paymentMethod, notes }: { id: number; paymentMethod: 'cash' | 'card' | 'transfer'; notes?: string }) => payInvoice(id, { paymentMethod, notes }),
    onSuccess: () => {
      toast.success('Thanh toán thành công')
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice-detail'] })
      setPay(null)
    },
  })
  const cancelMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => cancelInvoice(id, reason),
    onSuccess: () => {
      toast.success('Hủy hóa đơn thành công')
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice-detail'] })
      setConfirm(null)
    },
  })
  const refundMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => refundInvoice(id, reason),
    onSuccess: () => {
      toast.success('Hoàn tiền thành công')
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice-detail'] })
      setConfirm(null)
    },
  })

  const [pay, setPay] = useState<{ id: number; paymentMethod: 'cash' | 'card' | 'transfer'; notes?: string } | null>(null)
  const [confirm, setConfirm] = useState<{ id: number; action: 'cancel' | 'refund'; reason?: string } | null>(null)

  return (
    <div className="space-y-3">
      <h1 className="page-title">Invoices</h1>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <select className="rounded-md border px-3 py-2" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as any, page: 1 }))}>
            <option value="">Tất cả trạng thái</option>
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="cancelled">cancelled</option>
            <option value="refunded">refunded</option>
          </select>
          <input className="rounded-md border px-3 py-2" type="date" value={filters.date} onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value, page: 1 }))} />
          <div className="flex items-center gap-2">
            <span className="text-sm">Hiển thị</span>
            <select className="rounded-md border px-2 py-1" value={filters.limit} onChange={(e) => setFilters((f) => ({ ...f, limit: Number(e.target.value), page: 1 }))}>
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
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
                  <th className="px-3 py-2">Mã HĐ</th>
                  <th className="px-3 py-2">Ngày thanh toán</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="px-3 py-2">Tổng tiền</th>
                  <th className="px-3 py-2">Phương thức</th>
                  <th className="px-3 py-2">Ghi chú</th>
                  <th className="px-3 py-2">Thao thác</th>
                </tr>
              </thead>
              <tbody>
                {data!.data.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="px-3 py-2">{inv.id}</td>
                    <td className="px-3 py-2">{inv.paymentDate ? new Date(inv.paymentDate).toLocaleString('vi-VN') : '-'}</td>
                    <td className="px-3 py-2"><Badge color={mapInvoiceColor(inv.status)}>{inv.status}</Badge></td>
                    <td className="px-3 py-2">{formatVnd(inv.totalFee)}</td>
                    <td className="px-3 py-2">{inv.paymentMethod ?? '-'}</td>
                    <td className="px-3 py-2">{inv.notes ?? '-'}</td>
                    <td className="px-3 py-2 flex gap-2">
                      <button className="btn-ghost" onClick={() => setDetailId(inv.id)}>Chi tiết</button>
                      {canUpdate && inv.status === 'pending' && (
                        <>
                          <button className="btn" onClick={() => setPay({ id: inv.id, paymentMethod: 'cash' })}>Pay</button>
                          <button className="btn-ghost" onClick={() => setConfirm({ id: inv.id, action: 'cancel' })}>Cancel</button>
                        </>
                      )}
                      {canUpdate && inv.status === 'paid' && (
                        <button className="btn-ghost" onClick={() => setConfirm({ id: inv.id, action: 'refund' })}>Refund</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={filters.page} pageCount={pageCount} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
        </div>
      </div>

      {/* Detail modal */}
      {detailId != null && detail.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailId(null)} />
          <div className="relative z-10 w-full max-w-3xl rounded-lg bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-medium">Chi tiết hóa đơn #{detail.data.invoice.id}</h2>
              <button className="btn-ghost" onClick={() => setDetailId(null)}>Đóng</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><strong>Bệnh nhân:</strong> {detail.data.patient?.fullName ?? '-'}</div>
              <div><strong>Bác sĩ:</strong> {detail.data.doctor?.fullName ?? '-'}</div>
              <div><strong>Trạng thái:</strong> {detail.data.invoice.status}</div>
              <div><strong>Tổng tiền:</strong> {formatVnd(detail.data.invoice.totalFee)}</div>
            </div>
            <h3 className="mt-3 font-medium">Đơn thuốc</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="px-3 py-2">medicineId</th>
                    <th className="px-3 py-2">SL</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.data.prescriptions.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">{p.medicineId}</td>
                      <td className="px-3 py-2">{p.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pay modal */}
      {pay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPay(null)} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white dark:bg-slate-900 p-4 space-y-3">
            <h2 className="text-lg font-medium">Thanh toán</h2>
            <select className="rounded-md border px-3 py-2" value={pay.paymentMethod} onChange={(e) => setPay((p) => ({ ...(p as any), paymentMethod: e.target.value as any }))}>
              <option value="cash">cash</option>
              <option value="card">card</option>
              <option value="transfer">transfer</option>
            </select>
            <input className="rounded-md border px-3 py-2" placeholder="Ghi chú (tuỳ chọn)" value={pay.notes ?? ''} onChange={(e) => setPay((p) => ({ ...(p as any), notes: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setPay(null)} disabled={payMut.isPending}>Đóng</button>
              <button className="btn-primary" onClick={() => payMut.mutate({ id: pay.id, paymentMethod: pay.paymentMethod, notes: pay.notes })} disabled={payMut.isPending}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel/Refund confirm */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirm(null)} />
          <div className="relative z-10 w-full max-w-md rounded-lg bg-white dark:bg-slate-900 p-4 space-y-3">
            <h2 className="text-lg font-medium">{confirm.action === 'cancel' ? 'Hủy hóa đơn' : 'Hoàn tiền'}</h2>
            <input className="rounded-md border px-3 py-2" placeholder="Lý do (tuỳ chọn)" value={confirm.reason ?? ''} onChange={(e) => setConfirm((c) => ({ ...(c as any), reason: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setConfirm(null)} disabled={cancelMut.isPending || refundMut.isPending}>Đóng</button>
              {confirm.action === 'cancel' ? (
                <button className="btn" onClick={() => cancelMut.mutate({ id: confirm.id, reason: confirm.reason })} disabled={cancelMut.isPending}>Xác nhận hủy</button>
              ) : (
                <button className="btn" onClick={() => refundMut.mutate({ id: confirm.id, reason: confirm.reason })} disabled={refundMut.isPending}>Xác nhận hoàn</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function mapInvoiceColor(status: 'pending' | 'paid' | 'cancelled' | 'refunded'): 'primary' | 'success' | 'warning' | 'danger' | 'indigo' {
  switch (status) {
    case 'paid':
      return 'success' as any
    case 'pending':
      return 'warning' as any
    case 'cancelled':
      return 'danger' as any
    case 'refunded':
      return 'indigo' as any
    default:
      return 'primary' as any
  }
}

function formatVnd(v: string | number) {
  const n = typeof v === 'string' ? Number(v) : v
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)
  } catch {
    return String(v)
  }
}



