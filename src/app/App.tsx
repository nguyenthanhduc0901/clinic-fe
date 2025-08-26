import AppRoutes from '@/routes/AppRoutes'
import ErrorBoundary from '@/components/app/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}


