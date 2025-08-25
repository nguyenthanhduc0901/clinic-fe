import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/lib/auth/ProtectedRoute'
import { appRoutes } from '@/routes/config'
import AppShell from '@/components/layout/AppShell'
import Login from '@/pages/auth/Login'
import NotFoundPage from '@/pages/errors/NotFoundPage'
import ForbiddenPage from '@/pages/errors/ForbiddenPage'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {appRoutes.map(({ path, element, requiredPermissions }) => (
            <Route
              key={path}
              path={path.replace(/^\/+/, '')}
              element={<ProtectedRoute requiredPermissions={requiredPermissions}>{element}</ProtectedRoute>}
            />
          ))}
          <Route index element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}



