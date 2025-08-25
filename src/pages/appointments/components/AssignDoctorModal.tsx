import Modal from '@/components/ui/Modal'

type Props = {
  open: boolean
  onClose: () => void
}

export default function AssignDoctorModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Assign Doctor">
      <div className="space-y-2">
        <input className="w-full rounded-md border px-3 py-2" placeholder="Doctor ID" />
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary">Assign</button>
        </div>
      </div>
    </Modal>
  )
}


