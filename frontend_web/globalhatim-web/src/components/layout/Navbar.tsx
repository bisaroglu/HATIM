import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/common'
import { useAuthStore, useIsAuthenticated } from '@/store/auth.store'

const NAV_LINKS = [
  { to: '/hatimler', label: 'Hatimler' },
  { to: '/hakkimizda', label: 'Hakkımızda' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const isAuth = useIsAuthenticated()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/auth')
  }

  return (
    <header
      className={[
        'sticky top-0 z-50 w-full',
        // Light: beyaz/yarı saydam; Dark: lacivert/yarı saydam
        'bg-white/80 backdrop-blur-nav border-b border-light-outline',
        'dark:bg-dark-bg/80 dark:border-dark-outline',
      ].join(' ')}
    >
      <nav
        aria-label="Ana navigasyon"
        className="container flex items-center justify-between h-16"
      >
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <Link
          to="/"
          className={[
            'font-serif text-xl font-normal tracking-tight',
            // Light: koyu metin; Dark: açık kırık beyaz
            'text-slate-900 dark:text-dark-text',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded',
          ].join(' ')}
          aria-label="GlobalHatim — Ana Sayfa"
        >
          Global<span className="text-gold-deep dark:text-gold">Hatim</span>
        </Link>

        {/* ── Desktop nav linkleri ──────────────────────────────────────────── */}
        <ul className="hidden md:flex items-center gap-8" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  [
                    'font-sans text-label-md uppercase tracking-widest transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded px-1',
                    isActive
                      ? // Aktif: light → altın koyu; dark → altın
                        'text-gold-deep dark:text-gold font-semibold'
                      : // Pasif: light → koyu slate; dark → muted
                        'text-slate-600 dark:text-dark-text-muted hover:text-slate-900 dark:hover:text-dark-text',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* ── Sağ grup ─────────────────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />

          {isAuth ? (
            <>
              <NavLink
                to="/profilim"
                className={[
                  'font-sans text-label-md uppercase tracking-widest transition-colors duration-150',
                  'text-slate-600 dark:text-dark-text-muted',
                  'hover:text-slate-900 dark:hover:text-dark-text',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded px-1',
                ].join(' ')}
              >
                Profilim
              </NavLink>
              <button
                onClick={handleLogout}
                className={[
                  'font-sans text-label-md uppercase tracking-widest transition-colors duration-150',
                  'text-slate-400 dark:text-dark-text-muted/60',
                  'hover:text-red-600 dark:hover:text-error',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded px-1',
                ].join(' ')}
              >
                Çıkış
              </button>
            </>
          ) : (
            // CTA butonu — Light: siyah zemin beyaz metin | Dark: altın zemin koyu metin
            <Link
              to="/auth"
              className={[
                'font-sans text-label-md uppercase tracking-widest',
                'px-4 py-2 rounded transition-opacity duration-150',
                // Light mode
                'bg-slate-900 text-white hover:bg-slate-700',
                // Dark mode
                'dark:bg-gold-dim dark:text-gold-text dark:hover:bg-gold',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg',
              ].join(' ')}
            >
              Giriş Yap
            </Link>
          )}
        </div>

        {/* ── Mobile hamburger ─────────────────────────────────────────────── */}
        <button
          className={[
            'md:hidden p-2 rounded',
            'text-slate-700 dark:text-dark-text',
            'hover:bg-light-surface dark:hover:bg-dark-surface',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
          ].join(' ')}
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* ── Mobile menu ──────────────────────────────────────────────────────── */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-light-outline dark:border-dark-outline bg-white dark:bg-dark-bg animate-fade-in"
        >
          <nav aria-label="Mobil navigasyon" className="container py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  [
                    'font-sans text-label-md uppercase tracking-widest py-2',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded px-1',
                    isActive
                      ? 'text-gold-deep dark:text-gold font-semibold'
                      : 'text-slate-700 dark:text-dark-text',
                  ].join(' ')
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="flex items-center gap-4 pt-2 border-t border-light-outline dark:border-dark-outline">
              <ThemeToggle />
              {!isAuth && (
                <Link
                  to="/auth"
                  onClick={() => setMenuOpen(false)}
                  className={[
                    'font-sans text-label-md uppercase tracking-widest',
                    'px-4 py-2 rounded',
                    'bg-slate-900 text-white',
                    'dark:bg-gold-dim dark:text-gold-text',
                  ].join(' ')}
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
