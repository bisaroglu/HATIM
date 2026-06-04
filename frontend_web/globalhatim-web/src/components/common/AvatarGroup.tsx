export interface Participant {
  id: string
  initials: string
  avatarUrl?: string
  /** Tailwind bg renk class'ı — baş harf avatar için */
  bgColor?: string
}

interface AvatarGroupProps {
  participants: Participant[]
  /** Gösterilecek maksimum avatar sayısı */
  max?: number
  size?: 'sm' | 'md'
}

const DEFAULT_COLORS = [
  'bg-amber-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-teal-500',
]

export function AvatarGroup({ participants, max = 4, size = 'sm' }: AvatarGroupProps) {
  const visible = participants.slice(0, max)
  const overflow = participants.length - max

  const dim = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'

  return (
    /* ARIA: grup etiketiyle birleşik liste */
    <ul
      className="flex items-center -space-x-2"
      aria-label={`${participants.length} katılımcı`}
    >
      {visible.map((p, i) => (
        <li key={p.id} title={p.initials}>
          {p.avatarUrl ? (
            <img
              src={p.avatarUrl}
              alt={p.initials}
              className={[
                dim,
                'rounded-full object-cover',
                'ring-2 ring-white dark:ring-dark-surface',
              ].join(' ')}
            />
          ) : (
            <span
              aria-hidden="true"
              className={[
                dim,
                'rounded-full flex items-center justify-center font-sans font-semibold text-white',
                'ring-2 ring-white dark:ring-dark-surface',
                p.bgColor ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
              ].join(' ')}
            >
              {p.initials}
            </span>
          )}
        </li>
      ))}

      {overflow > 0 && (
        <li>
          <span
            className={[
              dim,
              'rounded-full flex items-center justify-center',
              'font-sans font-semibold text-slate-600 dark:text-dark-text-muted',
              'bg-slate-200 dark:bg-dark-surface-high',
              'ring-2 ring-white dark:ring-dark-surface',
            ].join(' ')}
            aria-label={`ve ${overflow} kişi daha`}
          >
            +{overflow}
          </span>
        </li>
      )}
    </ul>
  )
}
