import Modal from '@/components/ui/Modal'

type Props = {
  open: boolean
  onClose: () => void
}

export default function RescheduleModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Reschedule Appointment">
      <div className="space-y-2">
        <input type="datetime-local" className="w-full rounded-md border px-3 py-2" />
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary">Reschedule</button>
        </div>
      </div>
    </Modal>
  )
}


