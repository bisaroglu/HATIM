import { useState, useRef, useEffect, useId } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBar, AvatarGroup, Button } from '@/components/common'
import type { HatimListItem } from '@/hooks/useHatims'

// ─── Tür etiketi görünümü ─────────────────────────────────────────────────────
const TYPE_STYLES: Record<HatimListItem['type'], { label: string; classes: string }> = {
  sabit:    { label: 'Sabit',    classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  döngülü:  { label: 'Döngülü',  classes: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' },
  günlük:   { label: 'Günlük',   classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  haftalık: { label: 'Haftalık', classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' },
}

const STATUS_BADGE: Partial<Record<HatimListItem['status'], { label: string; classes: string }>> = {
  upcoming: { label: 'Yakında', classes: 'bg-slate-100 text-slate-500 dark:bg-dark-surface-high dark:text-dark-text-muted' },
  completed:{ label: 'Tamamlandı', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
}

// ─── Three-dot dropdown menü ──────────────────────────────────────────────────
interface ThreeDotMenuProps {
  hatimId: string
  onEdit?: () => void
  onShare?: () => void
  onDelete?: () => void
}

function ThreeDotMenu({ hatimId, onEdit, onShare, onDelete }: ThreeDotMenuProps) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = `menu-${hatimId}`

  // Dışarı tıklayınca kapat
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Escape ile kapat
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Hatim seçenekleri"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        className={[
          'flex items-center justify-center h-8 w-8 rounded-full',
          'text-slate-400 dark:text-dark-text-muted',
          'hover:bg-slate-100 hover:text-slate-600',
          'dark:hover:bg-dark-surface-high dark:hover:text-dark-text',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
        ].join(' ')}
      >
        <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          aria-label="Hatim seçenekleri menüsü"
          className={[
            'absolute right-0 top-full mt-1 z-20 w-36',
            'rounded-lg border shadow-lg py-1',
            'bg-white border-slate-200',
            'dark:bg-dark-surface-high dark:border-dark-outline',
            'animate-fade-in',
          ].join(' ')}
        >
          {[
            { label: 'Düzenle', icon: '✏️', action: onEdit },
            { label: 'Paylaş',  icon: '🔗', action: onShare },
            { label: 'Sil',     icon: '🗑️', action: onDelete, danger: true },
          ].map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={() => { item.action?.(); setOpen(false) }}
              className={[
                'w-full text-left px-4 py-2.5',
                'font-sans text-sm flex items-center gap-2',
                'transition-colors duration-100',
                item.danger
                  ? 'text-red-600 hover:bg-red-50 dark:text-error dark:hover:bg-error/10'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-dark-text dark:hover:bg-dark-surface',
                'focus-visible:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-dark-surface',
              ].join(' ')}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Katılımcı sayısı badge ───────────────────────────────────────────────────
function ParticipantCount({ count }: { count: number }) {
  const label = count >= 1000
    ? `${(count / 1000).toFixed(1)}k`
    : String(count)

  return (
    <span
      className={[
        'font-sans text-xs font-semibold px-2 py-1 rounded-full',
        'bg-slate-100 text-slate-500',
        'dark:bg-dark-surface-high dark:text-dark-text-muted',
      ].join(' ')}
      aria-label={`${count} katılımcı`}
    >
      {label}
    </span>
  )
}

// ─── Ana HatimCard ────────────────────────────────────────────────────────────
interface HatimCardProps {
  hatim: HatimListItem
  /** İlk kart masaüstünde daha belirgin (featured) görünür */
  featured?: boolean
  onJoin?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function HatimCard({ hatim, featured = false, onJoin, onEdit, onDelete }: HatimCardProps) {
  const headingId = useId()
  const progress = Math.round((hatim.completedJuz / hatim.totalJuz) * 100)
  const typeStyle = TYPE_STYLES[hatim.type]
  const statusBadge = hatim.status !== 'active' ? STATUS_BADGE[hatim.status] : null

  const progressLabel = hatim.type === 'döngülü' ? 'Mevcut Döngü' : 'İlerleme'

  return (
    <article
      aria-labelledby={headingId}
      className={[
        'relative rounded-lg border flex flex-col transition-all duration-200',
        'focus-within:ring-2 focus-within:ring-gold/50',
        // Base padding
        'p-5 md:p-6',
        // Light
        'bg-white border-slate-200',
        'hover:shadow-gold-glow hover:-translate-y-0.5',
        // Dark
        'dark:bg-dark-surface dark:border-dark-outline',
        'dark:hover:shadow-gold-glow-md',
        // Featured kart dark modda daha belirgin border
        featured && 'dark:border-gold/30',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* ── Üst satır: badge(ler) + three-dot ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Tür badge */}
          <span
            className={[
              'font-sans text-label-md uppercase tracking-widest px-2.5 py-1 rounded-full text-xs font-semibold',
              typeStyle.classes,
            ].join(' ')}
          >
            {typeStyle.label}
          </span>
          {/* Durum badge (Yakında, Tamamlandı) */}
          {statusBadge && (
            <span
              className={[
                'font-sans text-label-md uppercase tracking-widest px-2.5 py-1 rounded-full text-xs font-semibold',
                statusBadge.classes,
              ].join(' ')}
            >
              {statusBadge.label}
            </span>
          )}
        </div>

        <ThreeDotMenu
          hatimId={hatim.id}
          onEdit={() => onEdit?.(hatim.id)}
          onDelete={() => onDelete?.(hatim.id)}
          onShare={() => navigator.clipboard?.writeText(`${window.location.origin}/hatimler/${hatim.id}`)}
        />
      </div>

      {/* ── Başlık + açıklama ── */}
      <h3
        id={headingId}
        className={[
          'font-serif leading-snug mb-1.5',
          featured ? 'text-xl md:text-2xl' : 'text-lg',
          'text-slate-900 dark:text-dark-text',
        ].join(' ')}
      >
        {hatim.title}
      </h3>
      <p className="font-sans text-sm text-slate-500 dark:text-dark-text-muted line-clamp-2 mb-4 leading-relaxed">
        {hatim.description}
      </p>

      {/* ── İlerleme alanı ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-sans text-label-md uppercase tracking-widest text-slate-500 dark:text-dark-text-muted">
            {progressLabel}
          </span>
          <span className="font-sans text-sm font-semibold text-slate-700 dark:text-dark-text">
            {hatim.completedJuz}/{hatim.totalJuz} Cüz
          </span>
        </div>
        <ProgressBar
          value={progress}
          label={`${hatim.title}: ${hatim.completedJuz}/${hatim.totalJuz} cüz tamamlandı`}
        />
      </div>

      {/* ── Alt satır: avatarlar + katılımcı sayısı + buton ── */}
      <div className="flex items-center justify-between gap-3 mt-auto pt-4 border-t border-slate-100 dark:border-dark-outline/40">
        <div className="flex items-center gap-2 min-w-0">
          <AvatarGroup participants={hatim.participants} max={3} />
          {hatim.participantCount > hatim.participants.length && (
            <ParticipantCount count={hatim.participantCount} />
          )}
        </div>

        {/* Katıl / Görüntüle butonu */}
        {hatim.isJoined ? (
          <Link
            to={`/hatimler/${hatim.id}`}
            className={[
              'flex-shrink-0 font-sans text-label-md uppercase tracking-widest',
              'px-4 py-2 rounded border transition-colors duration-150',
              'border-slate-300 text-slate-700 hover:border-slate-500',
              'dark:border-gold/50 dark:text-gold dark:hover:border-gold',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
            ].join(' ')}
            aria-label={`${hatim.title} - görüntüle`}
          >
            Görüntüle
          </Link>
        ) : hatim.status === 'upcoming' ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onJoin?.(hatim.id)}
            aria-label={`${hatim.title} - davet iste`}
          >
            Davet İste
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onJoin?.(hatim.id)}
            aria-label={`${hatim.title} hatimine katıl`}
          >
            Katıl
          </Button>
        )}
      </div>
    </article>
  )
}
