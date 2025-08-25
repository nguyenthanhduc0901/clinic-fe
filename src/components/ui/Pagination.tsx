type Props = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, pageCount, onPageChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button className="btn-ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Prev
      </button>
      <span className="text-sm">
        Page {page} / {pageCount}
      </span>
      <button className="btn-ghost" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  )
}



