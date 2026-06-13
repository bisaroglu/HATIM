import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBar, Button } from '@/components/common'
import { useProfile } from '@/hooks/useProfile'
import type { UserProfile, UserHatimEntry } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// YARDIMCI: İkon bileşenleri
// ─────────────────────────────────────────────────────────────────────────────

function BookIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  )
}

function CheckBadgeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  )
}

function PlusPersonIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  )
}

function GroupIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )
}

function EyeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR NAVİGASYON (yalnızca desktop)
// ─────────────────────────────────────────────────────────────────────────────

const SIDEBAR_LINKS = [
  { to: '/hatimler',      label: 'Hatimlere Göz At',  icon: BookIcon },
  { to: '/taahhutlerim',  label: 'Taahhütlerim',       icon: CheckBadgeIcon },
  { to: '/hakkimizda',    label: 'Hakkımızda',          icon: GroupIcon },
  { to: '/geri-bildirim', label: 'Geri Bildirim',       icon: EyeIcon },
]

interface SidebarProps {
  profile: UserProfile
}

function UserSidebar({ profile }: SidebarProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`

  return (
    <aside
      aria-label="Kullanıcı profil paneli"
      className={[
        // Desktop'ta sol sidebar olarak göster
        'hidden md:flex flex-col',
        'w-56 lg:w-64 flex-shrink-0',
        'sticky top-16 self-start',    // navbar'ın altında sabit
        'h-[calc(100vh-4rem)]',        // navbar yüksekliğini çıkar
        'border-r border-slate-100 dark:border-dark-outline',
        'bg-white dark:bg-dark-bg',
        'pt-8 pb-6 px-5 overflow-y-auto',
      ].join(' ')}
    >
      {/* ── Avatar ── */}
      <div className="mb-4">
        <div
          className={[
            'relative inline-block',
            'h-12 w-12 rounded-xl overflow-hidden',
            'ring-2 ring-slate-200 dark:ring-dark-outline',
          ].join(' ')}
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gold-dim flex items-center justify-center">
              <span className="font-serif text-lg text-gold-text font-bold">
                {profile.firstName[0]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── İsim + üyelik + seviye ── */}
      <h2 className="font-serif text-xl text-slate-900 dark:text-dark-text leading-tight mb-0.5">
        {fullName}
      </h2>
      <p className="font-sans text-xs text-slate-400 dark:text-dark-text-muted mb-3">
        {profile.memberType}
      </p>

      {/* Seviye rozeti */}
      <LevelBadge level={profile.levelLabel} size="sm" />

      {/* ── Nav linkleri ── */}
      <nav aria-label="Profil menüsü" className="mt-8 flex flex-col gap-1">
        {SIDEBAR_LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'font-sans text-sm transition-colors duration-150',
              'text-slate-600 dark:text-dark-text-muted',
              'hover:bg-slate-50 hover:text-slate-900',
              'dark:hover:bg-dark-surface dark:hover:text-dark-text',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
            ].join(' ')}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}

        {/* Ayarlar — vurgulu (amber) */}
        <Link
          to="/ayarlar"
          className={[
            'flex items-center gap-3 px-3 py-2.5 rounded-lg mt-1',
            'font-sans text-sm font-semibold transition-colors duration-150',
            // Light: amber zemin
            'bg-amber-50 text-amber-800 hover:bg-amber-100',
            // Dark: amber/gold tonu
            'dark:bg-gold/10 dark:text-gold dark:hover:bg-gold/20',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
          ].join(' ')}
        >
          {/* Gear icon */}
          <svg aria-hidden="true" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ayarlar
        </Link>
      </nav>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORTAK: Seviye Rozeti
// ─────────────────────────────────────────────────────────────────────────────

function LevelBadge({ level, size = 'md' }: { level: string; size?: 'sm' | 'md' }) {
  const padding = size === 'sm' ? 'px-2.5 py-1' : 'px-4 py-1.5'
  const text = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5',
        padding, text,
        'rounded-full font-sans font-semibold uppercase tracking-widest',
        // Light: amber/gold zemin
        'bg-amber-100 text-amber-800',
        // Dark: koyu amber/gold
        'dark:bg-gold/15 dark:text-gold',
      ].join(' ')}
    >
      {/* Nokta indikatör */}
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-gold flex-shrink-0"
      />
      SEVİYE: {level}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBİL: Ortalanmış Kullanıcı Hero
// ─────────────────────────────────────────────────────────────────────────────

function MobileUserHero({ profile }: { profile: UserProfile }) {
  const fullName = `${profile.firstName} ${profile.lastName}`

  return (
    <section
      aria-label="Kullanıcı bilgileri"
      className="md:hidden flex flex-col items-center text-center py-8 px-6"
    >
      {/* Büyük avatar + gear badge overlay */}
      <div className="relative mb-4">
        <div
          className={[
            'h-28 w-28 rounded-2xl overflow-hidden',
            'ring-2 ring-slate-200 dark:ring-dark-outline',
          ].join(' ')}
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gold-dim flex items-center justify-center">
              <span className="font-serif text-4xl text-gold-text font-bold">
                {profile.firstName[0]}
              </span>
            </div>
          )}
        </div>

        {/* Gear badge — sağ alt köşe */}
        <div
          aria-hidden="true"
          className={[
            'absolute -bottom-1.5 -right-1.5',
            'h-8 w-8 rounded-full flex items-center justify-center',
            'bg-gold-dim dark:bg-gold ring-2 ring-white dark:ring-dark-bg',
          ].join(' ')}
        >
          <svg className="h-4 w-4 text-gold-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      <h1 className="font-serif text-2xl text-slate-900 dark:text-dark-text mb-1">
        {fullName}
      </h1>
      <p className="font-sans text-sm text-slate-400 dark:text-dark-text-muted mb-3">
        {profile.email}
      </p>

      <LevelBadge level={profile.levelLabel} size="md" />
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// İSTATİSTİK KARTLARI
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardData {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
}

function StatCard({ stat }: { stat: StatCardData }) {
  const Icon = stat.icon
  return (
    <div
      className={[
        'flex flex-col items-center md:items-start gap-2',
        'p-5 md:p-6 rounded-lg border',
        'bg-white border-slate-200',
        'dark:bg-dark-surface dark:border-dark-outline dark:hover:shadow-gold-glow',
        'transition-shadow duration-200',
      ].join(' ')}
    >
      {/* İkon rozeti */}
      <div
        aria-hidden="true"
        className={[
          'h-9 w-9 rounded-full flex items-center justify-center',
          stat.iconBg,
        ].join(' ')}
      >
        <Icon className={`h-4 w-4 ${stat.iconColor}`} />
      </div>

      {/* Sayı */}
      <p
        className={[
          'font-serif font-normal leading-none',
          'text-4xl md:text-5xl',
          'text-slate-900 dark:text-dark-text',
        ].join(' ')}
        aria-label={`${stat.value} ${stat.label}`}
      >
        {stat.value}
      </p>

      {/* Etiket */}
      <p className="font-sans text-label-md uppercase tracking-widest text-slate-400 dark:text-dark-text-muted text-center md:text-left">
        {stat.label}
      </p>
    </div>
  )
}

function StatCards({ stats }: { stats: UserProfile['stats'] }) {
  const cards: StatCardData[] = [
    {
      label: 'Okunan Cüz',
      value: stats.readJuz,
      icon: BookIcon,
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Tamamlanan Hatimler',
      value: stats.completedHatims,
      icon: CheckBadgeIcon,
      iconBg: 'bg-sky-100 dark:bg-sky-900/30',
      iconColor: 'text-sky-600 dark:text-sky-400',
    },
    {
      label: 'Oluşturulan Hatimler',
      value: stats.createdHatims,
      icon: PlusPersonIcon,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <section aria-labelledby="stats-heading">
      <h2
        id="stats-heading"
        className="font-serif text-headline-lg-mobile md:text-headline-md text-slate-900 dark:text-dark-text mb-5"
      >
        Manevi İlerleme
      </h2>
      <ul
        className="grid grid-cols-3 gap-3 md:gap-4"
        role="list"
        aria-label="İstatistikler"
      >
        {cards.map((stat) => (
          <li key={stat.label}>
            <StatCard stat={stat} />
          </li>
        ))}
      </ul>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AKTİF HATİM KARTI (profil'e özel — cüz yönetimi odaklı)
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_BADGE_STYLES: Record<UserHatimEntry['typeBadgeVariant'], string> = {
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  sky:   'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-dark-surface-high dark:text-dark-text-muted',
}

/** Hatim türüne göre ikon — Ramazan için kitap, aile için grup */
function HatimTypeIcon({ badge }: { badge: string }) {
  const isGroup = badge.toLowerCase().includes('aile') || badge.toLowerCase().includes('topluluk')
  return isGroup
    ? <GroupIcon className="h-5 w-5 text-slate-300 dark:text-dark-outline" />
    : <BookIcon className="h-5 w-5 text-slate-300 dark:text-dark-outline" />
}

interface ActiveHatimCardProps {
  entry: UserHatimEntry
  onApprove?: (id: string) => void
  onStart?: (id: string) => void
}

function ActiveHatimCard({ entry, onApprove, onStart }: ActiveHatimCardProps) {
  const headingId = `hatim-entry-${entry.id}`
  const badgeStyle = TYPE_BADGE_STYLES[entry.typeBadgeVariant]

  return (
    <article
      aria-labelledby={headingId}
      className={[
        'rounded-lg border p-5 md:p-6 flex flex-col gap-4',
        'bg-white border-slate-200 hover:shadow-gold-glow hover:-translate-y-0.5',
        'dark:bg-dark-surface dark:border-dark-outline dark:hover:shadow-gold-glow-md',
        'transition-all duration-200',
      ].join(' ')}
    >
      {/* ── Üst satır: tip badge + ikon + JUZ badge ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tip badge */}
          <span
            className={[
              'font-sans text-xs font-semibold uppercase tracking-widest',
              'px-2.5 py-1 rounded-full',
              badgeStyle,
            ].join(' ')}
          >
            {entry.typeBadge}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* JUZ numarası badge */}
          <span
            className={[
              'font-sans text-xs font-bold uppercase tracking-widest',
              'px-2.5 py-1 rounded-full',
              'bg-gold/15 text-gold-deep dark:bg-gold/20 dark:text-gold',
            ].join(' ')}
            aria-label={`Atanan cüz: ${entry.assignedJuz}`}
          >
            JUZ {entry.assignedJuz}
          </span>

          {/* Hatim tipi ikonu */}
          <HatimTypeIcon badge={entry.typeBadge} />
        </div>
      </div>

      {/* ── Hatim başlığı + düzenleyen ── */}
      <div>
        <h3
          id={headingId}
          className="font-serif text-lg md:text-xl text-slate-900 dark:text-dark-text leading-snug"
        >
          {entry.hatimTitle}
        </h3>
        <p className="font-sans text-sm text-slate-400 dark:text-dark-text-muted mt-0.5">
          Düzenleyen:{' '}
          <span className="font-semibold text-slate-600 dark:text-dark-text-muted">
            {entry.organizerName}
          </span>
        </p>
      </div>

      {/* ── Cüz ve sure bilgisi (mobil tasarımdan) ── */}
      {entry.surahName && (
        <p className="font-sans text-sm text-slate-600 dark:text-dark-text-muted -mt-1">
          Cüz {entry.assignedJuz}
          <span className="mx-1.5 text-slate-300 dark:text-dark-outline">–</span>
          <span className="font-medium text-slate-700 dark:text-dark-text">{entry.surahName}</span>
        </p>
      )}

      {/* ── İlerleme çubuğu ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-sans text-label-md uppercase tracking-widest text-slate-400 dark:text-dark-text-muted">
            Progress
          </span>
          <span className="font-sans text-sm font-semibold text-slate-600 dark:text-dark-text">
            {entry.hatimProgress}%{' '}
            <span className="font-normal text-slate-400 dark:text-dark-text-muted">
              ({entry.completedJuz}/{entry.totalJuz} Juz)
            </span>
          </span>
        </div>
        <ProgressBar
          value={entry.hatimProgress}
          label={`${entry.hatimTitle} ilerleme: %${entry.hatimProgress}`}
        />
        {entry.daysRemaining !== undefined && (
          <p className="font-sans text-xs text-slate-400 dark:text-dark-text-muted/60 mt-1.5 text-right">
            Kalan Süre: {entry.daysRemaining} Gün
          </p>
        )}
      </div>

      {/* ── Alt satır: aksiyon butonu ── */}
      <div className="flex justify-end pt-1">
        {entry.action === 'approve' && (
          <Button
            size="md"
            onClick={() => onApprove?.(entry.id)}
            className="w-full md:w-auto gap-2"
            aria-label={`${entry.hatimTitle} - okumayı onayla`}
          >
            <EyeIcon />
            Okumayı Onayla
          </Button>
        )}

        {entry.action === 'start' && (
          <Button
            size="md"
            variant="secondary"
            onClick={() => onStart?.(entry.id)}
            className="w-full md:w-auto"
            aria-label={`${entry.hatimTitle} - okumaya başla`}
          >
            Okumaya Başla
          </Button>
        )}

        {entry.action === 'view' && (
          <Link
            to={`/hatimler/${entry.hatimId}`}
            className={[
              'inline-flex items-center justify-center gap-2',
              'w-full md:w-auto px-5 py-2.5 rounded',
              'font-sans font-semibold text-body-md tracking-wide',
              'border transition-colors duration-150',
              'border-slate-300 text-slate-700 hover:border-slate-500 hover:text-slate-900',
              'dark:border-gold/50 dark:text-gold dark:hover:border-gold',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
              'focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg',
            ].join(' ')}
            aria-label={`${entry.hatimTitle} - detayları gör`}
          >
            <EyeIcon />
            Detayları Gör
          </Link>
        )}
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON LOADER
// ─────────────────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Profil yükleniyor">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-slate-100 dark:bg-dark-surface" />
        ))}
      </div>
      {/* Cards */}
      {[1, 2].map((i) => (
        <div key={i} className="h-48 rounded-lg bg-slate-100 dark:bg-dark-surface" />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HATA BANNER — dismissible, a11y-safe
// ─────────────────────────────────────────────────────────────────────────────

function ProfileErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex items-start justify-between gap-3 mb-6',
        'rounded-lg border px-4 py-3',
        'border-red-200 bg-red-50 text-red-700',
        'dark:border-error/30 dark:bg-error/10 dark:text-error',
        'font-sans text-sm',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <svg aria-hidden="true" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <span>{message}</span>
      </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// ANA SAYFA KOMPOZİSYONU
// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilPage() {
  const {
    profile,
    hatimEntries,
    isInitialLoading,
    isLoading,
    error,
    approveJuz,
    startJuz,
    dismissError,
  } = useProfile()

  // Aksiyon sarmalayıcılar — async, hata hook içinde yönetilir
  const handleApprove = useCallback(
    (entryId: string) => { void approveJuz(entryId) },
    [approveJuz],
  )

  const handleStart = useCallback(
    (entryId: string) => { void startJuz(entryId) },
    [startJuz],
  )

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg">
      <div className="flex">

        {/* Sol sidebar — yalnızca md+ */}
        {profile && <UserSidebar profile={profile} />}

        {/* Sağ ana içerik */}
        <div className="flex-1 min-w-0">

          {/* Mobil: ortalanmış kullanıcı hero */}
          {profile && <MobileUserHero profile={profile} />}

          <main
            id="main-content"
            tabIndex={-1}
            className="outline-none px-5 md:px-8 lg:px-10 py-6 md:py-8 max-w-4xl"
          >
            {/* İlk yüklemede skeleton */}
            {isInitialLoading || !profile ? (
              <ProfileSkeleton />
            ) : (
              <div className="space-y-10">

                {/* Hata banner — aksiyon veya yükleme hatası */}
                {error && (
                  <ProfileErrorBanner message={error} onDismiss={dismissError} />
                )}

                {/* Aksiyon sırasında overlay spinner */}
                {isLoading && (
                  <p
                    className="sr-only"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    İşlem devam ediyor…
                  </p>
                )}

                {/* İstatistik kartları */}
                <StatCards stats={profile.stats} />

                {/* Aktif hatimler */}
                <section aria-labelledby="active-hatims-heading">
                  <div className="flex items-center justify-between mb-5">
                    <h2
                      id="active-hatims-heading"
                      className="font-serif text-headline-lg-mobile md:text-headline-md text-slate-900 dark:text-dark-text"
                    >
                      Aktif Hatimler
                    </h2>
                    <Link
                      to="/hatimler"
                      className={[
                        'font-sans text-label-md uppercase tracking-widest',
                        'inline-flex items-center gap-1.5',
                        'text-gold-deep dark:text-gold',
                        'hover:opacity-70 transition-opacity duration-150',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded',
                      ].join(' ')}
                      aria-label="Tüm hatimleri gör"
                    >
                      Tümünü Gör
                      <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>

                  {hatimEntries.length === 0 ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className={[
                        'flex flex-col items-center text-center py-14 px-6',
                        'rounded-xl border border-dashed',
                        'border-slate-200 dark:border-dark-outline',
                        'bg-slate-50/50 dark:bg-dark-surface/30',
                      ].join(' ')}
                    >
                      {/* İkon */}
                      <div
                        aria-hidden="true"
                        className="h-14 w-14 rounded-full flex items-center justify-center mb-4 bg-slate-100 dark:bg-dark-surface"
                      >
                        <BookIcon className="h-7 w-7 text-slate-300 dark:text-dark-text-muted/40" />
                      </div>

                      <p className="font-serif text-xl text-slate-700 dark:text-dark-text mb-1">
                        Aktif taahhüdünüz bulunmuyor
                      </p>
                      <p className="font-sans text-sm text-slate-400 dark:text-dark-text-muted/70 max-w-sm leading-relaxed">
                        Henüz üzerinizde aktif bir cüz taahhüdü bulunmamaktadır.
                        Hatimler sayfasından bir hatme katılarak cüz alabilirsiniz.
                      </p>

                      <Link
                        to="/hatimler"
                        className={[
                          'mt-5 inline-flex items-center gap-2',
                          'font-sans text-label-md uppercase tracking-widest',
                          'px-5 py-2.5 rounded-lg',
                          'bg-slate-900 text-white hover:bg-slate-700',
                          'dark:bg-gold-dim dark:text-gold-text dark:hover:bg-gold',
                          'transition-colors duration-150',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                          'focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg',
                        ].join(' ')}
                      >
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Hatimlere Göz At
                      </Link>
                    </div>
                  ) : (
                    <ul className="space-y-4" role="list" aria-label="Aktif hatim listesi">
                      {hatimEntries.map((entry) => (
                        <li key={entry.id}>
                          <ActiveHatimCard
                            entry={entry}
                            onApprove={handleApprove}
                            onStart={handleStart}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
