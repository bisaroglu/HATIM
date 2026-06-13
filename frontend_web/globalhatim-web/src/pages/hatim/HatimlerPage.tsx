import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/common'
import { HatimCard } from '@/components/hatim/HatimCard'
import { HatimCardSkeleton } from '@/components/hatim/HatimCardSkeleton'
import { CreateHatimModal } from '@/components/hatim/CreateHatimModal'
import { useHatims, type FilterType } from '@/hooks/useHatims'
import { useIsAuthenticated } from '@/store/auth.store'

const PAGE_TABS = [
  { id: 'all' as const,  label: 'Tüm Hatimler' },
  { id: 'mine' as const, label: 'Hatimlerim' },
]

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all',      label: 'Tümü' },
  { id: 'sabit',    label: 'Sabit (4 Ay / Ramazan)' },
  { id: 'döngülü',  label: 'Döngülü' },
  { id: 'günlük',   label: 'Günlük' },
  { id: 'haftalık', label: 'Haftalık' },
]

// ─── Hata Banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex items-start justify-between gap-3',
        'rounded-lg border px-4 py-3',
        'border-red-200 bg-red-50 text-red-700',
        'dark:border-error/30 dark:bg-error/10 dark:text-error',
        'font-sans text-sm',
      ].join(' ')}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Hatayı kapat"
        className="flex-shrink-0 text-red-400 hover:text-red-600 dark:text-error/60 dark:hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ─── Arama cubugu ─────────────────────────────────────────────────────────────

function SearchBar({ value, onChange, isLoading }: { value: string; onChange: (v: string) => void; isLoading?: boolean }) {
  const inputId = 'hatim-search'
  return (
    <div className="relative flex-1 min-w-0">
      <div aria-hidden="true" className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
        {isLoading && value.trim() ? (
          <svg className="h-4 w-4 text-gold animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-slate-400 dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        )}
      </div>
      <label htmlFor={inputId} className="sr-only">Hatim ara</label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder="Binlerce hatim içinde ara..."
        autoComplete="off"
        className={[
          'w-full pl-10 pr-4 py-2.5 rounded-lg font-sans text-body-md',
          'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-400',
          'dark:bg-dark-surface dark:border-dark-outline dark:text-dark-text dark:placeholder:text-dark-text-muted/60 dark:focus:border-gold/50',
          'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1',
          'focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg',
        ].join(' ')}
        aria-label="Hatim ara"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Aramayı temizle"
          className="absolute inset-y-0 right-3 flex items-center text-slate-300 hover:text-slate-600 dark:text-dark-text-muted dark:hover:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Filtre badge'leri ────────────────────────────────────────────────────────

function FilterPills({ active, onSelect }: { active: FilterType; onSelect: (f: FilterType) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar" role="group" aria-label="Hatim türü filtresi">
      {FILTERS.map((f) => {
        const isActive = active === f.id
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelect(f.id)}
            aria-pressed={isActive}
            className={[
              'flex-shrink-0 px-3.5 py-2 rounded-full font-sans text-label-md uppercase tracking-widest whitespace-nowrap',
              'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1',
              'focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg',
              isActive
                ? 'bg-gold-dim text-gold-text dark:bg-gold dark:text-gold-text shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:bg-dark-surface dark:border-dark-outline dark:text-dark-text-muted dark:hover:border-gold/50 dark:hover:text-dark-text',
            ].join(' ')}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Misafir Katilim Modali ────────────────────────────────────────────────────

interface GuestJoinModalProps {
  isOpen:    boolean
  onClose:   () => void
  onSubmit:  (firstName: string, lastName: string) => void
  isLoading?: boolean
}

function GuestJoinModal({ isOpen, onClose, onSubmit, isLoading }: GuestJoinModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setFirstName('')
      setLastName('')
      setTimeout(() => firstInputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (firstName.trim() && lastName.trim()) onSubmit(firstName.trim(), lastName.trim())
  }

  if (!isOpen) return null

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="guest-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm rounded-xl shadow-2xl p-6 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-outline">
        <h2 id="guest-modal-title" className="font-serif text-xl text-slate-900 dark:text-dark-text mb-1">
          Misafir Olarak Katıl
        </h2>
        <p className="font-sans text-sm text-slate-500 dark:text-dark-text-muted mb-5">
          Cüz listesinde görünmek için adınızı girin. Hesap oluşturmanıza gerek yok.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="guest-firstname" className="block font-sans text-sm font-medium text-slate-700 dark:text-dark-text mb-1">
              Ad <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="guest-firstname"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
              required
              maxLength={100}
              placeholder="Örn: Ayşe"
              className="w-full px-3 py-2.5 rounded-lg font-sans text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-dark-surface-high dark:border-dark-outline dark:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
          </div>
          <div>
            <label htmlFor="guest-lastname" className="block font-sans text-sm font-medium text-slate-700 dark:text-dark-text mb-1">
              Soyad <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              id="guest-lastname"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
              required
              maxLength={100}
              placeholder="Örn: Yılmaz"
              className="w-full px-3 py-2.5 rounded-lg font-sans text-sm bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-dark-surface-high dark:border-dark-outline dark:text-dark-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} className="flex-1">Vazgeç</Button>
            <Button type="submit" size="sm" disabled={!firstName.trim() || !lastName.trim() || isLoading} className="flex-1">
              {isLoading ? 'Katılıyor...' : 'Katıl'}
            </Button>
          </div>
        </form>
        <p className="font-sans text-xs text-slate-400 dark:text-dark-text-muted/60 text-center mt-4">
          Hesabınız var mı?{' '}
          <a href="/auth" className="text-gold-deep dark:text-gold underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded">
            Giriş yapın
          </a>
        </p>
      </div>
    </div>
  )
}

// ─── "Yeni Hatim Başlat" CTA kartı ───────────────────────────────────────────

function CreateHatimCTACard({ onClick }: { onClick: () => void }) {
  return (
    <article
      aria-label="Yeni bir hatim oluştur"
      className={[
        'rounded-lg border-2 border-dashed p-6 flex flex-col items-center justify-center text-center gap-3',
        'min-h-[200px] transition-colors duration-200 cursor-pointer',
        'border-slate-200 hover:border-slate-300 bg-slate-50/50',
        'dark:border-dark-outline dark:hover:border-gold/40 dark:bg-dark-surface/50 group',
      ].join(' ')}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      role="button"
      tabIndex={0}
    >
      <div aria-hidden="true" className="h-12 w-12 rounded-full flex items-center justify-center bg-slate-100 group-hover:bg-gold/10 dark:bg-dark-surface-high dark:group-hover:bg-gold/20 transition-colors duration-200">
        <svg className="h-6 w-6 text-slate-400 group-hover:text-gold-deep dark:text-dark-text-muted dark:group-hover:text-gold transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <div>
        <h3 className="font-serif text-lg text-slate-700 dark:text-dark-text-muted group-hover:text-slate-900 dark:group-hover:text-dark-text transition-colors duration-200">
          Yeni Bir Yolculuk Başlat
        </h3>
        <p className="font-sans text-sm text-slate-400 dark:text-dark-text-muted/60 mt-1">
          Yeni bir Sabit veya Döngülü hatim oluşturun ve topluluğunuzu davet edin.
        </p>
      </div>
      <span className="font-sans text-label-md uppercase tracking-widest text-gold-deep dark:text-gold" aria-hidden="true">
        Hatim Oluştur →
      </span>
    </article>
  )
}

// ─── Bos durum ────────────────────────────────────────────────────────────────

function EmptyState({ searchActive, onCreateClick }: { searchActive: boolean; onCreateClick: () => void }) {
  return (
    <div role="status" aria-live="polite" className="col-span-full flex flex-col items-center justify-center py-16 text-center gap-4">
      <div aria-hidden="true" className="h-16 w-16 rounded-full flex items-center justify-center bg-slate-100 dark:bg-dark-surface">
        <svg className="h-8 w-8 text-slate-300 dark:text-dark-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
      <div>
        <p className="font-serif text-xl text-slate-700 dark:text-dark-text">
          {searchActive ? 'Sonuç bulunamadı' : 'Henüz hatim yok'}
        </p>
        <p className="font-sans text-sm text-slate-400 dark:text-dark-text-muted/60 mt-1">
          {searchActive ? 'Farklı bir arama terimi deneyin.' : 'İlk hatimi oluşturmak için aşağıdaki butona tıklayın.'}
        </p>
      </div>
      {!searchActive && <Button size="sm" onClick={onCreateClick}>+ Hatim Oluştur</Button>}
    </div>
  )
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function HatimlerPage() {
  const isAuthenticated = useIsAuthenticated()
  const navigate        = useNavigate()

  const [tab, setTab]             = useState<'all' | 'mine'>('all')
  const [filter, setFilter]       = useState<FilterType>('all')
  const [search, setSearch]       = useState('')
  const [isModalOpen, setModal]   = useState(false)
  const [dismissedError, setDE]   = useState(false)
  // Misafir katilim modali state'leri
  const [guestModalHatimId, setGuestModalHatimId] = useState<string | null>(null)
  const [isGuestJoining, setIsGuestJoining]       = useState(false)

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const { hatims, isLoading, isInitialLoading, error, refetch, joinHatim } =
    useHatims({ search, filter, tab })

  const handleFilterChange = useCallback((f: FilterType) => { setFilter(f); setDE(false) }, [])
  const handleTabChange    = useCallback((id: 'all' | 'mine') => { setTab(id); setDE(false) }, [])
  const handleSearchChange = useCallback((v: string) => { setSearch(v); setDE(false) }, [])

  const handleJoin = useCallback((id: string) => {
    if (!isAuthenticated) {
      // Misafir: ad/soyad modali aç (random cüz atar — hesap gerektirmez)
      setGuestModalHatimId(id)
      return
    }
    // Kayitli kullanici: detay sayfasına yönlendir; JoinHatimModal otomatik açılır
    navigate(`/hatimler/${id}`, { state: { openJoin: true } })
  }, [isAuthenticated, navigate])

  const handleGuestJoinSubmit = useCallback(async (firstName: string, lastName: string) => {
    if (!guestModalHatimId) return
    setIsGuestJoining(true)
    await joinHatim(guestModalHatimId, { guestFirstName: firstName, guestLastName: lastName })
    setIsGuestJoining(false)
    setGuestModalHatimId(null)
  }, [guestModalHatimId, joinHatim])

  const handleGuestModalClose = useCallback(() => setGuestModalHatimId(null), [])

  const handleCreate = useCallback(() => {
    if (!isAuthenticated) { navigate('/auth'); return }
    setModal(true)
  }, [isAuthenticated, navigate])

  const handleModalClose   = useCallback(() => setModal(false), [])
  const handleModalCreated = useCallback(() => { setModal(false); refetch() }, [refetch])

  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const last = PAGE_TABS.length - 1
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = idx < last ? idx + 1 : 0
      tabRefs.current[next]?.focus()
      handleTabChange(PAGE_TABS[next].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = idx > 0 ? idx - 1 : last
      tabRefs.current[prev]?.focus()
      handleTabChange(PAGE_TABS[prev].id)
    }
  }

  const isSearchActive = search.trim().length > 0 || filter !== 'all'
  const showError      = !!error && !dismissedError

  return (
    <>
      <CreateHatimModal isOpen={isModalOpen} onClose={handleModalClose} onCreated={handleModalCreated} />

      <GuestJoinModal
        isOpen={guestModalHatimId !== null}
        onClose={handleGuestModalClose}
        onSubmit={handleGuestJoinSubmit}
        isLoading={isGuestJoining}
      />

      <div className="min-h-screen bg-white dark:bg-dark-bg">

        {/* KONTROL PANELI */}
        <div className="border-b border-slate-100 dark:border-dark-outline bg-white dark:bg-dark-bg sticky top-16 z-30">
          <div className="container py-5 md:py-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <div>
                <h1 className="font-serif text-headline-lg-mobile md:text-headline-md text-slate-900 dark:text-dark-text">
                  Hatim Yönetimi
                </h1>
                <p className="font-sans text-sm text-slate-500 dark:text-dark-text-muted mt-1 max-w-md">
                  Toplu okuma halkalarını keşfedin veya yeni bir manevi yolculuk başlatın.
                </p>
              </div>
              <Button onClick={handleCreate} size="md" className="sm:flex-shrink-0 self-start sm:self-auto" aria-label="Yeni hatim oluştur">
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Hatim Oluştur
              </Button>
            </div>

            <div role="tablist" aria-label="Hatim görünümü" className="flex gap-0 border-b border-slate-200 dark:border-dark-outline -mb-px">
              {PAGE_TABS.map((t, idx) => {
                const isActive = tab === t.id
                return (
                  <button
                    key={t.id}
                    id={`tab-${t.id}`}
                    ref={(el) => { tabRefs.current[idx] = el }}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${t.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => handleTabChange(t.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, idx)}
                    className={[
                      'relative px-4 pb-3 pt-1 font-sans text-label-md uppercase tracking-widest',
                      'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-gold',
                      isActive
                        ? 'font-semibold text-slate-900 dark:text-gold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900 dark:after:bg-gold after:rounded-full'
                        : 'text-slate-400 dark:text-dark-text-muted/60 hover:text-slate-600 dark:hover:text-dark-text-muted',
                    ].join(' ')}
                  >
                    {t.label}
                    {t.id === 'mine' && !isInitialLoading && (
                      <span className={[
                        'ml-1.5 font-sans text-xs px-1.5 py-0.5 rounded-full',
                        isActive ? 'bg-slate-900 text-white dark:bg-gold dark:text-gold-text' : 'bg-slate-100 text-slate-500 dark:bg-dark-surface dark:text-dark-text-muted',
                      ].join(' ')}>
                        {hatims.filter((h) => h.isJoined).length}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ARAMA + FILTRE */}
        <div className="container py-5 flex flex-col gap-3">
          <SearchBar value={search} onChange={handleSearchChange} isLoading={isLoading} />
          <FilterPills active={filter} onSelect={handleFilterChange} />
        </div>

        {/* TAB PANELI */}
        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="container pb-16">
          {showError && (
            <div className="mb-4">
              <ErrorBanner message={error!} onDismiss={() => setDE(true)} />
            </div>
          )}

          {!isInitialLoading && (
            <p className="sr-only" aria-live="polite" aria-atomic="true">
              {isLoading ? 'Hatimler yükleniyor...' : `${hatims.length} hatim listeleniyor`}
            </p>
          )}

          <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {isInitialLoading ? (
              Array.from({ length: 6 }).map((_, i) => <HatimCardSkeleton key={i} />)
            ) : hatims.length === 0 ? (
              <EmptyState searchActive={isSearchActive} onCreateClick={handleCreate} />
            ) : (
              <>
                {hatims.map((hatim, idx) => (
                  <HatimCard
                    key={hatim.id}
                    hatim={hatim}
                    featured={idx === 0}
                    onJoin={handleJoin}
                    onEdit={(id) => console.log('Düzenle:', id)}
                    onDelete={(id) => console.log('Sil:', id)}
                  />
                ))}
                <CreateHatimCTACard onClick={handleCreate} />
              </>
            )}
          </div>

          {isLoading && !isInitialLoading && (
            <div className="flex justify-center items-center gap-2 py-6 font-sans text-sm text-slate-400 dark:text-dark-text-muted/60" aria-live="polite" aria-label="Güncelleniyor">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Güncelleniyor...
            </div>
          )}
        </div>
      </div>
    </>
  )
}
