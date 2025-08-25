import AppointmentFilters from '@/pages/appointments/components/AppointmentFilters'
import AppointmentTable from '@/pages/appointments/components/AppointmentTable'

export default function ReceptionistView() {
  return (
    <div className="space-y-3">
      <h1 className="page-title">Appointments - Receptionist</h1>
      <div className="card">
        <AppointmentFilters variant="basic" />
      </div>
      <div className="card">
        <div className="mb-2 flex justify-end">
          <button className="btn-primary">Quick Create Appointment</button>
        </div>
        <AppointmentTable />
      </div>
    </div>
  )
}



