import { Navigate, useLocation } from 'react-router-dom'
import { useIsAuthenticated } from '@/store/auth.store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Kimlik doğrulama gerektiren sayfalara erişimi korur.
 * Giriş yapılmamışsa /giris'e yönlendirir, geri dönüş URL'ini state'e taşır.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuth = useIsAuthenticated()
  const location = useLocation()

  if (!isAuth) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  return <>{children}</>
}
