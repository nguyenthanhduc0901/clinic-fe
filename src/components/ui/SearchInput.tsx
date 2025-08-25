import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

export default function SearchInput(props: Props) {
  return <input {...props} className="rounded-md border px-3 py-2" placeholder={props.placeholder ?? 'Search...'} />
}


