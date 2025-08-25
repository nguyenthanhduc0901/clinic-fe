export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="page-title">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card">Appointments today: 12</div>
        <div className="card">Revenue yesterday: 25,000,000₫</div>
        <div className="card">Pending invoices: 8</div>
      </div>
    </div>
  )
}



