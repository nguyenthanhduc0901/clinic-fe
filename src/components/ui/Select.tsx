import type { SelectHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = SelectHTMLAttributes<HTMLSelectElement>

const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select ref={ref} className={twMerge('rounded-md border px-3 py-2 bg-white dark:bg-slate-900', className)} {...props} />
  )
})

export default Select



