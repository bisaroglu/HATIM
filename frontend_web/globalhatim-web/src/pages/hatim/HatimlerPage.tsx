import {
  useState,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common'
import { HatimCard } from '@/components/hatim/HatimCard'
import { HatimCardSkeleton } from '@/components/hatim/HatimCardSkeleton'
import { useHatims, type FilterType } from '@/hooks/useHatims'

// ─── Sabitler ─────────────────────────────────────────────────────────────────

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

// ─── Arama çubuğu ─────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
}

function SearchBar({ value, onChange }: SearchBarProps) {
  const inputId = 'hatim-search'
  return (
    <div className="relative flex-1 min-w-0">
      {/* Büyüteç ikonu */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none"
      >
        <svg className="h-4 w-4 text-slate-400 dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>

      <label htmlFor={inputId} className="sr-only">
        Hatim ara
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder="Binlerce hatim içinde ara..."
        autoComplete="off"
        className={[
          'w-full pl-10 pr-4 py-2.5 rounded-lg',
          'font-sans text-body-md',
          // Light
          'bg-white border border-slate-200 text-slate-900',
          'placeholder:text-slate-400',
          'focus:border-slate-400',
          // Dark
          'dark:bg-dark-surface dark:border-dark-outline dark:text-dark-text',
          'dark:placeholder:text-dark-text-muted/60',
          'dark:focus:border-gold/50',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1',
          'focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg',
        ].join(' ')}
        aria-label="Hatim ara"
      />
    </div>
  )
}

// ─── Filtre badge'leri ────────────────────────────────────────────────────────

interface FilterPillsProps {
  active: FilterType
  onSelect: (f: FilterType) => void
}

function FilterPills({ active, onSelect }: FilterPillsProps) {
  return (
    /*
     * overflow-x-auto + scrollbar-hide → mobilde yatayda kaydırılabilir.
     * pb-1 ekleyerek scroll çubuğu kart border'ını kesmesini önlüyoruz.
     */
    <div
      className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar"
      role="group"
      aria-label="Hatim türü filtresi"
    >
      {FILTERS.map((f) => {
        const isActive = active === f.id
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onSelect(f.id)}
            aria-pressed={isActive}
            className={[
              'flex-shrink-0 px-3.5 py-2 rounded-full',
              'font-sans text-label-md uppercase tracking-widest whitespace-nowrap',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1',
              'focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg',
              isActive
                ? // Aktif: altın dolu
                  'bg-gold-dim text-gold-text dark:bg-gold dark:text-gold-text shadow-sm'
                : // Pasif
                  'bg-white border border-slate-200 text-slate-600 hover:border-slate-400 hover:text-slate-900 ' +
                  'dark:bg-dark-surface dark:border-dark-outline dark:text-dark-text-muted dark:hover:border-gold/50 dark:hover:text-dark-text',
            ].join(' ')}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── "Yeni Hatim Başlat" CTA kartı ───────────────────────────────────────────

function CreateHatimCTACard() {
  return (
    <article
      aria-label="Yeni bir hatim oluştur"
      className={[
        'rounded-lg border-2 border-dashed p-6',
        'flex flex-col items-center justify-center text-center gap-3',
        'min-h-[200px] transition-colors duration-200',
        // Light
        'border-slate-200 hover:border-slate-300 bg-slate-50/50',
        // Dark
        'dark:border-dark-outline dark:hover:border-gold/40 dark:bg-dark-surface/50',
        'group cursor-pointer',
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className={[
          'h-12 w-12 rounded-full flex items-center justify-center',
          'bg-slate-100 group-hover:bg-gold/10 dark:bg-dark-surface-high dark:group-hover:bg-gold/20',
          'transition-colors duration-200',
        ].join(' ')}
      >
        <svg className="h-6 w-6 text-slate-400 group-hover:text-gold-deep dark:text-dark-text-muted dark:group-hover:text-gold transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <div>
        <h3 className="font-serif text-lg text-slate-700 dark:text-dark-text-muted group-hover:text-slate-900 dark:group-hover:text-dark-text transition-colors duration-200">
          Yeni Bir Yolculuk Başlat
        </h3>
        <p className="font-sans text-sm text-slate-400 dark:text-dark-text-muted/60 mt-1">
          Yeni bir Sabit veya Döngülü hatim oluşturun ve topluluğunuzu katılmaya davet edin.
        </p>
      </div>
      <Link
        to="/hatimler/olustur"
        className={[
          'mt-1 font-sans text-label-md uppercase tracking-widest',
          'text-gold-deep dark:text-gold',
          'hover:opacity-70 transition-opacity duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded',
        ].join(' ')}
        aria-label="Yeni hatim oluştur"
      >
        Hatim Oluştur →
      </Link>
    </article>
  )
}

// ─── Boş durum ────────────────────────────────────────────────────────────────

function EmptyState({ searchActive }: { searchActive: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="col-span-full flex flex-col items-center justify-center py-16 text-center gap-4"
    >
      <div
        aria-hidden="true"
        className="h-16 w-16 rounded-full flex items-center justify-center bg-slate-100 dark:bg-dark-surface"
      >
        <svg className="h-8 w-8 text-slate-300 dark:text-dark-text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>
      <div>
        <p className="font-serif text-xl text-slate-700 dark:text-dark-text">
          {searchActive ? 'Sonuç bulunamadı' : 'Henüz hatim yok'}
        </p>
        <p className="font-sans text-sm text-slate-400 dark:text-dark-text-muted/60 mt-1">
          {searchActive
            ? 'Farklı bir arama terimi deneyin veya filtreleri temizleyin.'
            : 'İlk hatimi oluşturmak için "+ Hatim Oluştur" butonuna tıklayın.'}
        </p>
      </div>
    </div>
  )
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────

export default function HatimlerPage() {
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const { hatims, isLoading } = useHatims({ search, filter, tab })

  const handleJoin = useCallback((id: string) => {
    console.log('Katıl:', id)
    // TODO: hatimService.join(id) → store güncelle → toast bildirim
  }, [])

  const handleCreate = useCallback(() => {
    console.log('Hatim oluştur')
    // TODO: modal veya /hatimler/olustur sayfasına yönlendir
  }, [])

  // ── Tab ok tuşu navigasyonu (WCAG 4.1.2) ────────────────────────────────────
  const handleTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const last = PAGE_TABS.length - 1
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = idx < last ? idx + 1 : 0
      tabRefs.current[next]?.focus()
      setTab(PAGE_TABS[next].id)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = idx > 0 ? idx - 1 : last
      tabRefs.current[prev]?.focus()
      setTab(PAGE_TABS[prev].id)
    }
  }

  const isSearchActive = search.trim().length > 0 || filter !== 'all'

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">

      {/* ════════════════════════════════════════════
          KONTROL PANELİ — Başlık + Oluştur butonu
          ════════════════════════════════════════════ */}
      <div className="border-b border-slate-100 dark:border-dark-outline bg-white dark:bg-dark-bg sticky top-16 z-30">
        <div className="container py-5 md:py-6">

          {/* Üst satır: başlık + buton */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <h1 className="font-serif text-headline-lg-mobile md:text-headline-md text-slate-900 dark:text-dark-text">
                Hatim Yönetimi
              </h1>
              <p className="font-sans text-sm text-slate-500 dark:text-dark-text-muted mt-1 max-w-md">
                Toplu okuma halkalarını keşfedin veya topluluğunuz için yeni bir manevi yolculuk başlatın.
              </p>
            </div>

            <Button
              onClick={handleCreate}
              size="md"
              className="sm:flex-shrink-0 self-start sm:self-auto"
              aria-label="Yeni hatim oluştur"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Hatim Oluştur
            </Button>
          </div>

          {/* ── Tab listesi ── */}
          <div
            role="tablist"
            aria-label="Hatim görünümü"
            className="flex gap-0 border-b border-slate-200 dark:border-dark-outline -mb-px"
          >
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
                  onClick={() => setTab(t.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={[
                    'relative px-4 pb-3 pt-1 font-sans text-label-md uppercase tracking-widest',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-gold',
                    isActive
                      ? [
                          'font-semibold text-slate-900 dark:text-gold',
                          'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5',
                          'after:bg-slate-900 dark:after:bg-gold after:rounded-full',
                        ].join(' ')
                      : 'text-slate-400 dark:text-dark-text-muted/60 hover:text-slate-600 dark:hover:text-dark-text-muted',
                  ].join(' ')}
                >
                  {t.label}
                  {/* "Hatimlerim" sekmesinde joined hatim sayısını göster */}
                  {t.id === 'mine' && !isLoading && (
                    <span
                      className={[
                        'ml-1.5 font-sans text-xs px-1.5 py-0.5 rounded-full',
                        isActive
                          ? 'bg-slate-900 text-white dark:bg-gold dark:text-gold-text'
                          : 'bg-slate-100 text-slate-500 dark:bg-dark-surface dark:text-dark-text-muted',
                      ].join(' ')}
                    >
                      {hatims.filter((h) => h.isJoined).length || 0}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════
          ARAMA + FİLTRE ÇUBUĞU
          ════════════════════════════════════════════ */}
      <div className="container py-5">
        <div className="flex flex-col gap-3">
          <SearchBar value={search} onChange={setSearch} />
          <FilterPills active={filter} onSelect={setFilter} />
        </div>
      </div>

      {/* ════════════════════════════════════════════
          HATİM KARTLARI PANELİ
          ════════════════════════════════════════════ */}
      <div
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="container pb-16"
      >
        {/* Sonuç sayısı (screen reader için live region) */}
        {!isLoading && (
          <p
            className="sr-only"
            aria-live="polite"
            aria-atomic="true"
          >
            {hatims.length} hatim listeleniyor
          </p>
        )}

        {/* Grid */}
        <div
          className={[
            'grid gap-4 md:gap-5',
            // Mobile: tek kolon | md: 2 kolon | lg: 3 kolon
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          ].join(' ')}
        >
          {isLoading ? (
            // Skeleton — 6 kart
            Array.from({ length: 6 }).map((_, i) => (
              <HatimCardSkeleton key={i} />
            ))
          ) : hatims.length === 0 ? (
            <EmptyState searchActive={isSearchActive} />
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
              {/* CTA kartı — listenin sonuna eklenir */}
              <CreateHatimCTACard />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
