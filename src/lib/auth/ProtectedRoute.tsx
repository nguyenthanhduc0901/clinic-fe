import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/lib/auth/authStore'
import { can } from '@/lib/auth/ability'
import ForbiddenPage from '@/pages/errors/ForbiddenPage'

type Props = {
  requiredPermissions?: string[]
  children: ReactNode
}

export default function ProtectedRoute({ requiredPermissions, children }: Props) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />

  const userPerms = user?.role?.permissions?.map((p) => p.name) ?? []
  if (!can(userPerms, requiredPermissions)) return <ForbiddenPage />
  return <>{children}</>
}



