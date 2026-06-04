import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button, Input } from '@/components/common'
import { useAuthStore } from '@/store/auth.store'

export default function GirisPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    await login({ email, password })
    navigate(from, { replace: true })
  }

  return (
    <div className="animate-fade-in">
      {/* Başlık */}
      <h1 className="font-serif text-headline-md text-dark-text dark:text-dark-text mb-1">
        Hoş geldin
      </h1>
      <p className="font-sans text-body-md text-dark-text/60 dark:text-dark-text-muted mb-8">
        Hesabına giriş yap
      </p>

      {/* Global hata */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded border border-error/30 bg-error/10 px-4 py-3 font-sans text-body-md text-error"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <Input
          label="E-posta"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Şifre"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" isLoading={isLoading} fullWidth size="lg">
          Giriş Yap
        </Button>
      </form>

      <p className="mt-6 text-center font-sans text-body-md text-dark-text/60 dark:text-dark-text-muted">
        Hesabın yok mu?{' '}
        <Link
          to="/kayit"
          className="text-gold-deep dark:text-gold underline underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
        >
          Kayıt ol
        </Link>
      </p>
    </div>
  )
}
