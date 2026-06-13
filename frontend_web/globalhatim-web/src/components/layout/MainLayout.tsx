import { Link, Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-slate-900 dark:text-dark-text transition-colors duration-300">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>

      <footer className="border-t border-light-outline dark:border-dark-outline py-8 mt-section">
        <div className="container flex flex-col items-center gap-3">
          <nav aria-label="Footer navigasyon" className="flex items-center gap-6">
            <Link
              to="/hakkimizda"
              className="font-sans text-label-md uppercase tracking-widest text-slate-400 dark:text-dark-text-muted/50 hover:text-slate-600 dark:hover:text-dark-text-muted transition-colors duration-150"
            >
              Hakkımızda
            </Link>
            <Link
              to="/geri-bildirim"
              className="font-sans text-label-md uppercase tracking-widest text-slate-400 dark:text-dark-text-muted/50 hover:text-slate-600 dark:hover:text-dark-text-muted transition-colors duration-150"
            >
              Geri Bildirim
            </Link>
          </nav>
          <p className="font-sans text-label-md uppercase tracking-widest text-slate-400 dark:text-dark-text-muted/50">
            © {new Date().getFullYear()} GlobalHatim — Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  )
}
