import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

export function FormField({ id, label, hint, error, children }: { id: string; label?: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode }) {
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm mb-1 text-neutral-700 dark:text-neutral-200">{label}</label>}
      {children}
      {hint && <div id={`${id}-hint`} className="text-xs text-neutral-500 mt-1">{hint}</div>}
      {error && <div id={`${id}-error`} className="text-xs text-danger mt-1">{error}</div>}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; describedBy?: string }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, describedBy, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={twMerge('w-full rounded-md border px-3 py-2 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500', invalid ? 'border-danger' : 'border-neutral-300 dark:border-neutral-700', className)}
      {...props}
    />
  )
})

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean; describedBy?: string }
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ className, invalid, describedBy, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={twMerge('w-full rounded-md border px-3 py-2 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500', invalid ? 'border-danger' : 'border-neutral-300 dark:border-neutral-700', className)}
      {...props}
    />
  )
})

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean; describedBy?: string }
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, invalid, describedBy, ...props }, ref) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={twMerge('w-full rounded-md border px-3 py-2 bg-white dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500', invalid ? 'border-danger' : 'border-neutral-300 dark:border-neutral-700', className)}
      {...props}
    />
  )
})

export default Input



