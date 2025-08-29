import { Dialog, DialogPanel, DialogTitle, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{
  open: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full'
}>

export default function Modal({ open, onClose, title, size = 'lg', children }: Props) {
  const sizeClass =
    size === 'sm' ? 'max-w-sm' :
    size === 'md' ? 'max-w-md' :
    size === 'lg' ? 'max-w-lg' :
    size === 'xl' ? 'max-w-xl' :
    size === '2xl' ? 'max-w-2xl' :
    size === '3xl' ? 'max-w-3xl' :
    size === '4xl' ? 'max-w-4xl' : 'max-w-7xl'
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className={`w-full ${sizeClass} rounded-lg bg-white dark:bg-slate-900 p-4 max-h-[90vh] overflow-y-auto`}>
            {title && <DialogTitle className="text-lg font-medium mb-2">{title}</DialogTitle>}
            {children}
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  )
}


