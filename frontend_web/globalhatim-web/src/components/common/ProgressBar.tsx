interface ProgressBarProps {
  /** 0–100 arası yüzde değeri */
  value: number
  /** Erişilebilir etiket (screen reader için) */
  label?: string
  size?: 'sm' | 'md'
  /** Dolgu rengi — varsayılan altın */
  colorClass?: string
}

/**
 * WCAG 1.4.1 — Renk tek başına anlam taşımamalı:
 * Yüzde değeri hem görsel çubukla hem de aria-valuenow ile iletilir.
 */
export function ProgressBar({
  value,
  label,
  size = 'md',
  colorClass = 'bg-gold-dim dark:bg-gold',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  const trackHeight = size === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `İlerleme: %${clamped}`}
      className={[
        'w-full rounded-full overflow-hidden',
        trackHeight,
        'bg-slate-200 dark:bg-dark-surface-high',
      ].join(' ')}
    >
      <div
        className={[
          'h-full rounded-full transition-all duration-500 ease-out',
          colorClass,
        ].join(' ')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
