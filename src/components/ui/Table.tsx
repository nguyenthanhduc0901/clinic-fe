import type { PropsWithChildren } from 'react'

export function Table({ children }: PropsWithChildren) {
  return <table className="min-w-full text-sm">{children}</table>
}
export function THead({ children }: PropsWithChildren) {
  return <thead className="text-left text-slate-600">{children}</thead>
}
export function TBody({ children }: PropsWithChildren) {
  return <tbody>{children}</tbody>
}
export function TR({ children }: PropsWithChildren) {
  return <tr className="border-t">{children}</tr>
}
export function TH({ children }: PropsWithChildren) {
  return <th className="px-3 py-2">{children}</th>
}
export function TD({ children }: PropsWithChildren) {
  return <td className="px-3 py-2">{children}</td>
}



