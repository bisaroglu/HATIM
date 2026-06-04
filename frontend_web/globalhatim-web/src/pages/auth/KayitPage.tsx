import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/common'
import { useAuthStore } from '@/store/auth.store'

export default function KayitPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { register, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    await register({ displayName, email, password })
    navigate('/', { replace: true })
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-serif text-headline-md text-dark-text dark:text-dark-text mb-1">
        Hesap oluştur
      </h1>
      <p className="font-sans text-body-md text-dark-text/60 dark:text-dark-text-muted mb-8">
        GlobalHatim'e katıl
      </p>

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
          label="Ad Soyad"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
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
          autoComplete="new-password"
          hint="En az 8 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        <Button type="submit" isLoading={isLoading} fullWidth size="lg">
          Kayıt Ol
        </Button>
      </form>

      <p className="mt-6 text-center font-sans text-body-md text-dark-text/60 dark:text-dark-text-muted">
        Zaten hesabın var mı?{' '}
        <Link
          to="/giris"
          className="text-gold-deep dark:text-gold underline underline-offset-4 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
        >
          Giriş yap
        </Link>
      </p>
    </div>
  )
}
