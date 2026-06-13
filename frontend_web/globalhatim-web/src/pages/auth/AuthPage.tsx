import {
  useState,
  useRef,
  useCallback,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Input, PasswordInput, Button } from '@/components/common'
import { useAuthStore } from '@/store/auth.store'

// ─── Tab tanımları ────────────────────────────────────────────────────────────
type TabId = 'login' | 'signup'

const TABS: { id: TabId; label: string }[] = [
  { id: 'login', label: 'Login' },
  { id: 'signup', label: 'Sign Up' },
]

// ─── Google SVG ikonu ─────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

// ─── OR ayracı ────────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="flex-1 h-px bg-light-outline dark:bg-dark-outline" />
      <span className="font-sans text-label-md uppercase tracking-widest text-slate-400 dark:text-dark-text-muted/60 select-none">
        OR
      </span>
      <span className="flex-1 h-px bg-light-outline dark:bg-dark-outline" />
    </div>
  )
}

// ─── Login formu ──────────────────────────────────────────────────────────────
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const validate = () => {
    const errs: typeof fieldErrors = {}
    if (!email) errs.email = 'E-posta adresi gerekli.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Geçerli bir e-posta girin.'
    if (!password) errs.password = 'Şifre gerekli.'
    return errs
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch {
      /*
       * store.error  → alert banner (zaten error state'ten okunuyor)
       * store.fieldErrors → alan bazlı sunucu hataları local state'e merge et
       * (kullanıcı yazmaya başlayınca onChange handler ilgili alanı temizler)
       */
      const serverFieldErrs = useAuthStore.getState().fieldErrors
      if (serverFieldErrs) {
        setFieldErrors((prev) => ({ ...prev, ...serverFieldErrs }))
      }
    }
  }

  return (
    <form
      id="panel-login"
      role="tabpanel"
      aria-labelledby="tab-login"
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-6 animate-fade-in"
    >
      {/* API hatası */}
      {error && (
        <div
          role="alert"
          className="rounded border border-error/30 bg-error/10 px-4 py-3 font-sans text-sm text-error"
        >
          {error}
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        autoComplete="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })) }}
        error={fieldErrors.email}
        required
      />

      <PasswordInput
        label="Password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
        error={fieldErrors.password}
        forgotLink={
          <Link
            to="/sifremi-unuttum"
            className={[
              'font-sans text-label-md',
              'text-slate-500 dark:text-gold/70',
              'hover:text-slate-900 dark:hover:text-gold',
              'underline underline-offset-2 transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded',
            ].join(' ')}
          >
            Forgot?
          </Link>
        }
        required
      />

      {/* Sign In butonu */}
      <Button
        type="submit"
        isLoading={isLoading}
        fullWidth
        size="lg"
        className="mt-2"
      >
        Sign In
      </Button>

      <OrDivider />

      {/* Google butonu */}
      <button
        type="button"
        onClick={() => { /* TODO: Google OAuth */ }}
        className={[
          'flex items-center justify-center gap-3 w-full',
          'border rounded py-3 px-5',
          'font-sans font-semibold text-body-md',
          // Light
          'border-slate-300 text-slate-800 bg-transparent',
          'hover:bg-slate-50',
          // Dark
          'dark:border-dark-outline/70 dark:text-dark-text dark:bg-transparent',
          'dark:hover:bg-dark-surface',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
          'focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg',
        ].join(' ')}
        aria-label="Google hesabınla devam et"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </form>
  )
}

// ─── Sign Up formu ────────────────────────────────────────────────────────────
function SignUpForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    password?: string
  }>({})

  const { register, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const validate = () => {
    const errs: typeof fieldErrors = {}
    if (!firstName.trim()) errs.firstName = 'Ad gerekli.'
    if (!lastName.trim()) errs.lastName = 'Soyad gerekli.'
    if (!email) errs.email = 'E-posta adresi gerekli.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Geçerli bir e-posta girin.'
    if (!password) errs.password = 'Şifre gerekli.'
    else if (password.length < 8) errs.password = 'En az 8 karakter olmalı.'
    return errs
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    try {
      await register({ firstName: firstName.trim(), lastName: lastName.trim(), email, password })
      navigate('/', { replace: true })
    } catch {
      const serverFieldErrs = useAuthStore.getState().fieldErrors
      if (serverFieldErrs) {
        setFieldErrors((prev) => ({ ...prev, ...serverFieldErrs }))
      }
    }
  }

  return (
    <form
      id="panel-signup"
      role="tabpanel"
      aria-labelledby="tab-signup"
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 animate-fade-in"
    >
      {error && (
        <div
          role="alert"
          className="rounded border border-error/30 bg-error/10 px-4 py-3 font-sans text-sm text-error"
        >
          {error}
        </div>
      )}

      {/* Ad ve Soyad — yan yana (md ve üstü) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="First Name"
          type="text"
          autoComplete="given-name"
          placeholder="Ahmet"
          value={firstName}
          onChange={(e) => { setFirstName(e.target.value); setFieldErrors((p) => ({ ...p, firstName: undefined })) }}
          error={fieldErrors.firstName}
          required
        />
        <Input
          label="Last Name"
          type="text"
          autoComplete="family-name"
          placeholder="Yılmaz"
          value={lastName}
          onChange={(e) => { setLastName(e.target.value); setFieldErrors((p) => ({ ...p, lastName: undefined })) }}
          error={fieldErrors.lastName}
          required
        />
      </div>

      <Input
        label="Email Address"
        type="email"
        autoComplete="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })) }}
        error={fieldErrors.email}
        required
      />

      <PasswordInput
        label="Password"
        autoComplete="new-password"
        placeholder="••••••••"
        hint="En az 8 karakter"
        value={password}
        onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
        error={fieldErrors.password}
        required
      />

      <Button
        type="submit"
        isLoading={isLoading}
        fullWidth
        size="lg"
        className="mt-2"
      >
        Create Account
      </Button>

      <OrDivider />

      <button
        type="button"
        onClick={() => { /* TODO: Google OAuth */ }}
        className={[
          'flex items-center justify-center gap-3 w-full',
          'border rounded py-3 px-5',
          'font-sans font-semibold text-body-md',
          'border-slate-300 text-slate-800 bg-transparent hover:bg-slate-50',
          'dark:border-dark-outline/70 dark:text-dark-text dark:bg-transparent dark:hover:bg-dark-surface',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
          'focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg',
        ].join(' ')}
        aria-label="Google hesabınla devam et"
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </form>
  )
}

// ─── Ana AuthPage ─────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const clearError = useAuthStore((s) => s.clearError)

  // URL param ile senkron: ?tab=signup → Sign Up sekmesi
  const rawTab = searchParams.get('tab')
  const activeTab: TabId = rawTab === 'signup' ? 'signup' : 'login'

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Sekme değiştirme — hata temizle, URL güncelle
  const switchTab = useCallback(
    (id: TabId) => {
      clearError()
      setSearchParams(id === 'login' ? {} : { tab: id }, { replace: true })
    },
    [clearError, setSearchParams],
  )

  // ── Arrow key navigasyonu (WCAG 4.1.2) ────────────────────────────────────
  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (idx + 1) % TABS.length
      tabRefs.current[next]?.focus()
      switchTab(TABS[next].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (idx - 1 + TABS.length) % TABS.length
      tabRefs.current[prev]?.focus()
      switchTab(TABS[prev].id)
    } else if (e.key === 'Home') {
      e.preventDefault()
      tabRefs.current[0]?.focus()
      switchTab(TABS[0].id)
    } else if (e.key === 'End') {
      e.preventDefault()
      const last = TABS.length - 1
      tabRefs.current[last]?.focus()
      switchTab(TABS[last].id)
    }
  }

  return (
    // Tam ekran dot-grid arka plan
    <div className="dot-grid min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-light-bg dark:bg-dark-bg transition-colors duration-300">

      {/* Glassmorphism kart */}
      <div
        className={[
          'w-full max-w-md rounded-lg overflow-hidden',
          // Light
          'bg-white/90 border border-light-outline shadow-sm',
          // Dark
          'dark:bg-dark-surface/90 dark:border-dark-outline dark:shadow-glass',
          'backdrop-blur-modal',
          'animate-fade-in',
        ].join(' ')}
      >
        {/* ── Üst başlık bölümü ──────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-4 text-center">
          <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-tight text-slate-900 dark:text-gold">
            Global Hatim
          </h1>
          <p className="mt-2 font-sans text-body-md text-dark-text/50 dark:text-dark-text-muted/70">
            Connect and complete the Quran together.
          </p>
        </div>

        {/* ── Tab listesi ─────────────────────────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Giriş veya Kayıt"
          className="flex border-b border-light-outline dark:border-dark-outline"
        >
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                ref={(el) => { tabRefs.current[idx] = el }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                // Aktif sekme Tab ile ulaşılabilir; pasif -1 (ok tuşuyla geçilir)
                tabIndex={isActive ? 0 : -1}
                onClick={() => switchTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={[
                  'flex-1 py-4 font-sans text-label-md uppercase tracking-widest',
                  'transition-all duration-200 relative',
                  'focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-gold',
                  isActive
                    ? // Aktif: alt çizgi + belirgin metin
                      [
                        'font-bold text-slate-900 dark:text-gold',
                        'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5',
                        'after:bg-slate-900 dark:after:bg-gold after:rounded-full',
                      ].join(' ')
                    : // Pasif: soluk
                      'font-normal text-dark-text/40 dark:text-dark-text-muted/50 hover:text-dark-text/70 dark:hover:text-dark-text-muted',
                ].join(' ')}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Form panelleri ───────────────────────────────────────────────── */}
        <div className="px-8 py-7">
          {/*
            Gizli panel: hidden ile DOM'da bırakıyoruz (screen reader erişimi için)
            aria-hidden ile aktif olmayan paneli okuyucudan gizliyoruz
          */}
          <div
            id="panel-login"
            role="tabpanel"
            aria-labelledby="tab-login"
            hidden={activeTab !== 'login'}
            aria-hidden={activeTab !== 'login'}
          >
            <LoginForm />
          </div>
          <div
            id="panel-signup"
            role="tabpanel"
            aria-labelledby="tab-signup"
            hidden={activeTab !== 'signup'}
            aria-hidden={activeTab !== 'signup'}
          >
            <SignUpForm />
          </div>
        </div>
      </div>

      {/* Tema toggle — kartın dışında, sağ üst köşe */}
      <ThemeToggleCorner />
    </div>
  )
}

// ─── Sağ üst köşe tema toggle'ı ──────────────────────────────────────────────
import { useTheme, useToggleTheme } from '@/store/theme.store'

function ThemeToggleCorner() {
  const theme = useTheme()
  const toggle = useToggleTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      aria-pressed={isDark}
      className={[
        'fixed top-4 right-4 z-50',
        'p-2 rounded-full transition-colors duration-200',
        'bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm',
        'border border-light-outline dark:border-dark-outline',
        'text-dark-text/60 dark:text-dark-text-muted',
        'hover:text-slate-900 dark:hover:text-gold',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
      ].join(' ')}
    >
      {isDark ? (
        // Ay ikonu
        <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        // Güneş ikonu
        <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  )
}
