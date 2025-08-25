import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  open: boolean
  onClose: () => void
  title?: string
}>

export default function Modal({ open, onClose, title, children }: Props) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-lg rounded-lg bg-white dark:bg-slate-900 p-4">
            {title && <DialogTitle className="text-lg font-medium mb-2">{title}</DialogTitle>}
            {children}
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  )
}


