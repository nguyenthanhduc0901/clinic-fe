import type { ButtonHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
}

export default function Button({ className, variant = 'primary', ...props }: Props) {
  const base =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'danger'
      ? 'btn-danger'
      : 'btn-ghost'
  return <button className={twMerge(base, className)} {...props} />
}



