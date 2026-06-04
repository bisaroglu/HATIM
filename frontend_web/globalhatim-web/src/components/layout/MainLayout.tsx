import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-slate-900 dark:text-dark-text transition-colors duration-300">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>

      <footer className="border-t border-light-outline dark:border-dark-outline py-8 mt-section">
        <div className="container text-center font-sans text-label-md uppercase tracking-widest text-slate-400 dark:text-dark-text-muted/50">
          © {new Date().getFullYear()} GlobalHatim — Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  )
}
