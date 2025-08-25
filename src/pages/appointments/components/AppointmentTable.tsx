export default function AppointmentTable() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-slate-600">
            <th className="px-3 py-2">Order</th>
            <th className="px-3 py-2">Patient</th>
            <th className="px-3 py-2">Doctor</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Time</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map((i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2">{i}</td>
              <td className="px-3 py-2">Nguyen Van A</td>
              <td className="px-3 py-2">Dr. B</td>
              <td className="px-3 py-2">scheduled</td>
              <td className="px-3 py-2">09:00</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}



