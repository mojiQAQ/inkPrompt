/**
 * Protected route component that requires authentication
 */
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/hooks/useI18n'
import { buildRedirectTarget, persistPostAuthRedirect } from '@/utils/authRedirect'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { t } = useI18n()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-700 mx-auto"></div>
          <p className="mt-4 text-ink-600">{t('auth.loading')}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    persistPostAuthRedirect(
      buildRedirectTarget({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
      }),
    )

    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
