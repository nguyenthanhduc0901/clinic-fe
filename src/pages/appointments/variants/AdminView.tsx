import AppointmentFilters from '@/pages/appointments/components/AppointmentFilters'
import AppointmentTable from '@/pages/appointments/components/AppointmentTable'

export default function AdminView() {
  return (
    <div className="space-y-3">
      <h1 className="page-title">Appointments - Admin</h1>
      <div className="card">
        <AppointmentFilters variant="advanced" />
      </div>
      <div className="card">
        <AppointmentTable />
      </div>
    </div>
  )
}



