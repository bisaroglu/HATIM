import { Outlet, Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/common'

export function AuthLayout() {
  return (
    // Dot-grid arka planı index.css'deki .dot-grid class'ından geliyor
    <div className="dot-grid min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-dark-text dark:text-dark-text transition-colors duration-300">
      {/* Minimal header */}
      <header className="container flex items-center justify-between h-16">
        <Link
          to="/"
          className="font-serif text-xl text-dark-text dark:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
          aria-label="GlobalHatim — Ana Sayfa"
        >
          Global<span className="text-gold-deep dark:text-gold">Hatim</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Ortalanmış form alanı */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex items-center justify-center px-4 py-12 outline-none"
      >
        <div className="w-full max-w-md">
          {/* Glassmorphism card */}
          <div
            className={[
              'rounded-lg p-8 md:p-10',
              'bg-white/80 backdrop-blur-modal shadow-glass border border-light-outline',
              'dark:bg-dark-surface/80 dark:backdrop-blur-modal dark:border-dark-outline dark:shadow-glass',
              'animate-fade-in',
            ].join(' ')}
          >
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
