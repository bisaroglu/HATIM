/**
 * Hatim kartı yüklenirken gösterilen pulse skeleton.
 * Birebir kart boyutlarında — layout kayması olmaz.
 */
export function HatimCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className={[
        'rounded-lg border p-5 md:p-6 flex flex-col gap-4',
        'border-slate-200 bg-white dark:border-dark-outline dark:bg-dark-surface',
        'animate-pulse',
      ].join(' ')}
    >
      {/* Üst satır: badge + başlık + menü */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-dark-surface-high" />
          <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-dark-surface-high" />
          <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-dark-surface" />
        </div>
        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-dark-surface" />
      </div>

      {/* İlerleme alanı */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded bg-slate-100 dark:bg-dark-surface" />
          <div className="h-3 w-20 rounded bg-slate-100 dark:bg-dark-surface" />
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-dark-surface" />
      </div>

      {/* Alt satır: avatarlar + buton */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-dark-outline/50">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 w-7 rounded-full bg-slate-200 dark:bg-dark-surface-high ring-2 ring-white dark:ring-dark-surface"
            />
          ))}
        </div>
        <div className="h-9 w-20 rounded bg-slate-200 dark:bg-dark-surface-high" />
      </div>
    </div>
  )
}
