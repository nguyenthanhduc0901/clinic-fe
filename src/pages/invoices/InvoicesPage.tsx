import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listInvoices, type Invoice, getInvoiceDetail, payInvoice, cancelInvoice, refundInvoice } from '@/lib/api/invoices'
import Pagination from '@/components/ui/Pagination'
import Badge from '@/components/ui/Badge'
import { can } from '@/lib/auth/ability'
import { useAuthStore } from '@/lib/auth/authStore'
import { toast } from '@/components/ui/Toast'
import Button from '@/components/ui/Button'
import { FormField, Input, Select } from '@/components/ui/Input'
import { SkeletonTable } from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useSearchParams } from 'react-router-dom'

export default function InvoicesPage() {
  const [sp, setSp] = useSearchParams()
  const today = new Date().toISOString().slice(0, 10)
  const status = (sp.get('status') as '' | 'pending' | 'paid' | 'cancelled' | 'refunded') || ''
  const date = sp.get('date') || today
  const page = Number(sp.get('page') || '1')
  const limit = Number(sp.get('limit') || '10')
  const filters = useMemo(() => ({ status, date, page, limit }), [status, date, page, limit])

  const { permissions, user } = useAuthStore()
  const perms = permissions.length ? permissions : user?.role?.permissions?.map((p: any) => p.name) ?? []
  const canUpdate = can(perms, ['invoice:update'])

  const { data, isLoading, isError, refetch } = useQuery<{ data: Invoice[]; total: number }>({
    queryKey: ['invoices', filters],
    queryFn: () => listInvoices({ status: (filters.status || undefined) as any, date: filters.date || undefined, page: filters.page, limit: filters.limit }),
  })

  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / (limit || 10)))

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

  function changeStatus(v: '' | 'pending' | 'paid' | 'cancelled' | 'refunded') {
    setSp((p)=>{ if(v) p.set('status', v); else p.delete('status'); p.set('page','1'); return p }, { replace: true })
  }
  function changeDate(v: string) {
    setSp((p)=>{ if(v) p.set('date', v); else p.delete('date'); p.set('page','1'); return p }, { replace: true })
  }
  function changeLimit(n: number) {
    setSp((p)=>{ p.set('limit', String(n)); p.set('page','1'); return p }, { replace: true })
  }
  function changePage(n: number) {
    setSp((p)=>{ p.set('page', String(n)); return p }, { replace: true })
  }

  return (
    <div className="space-y-3">
      <h1 className="page-title">Invoices</h1>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <FormField id="status" label="Trạng thái">
            <Select id="status" value={status} onChange={(e)=> changeStatus(e.target.value as any)}>
              <option value="">Tất cả trạng thái</option>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="cancelled">cancelled</option>
              <option value="refunded">refunded</option>
            </Select>
          </FormField>
          <FormField id="date" label="Ngày">
            <Input id="date" type="date" value={date} onChange={(e)=> changeDate(e.target.value)} />
          </FormField>
          <div className="flex items-end gap-2">
            <span className="text-sm">Hiển thị</span>
            <Select aria-label="Số dòng mỗi trang" value={String(limit)} onChange={(e)=> changeLimit(Number(e.target.value))}>
              {[10,20,50].map(n=> <option key={n} value={n}>{n}</option>)}
            </Select>
          </div>
        </div>
      </div>

      <div className="card">
        {isLoading && <SkeletonTable rows={6} />}
        {isError && <div className="text-danger">Tải dữ liệu thất bại <button className="btn-ghost" onClick={()=> refetch()}>Thử lại</button></div>}
        {!isLoading && !isError && (data?.data?.length ?? 0) === 0 && <div className="empty-state">Không có dữ liệu</div>}
        {!isLoading && !isError && (data?.data?.length ?? 0) > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm table-fixed-header table-zebra table-hover">
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
                      <Button variant="ghost" size="sm" onClick={() => setDetailId(inv.id)}>Chi tiết</Button>
                      {canUpdate && inv.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => setPay({ id: inv.id, paymentMethod: 'cash' })} loading={false}>Thanh toán</Button>
                          <Button variant="ghost" size="sm" onClick={() => setConfirm({ id: inv.id, action: 'cancel' })}>Hủy</Button>
                        </>
                      )}
                      {canUpdate && inv.status === 'paid' && (
                        <Button variant="ghost" size="sm" onClick={() => setConfirm({ id: inv.id, action: 'refund' })}>Hoàn tiền</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination page={page} pageCount={pageCount} onPageChange={changePage} />
        </div>
      </div>

      {/* Detail modal */}
      {detailId != null && detail.data && (
        <Modal open onClose={()=> setDetailId(null)} title={`Chi tiết hóa đơn #${detail.data.invoice.id}`}>
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
        </Modal>
      )}

      {/* Pay modal */}
      {pay && (
        <Modal open onClose={()=> setPay(null)} title="Thanh toán">
          <div className="space-y-3">
            <FormField id="paymentMethod" label="Phương thức">
              <Select id="paymentMethod" value={pay.paymentMethod} onChange={(e)=> setPay((p)=> ({ ...(p as any), paymentMethod: e.target.value as any }))}>
                <option value="cash">cash</option>
                <option value="card">card</option>
                <option value="transfer">transfer</option>
              </Select>
            </FormField>
            <FormField id="pay-notes" label="Ghi chú (tuỳ chọn)">
              <Input id="pay-notes" placeholder="Nhập ghi chú" value={pay.notes ?? ''} onChange={(e)=> setPay((p)=> ({ ...(p as any), notes: e.target.value }))} />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={()=> setPay(null)} disabled={payMut.isPending}>Đóng</Button>
              <Button onClick={()=> payMut.mutate({ id: pay.id, paymentMethod: pay.paymentMethod, notes: pay.notes })} loading={payMut.isPending}>Xác nhận</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel/Refund confirm */}
      {confirm && (
        <ConfirmModal
          open={true}
          title={confirm.action === 'cancel' ? 'Hủy hóa đơn' : 'Hoàn tiền'}
          onClose={()=> setConfirm(null)}
          onConfirm={()=> confirm.action === 'cancel' ? cancelMut.mutate({ id: confirm.id, reason: confirm.reason }) : refundMut.mutate({ id: confirm.id, reason: confirm.reason })}
          loading={cancelMut.isPending || refundMut.isPending}
          confirmText={confirm.action === 'cancel' ? 'Xác nhận hủy' : 'Xác nhận hoàn'}
        >
          <FormField id="reason" label="Lý do (tuỳ chọn)">
            <Input id="reason" placeholder="Nhập lý do" value={confirm.reason ?? ''} onChange={(e)=> setConfirm((c)=> ({ ...(c as any), reason: e.target.value }))} />
          </FormField>
        </ConfirmModal>
      )}
    </div>
  )
}

function mapInvoiceColor(status: 'pending' | 'paid' | 'cancelled' | 'refunded'): 'primary' | 'neutral' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'pending':
      return 'warning'
    case 'cancelled':
      return 'danger'
    case 'refunded':
      return 'neutral'
    default:
      return 'primary'
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



