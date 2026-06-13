// ─────────────────────────────────────────────────────────────────────────────
// Geri Bildirim Sayfası — Light/Dark tam uyumlu, a11y-safe
// Giriş yapmış kullanıcıların Ad Soyad + E-posta alanları otomatik dolu ve kilitli.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { feedbackService } from '@/services/feedback.service'
import { parseApiError } from '@/utils/apiError'

// ── Spinner bileşeni ─────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ── Başarı banner'ı ──────────────────────────────────────────────────────────
function SuccessBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={[
        'flex items-start gap-3 rounded-xl border px-5 py-4',
        'border-emerald-200 bg-emerald-50 text-emerald-800',
        'dark:border-emerald-700/40 dark:bg-emerald-900/20 dark:text-emerald-300',
        'animate-fade-in',
      ].join(' ')}
    >
      <svg aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="font-sans text-sm font-semibold">
          Geri bildiriminiz başarıyla iletildi.
        </p>
        <p className="font-sans text-sm mt-0.5 opacity-80">
          En kısa sürede değerlendireceğiz. Teşekkür ederiz!
        </p>
      </div>
    </div>
  )
}

// ── Alan bileşeni ────────────────────────────────────────────────────────────
interface FieldProps {
  id: string
  label: string
  error?: string
  required?: boolean
  disabled?: boolean
  children: React.ReactNode
}

function Field({ id, label, error, required, disabled, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-sans text-label-md uppercase tracking-widest text-slate-600 dark:text-gold/80"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-1 text-red-500 dark:text-error">*</span>
        )}
      </label>
      <div className={disabled ? 'opacity-50' : ''}>{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="font-sans text-xs text-red-600 dark:text-error">
          {error}
        </p>
      )}
    </div>
  )
}

const inputCls = (disabled?: boolean) =>
  [
    'w-full bg-transparent py-2',
    'border-b border-slate-300 dark:border-dark-outline',
    'font-sans text-body-md text-slate-900 dark:text-dark-text',
    'placeholder:text-slate-400 dark:placeholder:text-dark-text-muted/40',
    'focus:outline-none focus:border-slate-900 dark:focus:border-gold',
    'transition-colors duration-150 focus-visible:ring-0',
    disabled ? 'cursor-not-allowed' : '',
  ].join(' ')

// ── Ana bileşen ──────────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const user = useAuthStore((s) => s.user)

  // Giriş yapmış kullanıcının adı: displayName veya ad+soyad
  const prefillName  = user?.displayName ?? ''
  const prefillEmail = user?.email       ?? ''
  const isLoggedIn   = !!user

  const [name,      setName]      = useState(prefillName)
  const [email,     setEmail]     = useState(prefillEmail)
  const [message,   setMessage]   = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [fieldErrors, setFE]      = useState<Record<string, string>>({})
  const [sent,      setSent]      = useState(false)

  // ── Validasyon ─────────────────────────────────────────────────────────────
  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!name.trim())              errs.name    = 'Ad Soyad gerekli.'
    if (name.trim().length > 150)  errs.name    = 'Ad Soyad en fazla 150 karakter olabilir.'
    if (!message.trim())           errs.message = 'Mesaj gerekli.'
    if (message.trim().length < 10) errs.message = 'Mesaj en az 10 karakter olmalıdır.'
    if (message.trim().length > 2000) errs.message = 'Mesaj en fazla 2000 karakter olabilir.'
    return errs
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const errs = validate()
    if (Object.keys(errs).length) { setFE(errs); return }
    setFE({})

    setIsLoading(true)
    try {
      await feedbackService.send({
        name:    name.trim(),
        email:   email.trim() || undefined,   // 'emailOrPhone' değil, net 'email' alanı
        message: message.trim(),
        userId:  user?.id || undefined,       // giriş yapmışsa opsiyonel GUID
      })
      setSent(true)
    } catch (err) {
      const parsed = parseApiError(err)
      setError(parsed.message)
      if (parsed.fieldErrors) setFE(parsed.fieldErrors)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] bg-white dark:bg-dark-bg">
      {/* Hero */}
      <section className="container pt-16 pb-10 text-center">
        <p className="font-sans text-label-md uppercase tracking-widest text-gold-deep dark:text-gold mb-3">
          İletişim
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-slate-900 dark:text-dark-text leading-tight">
          Geri Bildirim
        </h1>
        <p className="mt-4 font-sans text-body-lg text-slate-500 dark:text-dark-text-muted max-w-xl mx-auto">
          Öneri, şikâyet veya teşekkürünüzü paylaşın — her mesaj bizim için değerli.
        </p>
      </section>

      {/* Form kartı */}
      <section className="container pb-20 flex justify-center">
        <div
          className={[
            'w-full max-w-lg rounded-2xl',
            'bg-white/70 dark:bg-dark-surface/70',
            'border border-slate-200/60 dark:border-dark-outline/60',
            'shadow-xl dark:shadow-glass',
            'backdrop-blur-md',
            'p-8',
          ].join(' ')}
        >
          {sent ? (
            <SuccessBanner />
          ) : (
            <form onSubmit={handleSubmit} noValidate aria-busy={isLoading} className="flex flex-col gap-6">
              {/* Genel hata */}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700 dark:border-error/30 dark:bg-error/10 dark:text-error"
                >
                  {error}
                </div>
              )}

              {/* Ad Soyad */}
              <Field
                id="fb-name"
                label="Ad Soyad"
                error={fieldErrors.name}
                required
                disabled={isLoggedIn}
              >
                <input
                  id="fb-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFE((p) => ({ ...p, name: undefined! })) }}
                  disabled={isLoggedIn}
                  required
                  autoComplete="name"
                  placeholder="Adınız Soyadınız"
                  aria-describedby={fieldErrors.name ? 'fb-name-error' : undefined}
                  aria-invalid={!!fieldErrors.name}
                  className={inputCls(isLoggedIn)}
                />
              </Field>

              {/* E-Posta */}
              <Field
                id="fb-email"
                label="E-Posta"
                error={fieldErrors.email}
                disabled={isLoggedIn}
              >
                <input
                  id="fb-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFE((p) => ({ ...p, email: undefined! })) }}
                  disabled={isLoggedIn}
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  aria-describedby={fieldErrors.email ? 'fb-email-error' : undefined}
                  aria-invalid={!!fieldErrors.email}
                  className={inputCls(isLoggedIn)}
                />
              </Field>

              {/* Mesaj */}
              <Field
                id="fb-message"
                label="Mesajınız"
                error={fieldErrors.message}
                required
              >
                <textarea
                  id="fb-message"
                  rows={5}
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setFE((p) => ({ ...p, message: undefined! })) }}
                  required
                  placeholder="Görüşlerinizi buraya yazın..."
                  aria-describedby={fieldErrors.message ? 'fb-message-error' : undefined}
                  aria-invalid={!!fieldErrors.message}
                  className={[
                    'w-full bg-transparent py-2',
                    'border-b border-slate-300 dark:border-dark-outline',
                    'font-sans text-body-md text-slate-900 dark:text-dark-text',
                    'placeholder:text-slate-400 dark:placeholder:text-dark-text-muted/40',
                    'focus:outline-none focus:border-slate-900 dark:focus:border-gold',
                    'transition-colors duration-150 resize-none focus-visible:ring-0',
                  ].join(' ')}
                />
                <p
                  aria-live="polite"
                  className="mt-1 font-sans text-xs text-right text-slate-400 dark:text-dark-text-muted/50"
                >
                  {message.length} / 2000
                </p>
              </Field>

              {/* Gönder */}
              <button
                type="submit"
                disabled={isLoading}
                className={[
                  'flex items-center justify-center gap-2 w-full',
                  'py-3 px-6 rounded-xl font-sans text-label-md uppercase tracking-widest',
                  'bg-slate-900 text-white dark:bg-gold-dim dark:text-gold-text',
                  'hover:bg-slate-700 dark:hover:bg-gold',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface',
                ].join(' ')}
              >
                {isLoading && <Spinner />}
                {isLoading ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
