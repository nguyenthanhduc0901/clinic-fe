import { useAuthStore } from '@/lib/auth/authStore'

export default function ProfilePage() {
  const { user } = useAuthStore()
  return (
    <div>
      <h1 className="page-title">Profile</h1>
      <div className="card">{user?.email}</div>
    </div>
  )
}



