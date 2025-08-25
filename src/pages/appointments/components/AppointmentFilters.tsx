type Props = { variant: 'basic' | 'advanced' }

export default function AppointmentFilters({ variant }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
      <input className="rounded-md border px-3 py-2" placeholder="Search by name/code" />
      <input className="rounded-md border px-3 py-2" type="date" />
      {variant === 'advanced' && (
        <>
          <select className="rounded-md border px-3 py-2">
            <option>All status</option>
          </select>
          <input className="rounded-md border px-3 py-2" placeholder="Doctor ID" />
        </>
      )}
    </div>
  )
}



