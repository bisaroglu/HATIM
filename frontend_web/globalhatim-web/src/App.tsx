import { useEffect } from 'react'
import { AppRouter } from '@/router'
import { useAuthStore } from '@/store/auth.store'
import { tokenStorage } from '@/services/api'

export default function App() {
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser)

  // Sayfa yenilendiğinde token varsa kullanıcıyı yükle
  useEffect(() => {
    if (tokenStorage.getAccess()) {
      fetchCurrentUser()
    }
  }, [fetchCurrentUser])

  return (
    <>
      {/* Skip-link — WCAG 2.4.1 Bypass Blocks */}
      <a href="#main-content" className="skip-link">
        İçeriğe geç
      </a>
      <AppRouter />
    </>
  )
}
