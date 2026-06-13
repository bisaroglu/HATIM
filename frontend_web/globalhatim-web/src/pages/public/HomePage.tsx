import { Link } from 'react-router-dom'
import { ProgressBar, AvatarGroup } from '@/components/common'
import { useActiveHatims, type ActiveHatimCard } from '@/hooks/useActiveHatims'

// ─────────────────────────────────────────────────────────────────────────────
// 1. HERO BÖLÜMܼ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kuran kitabı fotoğrafı üzerine overlay — karanlık gradient ile metin
 * kontrastı WCAG AA (4.5:1) seviyesinde tutulur.
 *
 * Mobile: Dikey ortalanmış, serif alıntı stili
 * Desktop: Sol hizalı geniş hero layout
 */
function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative w-full overflow-hidden"
      style={{ minHeight: 'clamp(380px, 60vh, 640px)' }}
    >
      {/* ── Arka plan fotoğrafı ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1600&q=80)',
        }}
      />

      {/* ── Overlay: light'ta daha şeffaf, dark'ta daha koyu ── */}
      <div
        aria-hidden="true"
        className={[
          'absolute inset-0',
          // Light: gradient → warm dark overlay
          'bg-gradient-to-t from-black/80 via-black/50 to-black/20',
          // Dark: daha yoğun overlay
          'dark:from-dark-bg/95 dark:via-dark-bg/75 dark:to-dark-bg/40',
        ].join(' ')}
      />

      {/* ── İçerik ── */}
      <div className="relative container flex flex-col justify-end h-full pb-12 pt-20 md:pb-16 md:pt-28">
        <div className="max-w-2xl">
          {/* Üst etiket — mobilde görünür */}
          <p className="font-sans text-label-md uppercase tracking-widest text-gold/80 mb-3 md:mb-4">
            Global Hatim
          </p>

          {/* Ana başlık */}
          <h1
            id="hero-heading"
            className={[
              'font-serif font-normal leading-tight',
              // Mobile: 2rem, Tablet: 2.5rem, Desktop: 3.5rem
              'text-[2rem] md:text-[2.75rem] lg:text-[3.5rem]',
              'text-white dark:text-gold',
              'mb-4 md:mb-5',
              // Negatif tracking display büyüklüğünde
              'tracking-tight',
            ].join(' ')}
          >
            Kur'an ile Kalpleri
            <br className="hidden sm:block" />
            {' '}Birleştirmek
          </h1>

          {/* Alt metin */}
          <p className="font-sans text-body-md md:text-body-lg text-white/80 dark:text-dark-text-muted max-w-xl mb-7 md:mb-8 leading-relaxed">
            Kur'an-ı Kerim okumasını tamamlamak için küresel bir topluluğa
            katılın. Manevi yolculuğunuzda ortak bir amaçla odaklanın.
          </p>

          {/* CTA butonu */}
          <Link
            to="/hatimler"
            className={[
              'inline-flex items-center gap-2',
              'font-sans font-semibold text-label-md uppercase tracking-widest',
              'px-6 py-3.5 rounded',
              // Light: beyaz zemin, koyu metin — fotoğraf üzerinde kontrast
              'bg-white text-slate-900',
              'hover:bg-slate-100',
              // Dark: altın zemin, koyu metin
              'dark:bg-gold-dim dark:text-gold-text',
              'dark:hover:bg-gold',
              'transition-colors duration-200',
              // a11y focus ring
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
              'focus-visible:ring-offset-black',
            ].join(' ')}
          >
            Aktif Hatime Katıl
            {/* Arrow ikonu */}
            <svg
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ÖZELLİKLER BÖLÜMܼ
// ─────────────────────────────────────────────────────────────────────────────

interface Feature {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  /** İkon rozetinin arka plan rengi */
  badgeBg: string
  badgeDark: string
}

const FEATURES: Feature[] = [
  {
    id: 'global',
    title: 'Küresel Topluluk',
    description:
      'Dünyanın her yerinden okurlarla bir araya gelerek Kur\'an-ı Kerim\'i hatminde, bereketli sınırların ötesinde paylaşın.',
    badgeBg: 'bg-amber-100',
    badgeDark: 'dark:bg-amber-900/40',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
  {
    id: 'progress',
    title: 'Yapılandırılmış İlerleme',
    description:
      'Platformumuz hatimleri yönetilebilir cüz ve sayfalara ayırarak, bunalmadan okumanızı taahhüt etmenizi ve takip etmenizi kolaylaştırır.',
    badgeBg: 'bg-sky-100',
    badgeDark: 'dark:bg-sky-900/40',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    id: 'focus',
    title: 'Manevi Odaklanma',
    description:
      'Hatimler bireysel başarının ötesinde manevi büyümeye odaklanmış olup okumalarınızı derinlemekten alacağınız bereketi artırır.',
    badgeBg: 'bg-emerald-100',
    badgeDark: 'dark:bg-emerald-900/40',
    icon: (
      <svg aria-hidden="true" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
]

function FeaturesSection() {
  return (
    <section
      aria-labelledby="features-heading"
      className="py-16 md:py-20 bg-white dark:bg-dark-bg"
    >
      <div className="container">
        {/* Başlık + rozet satırı */}
        <div className="flex items-start justify-between gap-4 mb-10 md:mb-12">
          <div>
            <h2
              id="features-heading"
              className="font-serif text-headline-lg-mobile md:text-headline-md text-slate-900 dark:text-dark-text mb-2"
            >
              Paylaşılan Manevi Bir Yolculuk
            </h2>
            <p className="font-sans text-body-md text-slate-500 dark:text-dark-text-muted max-w-lg">
              Platformumuz dünya çapındaki okuyucuları birbirine bağlayarak Kur'an'ın tamamlanmasını verimli ve toplu bir şekilde organize eder.
            </p>
          </div>
          {/* Sağ üst rozet — tasarımda görülen compass/harita ikonu */}
          <div
            aria-hidden="true"
            className={[
              'flex-shrink-0 hidden sm:flex',
              'h-10 w-10 rounded-full items-center justify-center',
              'bg-gold/15 dark:bg-gold/20',
            ].join(' ')}
          >
            <svg className="h-5 w-5 text-gold-deep dark:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
        </div>

        {/* 3'lü grid — mobile: tek kolon, md: 3 kolon */}
        <ul
          className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6"
          role="list"
        >
          {FEATURES.map((f) => (
            <li key={f.id}>
              <article
                className={[
                  'h-full p-6 rounded-lg border transition-shadow duration-200',
                  // Light: beyaz kart, ince gri border, hover'da altın glow
                  'bg-white border-slate-200 hover:shadow-gold-glow',
                  // Dark: derin lacivert, koyu border, gold glow
                  'dark:bg-dark-surface dark:border-dark-outline dark:hover:shadow-gold-glow-md',
                  'group',
                ].join(' ')}
              >
                {/* İkon rozeti */}
                <div
                  aria-hidden="true"
                  className={[
                    'mb-4 inline-flex h-10 w-10 rounded-full items-center justify-center',
                    f.badgeBg,
                    f.badgeDark,
                  ].join(' ')}
                >
                  {f.icon}
                </div>

                <h3 className="font-serif text-lg text-slate-900 dark:text-dark-text mb-2">
                  {f.title}
                </h3>
                <p className="font-sans text-body-md text-slate-500 dark:text-dark-text-muted leading-relaxed">
                  {f.description}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. HATİM KARTI
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<NonNullable<ActiveHatimCard['badgeVariant']>, string> = {
  gold:  'bg-gold/15 text-gold-deep dark:bg-gold/20 dark:text-gold',
  blue:  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-dark-surface-high dark:text-dark-text-muted',
}

function HatimCard({ hatim }: { hatim: ActiveHatimCard }) {
  const progress = Math.round((hatim.completedJuz / hatim.totalJuz) * 100)
  const badgeStyle = BADGE_STYLES[hatim.badgeVariant ?? 'slate']

  return (
    <article
      aria-labelledby={`hatim-title-${hatim.id}`}
      className={[
        'p-5 md:p-6 rounded-lg border transition-all duration-200',
        'bg-white border-slate-200 hover:shadow-gold-glow hover:-translate-y-0.5',
        'dark:bg-dark-surface dark:border-dark-outline dark:hover:shadow-gold-glow-md',
      ].join(' ')}
    >
      {/* ── Üst satır: başlık + rozet ── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3
            id={`hatim-title-${hatim.id}`}
            className="font-serif text-lg text-slate-900 dark:text-dark-text leading-snug"
          >
            {hatim.title}
          </h3>
          <p className="font-sans text-sm text-slate-500 dark:text-dark-text-muted mt-0.5">
            {hatim.subtitle}
          </p>
        </div>

        {hatim.badgeLabel && (
          <span
            className={[
              'flex-shrink-0 font-sans text-label-md uppercase tracking-widest',
              'px-2.5 py-1 rounded-full text-xs font-semibold',
              badgeStyle,
            ].join(' ')}
          >
            {hatim.badgeLabel}
          </span>
        )}
      </div>

      {/* ── İlerleme çubuğu ── */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-sans text-label-md uppercase tracking-widest text-slate-500 dark:text-dark-text-muted">
            İlerleme
          </span>
          <span className="font-sans text-sm font-semibold text-slate-700 dark:text-dark-text">
            {hatim.completedJuz}/{hatim.totalJuz} Cüz
          </span>
        </div>
        <ProgressBar
          value={progress}
          label={`${hatim.title}: ${hatim.completedJuz} / ${hatim.totalJuz} cüz tamamlandı`}
        />
      </div>

      {/* ── Alt satır: avatarlar + Görüntüle butonu ── */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-dark-outline/50">
        <AvatarGroup participants={hatim.participants} max={4} />

        <Link
          to={`/hatimler/${hatim.id}`}
          className={[
            'font-sans text-label-md uppercase tracking-widest',
            'inline-flex items-center gap-1.5',
            'text-gold-deep dark:text-gold',
            'hover:opacity-70 transition-opacity duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded',
          ].join(' ')}
          aria-label={`${hatim.title} hatmini görüntüle`}
        >
          Görüntüle
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SON AKTİF HATİMLER BÖLÜMܼ
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVE_HATIMS_LIMIT = 4

function ActiveHatimsSection() {
  const { hatims, isLoading, error, refetch } = useActiveHatims(ACTIVE_HATIMS_LIMIT)

  return (
    <section
      aria-labelledby="active-hatims-heading"
      className="py-14 md:py-16 bg-light-bg-dim dark:bg-dark-bg-deep"
      style={{ background: 'var(--section-alt-bg)' }}
    >
      <div className="container">
        {/* Bölüm başlığı + "Tümünü Gör" linki */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h2
              id="active-hatims-heading"
              className="font-serif text-headline-lg-mobile md:text-headline-md text-slate-900 dark:text-dark-text"
            >
              Son Aktif Hatimler
            </h2>
            <p className="font-sans text-body-md text-slate-500 dark:text-dark-text-muted mt-1">
              Şu anda okuma yapan bir gruba katılın.
            </p>
          </div>

          <Link
            to="/hatimler"
            className={[
              'flex-shrink-0 font-sans text-label-md uppercase tracking-widest',
              'inline-flex items-center gap-1.5',
              'text-gold-deep dark:text-gold',
              'hover:opacity-70 transition-opacity duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded px-1',
            ].join(' ')}
            aria-label="Tüm hatimleri gör"
          >
            Tümünü Gör
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Hata durumu */}
        {error && !isLoading && (
          <div
            role="alert"
            aria-live="polite"
            className={[
              'flex items-start gap-3 p-4 rounded-lg border',
              'bg-rose-50 border-rose-200 text-rose-700',
              'dark:bg-rose-900/20 dark:border-rose-800/40 dark:text-rose-300',
            ].join(' ')}
          >
            <svg aria-hidden="true" className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div className="flex-1 font-sans text-body-md">
              <p>{error}</p>
              <button
                type="button"
                onClick={refetch}
                className={[
                  'mt-1.5 font-semibold underline underline-offset-2',
                  'hover:no-underline transition-all duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded',
                ].join(' ')}
              >
                Tekrar dene
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
            aria-busy="true"
            aria-label="Hatimler yükleniyor"
          >
            {Array.from({ length: ACTIVE_HATIMS_LIMIT }).map((_, i) => (
              <div
                key={i}
                className={[
                  'h-48 rounded-lg border',
                  'border-slate-200 bg-slate-100 animate-pulse',
                  'dark:border-dark-outline dark:bg-dark-surface',
                ].join(' ')}
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {/* Hatim kartları grid — mobile: tek kolon, md: 2 kolon */}
        {!isLoading && !error && (
          <ul
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
            role="list"
            aria-label="Aktif hatim listesi"
          >
            {hatims.map((hatim) => (
              <li key={hatim.id}>
                <HatimCard hatim={hatim} />
              </li>
            ))}
          </ul>
        )}

        {/* Mobile: "Tüm Hatimleri Gör" alt butonu */}
        <div className="mt-8 flex justify-center md:hidden">
          <Link
            to="/hatimler"
            className={[
              'w-full max-w-xs text-center',
              'font-sans text-label-md uppercase tracking-widest',
              'border border-slate-900 dark:border-gold',
              'text-slate-900 dark:text-gold',
              'px-6 py-3 rounded',
              'hover:bg-slate-900 hover:text-white dark:hover:bg-gold dark:hover:text-gold-text',
              'transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
            ].join(' ')}
          >
            Tüm Hatimleri Gör
          </Link>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ANA SAYFA — KOMPOZISYON
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <ActiveHatimsSection />
    </>
  )
}
