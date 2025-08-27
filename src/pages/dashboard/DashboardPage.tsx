import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = useQuery({
    queryKey: ['today-summary', today],
    queryFn: async () => {
      const res = await api.get(`/appointments/today/summary?date=${today}`)
      return (res.data as Record<string, number>) || {}
    },
  })

  return (
    <div className="space-y-4">
      <h1 className="page-title">Bảng điều khiển</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card">Chờ: {data?.waiting ?? 0}</div>
        <div className="card">Đã xác nhận: {data?.confirmed ?? 0}</div>
        <div className="card">Hoàn tất: {data?.completed ?? 0}</div>
      </div>
    </div>
  )
}



