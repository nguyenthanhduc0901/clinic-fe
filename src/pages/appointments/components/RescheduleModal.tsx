import Modal from '@/components/ui/Modal'
import { useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (dateStr: string) => void
}

export default function RescheduleModal({ open, onClose, onSubmit }: Props) {
  const [date, setDate] = useState('')
  return (
    <Modal open={open} onClose={onClose} title="Dời lịch hẹn">
      <div className="space-y-2">
        <input type="date" className="w-full rounded-md border px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn-primary" disabled={!date} onClick={() => onSubmit(date)}>Xác nhận</button>
        </div>
      </div>
    </Modal>
  )
}


