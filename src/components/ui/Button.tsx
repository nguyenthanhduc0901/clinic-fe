import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export default function Button({ className, variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, ...props }: Props) {
  const base =
    variant === 'primary' ? 'bg-primary text-white hover:bg-primary-600 focus-visible:ring-primary-500'
    : variant === 'secondary' ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700'
    : variant === 'danger' ? 'bg-danger text-white hover:bg-red-600 focus-visible:ring-red-500'
    : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800'

  const sizing = size === 'sm' ? 'px-2 py-1 text-xs rounded-sm'
    : size === 'lg' ? 'px-4 py-2 text-base rounded-lg'
    : 'px-3 py-2 text-sm rounded-md'

  return (
    <button
      className={twMerge('inline-flex items-center justify-center font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed', base, sizing, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {leftIcon && <span className={twMerge('mr-2 inline-flex', size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')}>{leftIcon}</span>}
      {loading && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
      <span>{children}</span>
      {rightIcon && <span className={twMerge('ml-2 inline-flex', size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')}>{rightIcon}</span>}
    </button>
  )
}



