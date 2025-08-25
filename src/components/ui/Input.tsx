import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={twMerge('w-full rounded-md border px-3 py-2 bg-white dark:bg-slate-900', className)}
      {...props}
    />
  )
})

export default Input



