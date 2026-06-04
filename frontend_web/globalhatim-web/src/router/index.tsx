import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { MainLayout, ProtectedRoute } from '@/components/layout'

// ─── Lazy-loaded sayfalar ─────────────────────────────────────────────────────
const HomePage       = lazy(() => import('@/pages/public/HomePage'))
const HakkimizdaPage = lazy(() => import('@/pages/public/HakkimizdaPage'))
const HatimlerPage   = lazy(() => import('@/pages/hatim/HatimlerPage'))
const HatimDetayPage = lazy(() => import('@/pages/hatim/HatimDetayPage'))
const ProfilPage     = lazy(() => import('@/pages/profile/ProfilPage'))
const AuthPage       = lazy(() => import('@/pages/auth/AuthPage'))
const NotFoundPage   = lazy(() => import('@/pages/public/NotFoundPage'))

// ─── Loading fallback ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center bg-light-bg dark:bg-dark-bg"
      role="status"
      aria-label="Sayfa yükleniyor"
    >
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-gold animate-dot-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  )
}

const wrap = (Page: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Page />
  </Suspense>
)

// ─── Router tanımı ────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  // ── Public + authenticated — MainLayout ───────────────────────────────────
  {
    element: <MainLayout />,
    children: [
      { path: '/',            element: wrap(HomePage) },
      { path: '/hakkimizda',  element: wrap(HakkimizdaPage) },
      { path: '/hatimler',    element: wrap(HatimlerPage) },
      { path: '/hatimler/:id', element: wrap(HatimDetayPage) },
      {
        path: '/profilim',
        element: (
          <ProtectedRoute>
            {wrap(ProfilPage)}
          </ProtectedRoute>
        ),
      },
    ],
  },

  // ── Auth sayfası — kendi dot-grid layout'u var, AuthLayout'a gerek yok ───
  //    /giris         → Login sekmesi (varsayılan)
  //    /kayit         → Sign Up sekmesi (?tab=signup ile yönlendirme)
  //    /auth?tab=...  → Doğrudan AuthPage (Navbar linkleri buraya)
  {
    path: '/auth',
    element: wrap(AuthPage),
  },
  {
    // /giris → /auth (Login sekmesi varsayılan)
    path: '/giris',
    element: <Navigate to="/auth" replace />,
  },
  {
    // /kayit → /auth?tab=signup
    path: '/kayit',
    element: <Navigate to="/auth?tab=signup" replace />,
  },

  // ── 404 ──────────────────────────────────────────────────────────────────
  { path: '*', element: wrap(NotFoundPage) },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
