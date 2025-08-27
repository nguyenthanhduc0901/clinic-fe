import type { PropsWithChildren } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

type Props = PropsWithChildren<{
  open: boolean
  title: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}>

export default function ConfirmModal({ open, title, confirmText = 'Xác nhận', cancelText = 'Đóng', loading, onConfirm, onClose, children }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        {children}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}> {cancelText} </Button>
          <Button onClick={onConfirm} loading={loading}> {confirmText} </Button>
        </div>
      </div>
    </Modal>
  )
}


