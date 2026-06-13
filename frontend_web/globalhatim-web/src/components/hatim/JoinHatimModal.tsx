import { useState, useEffect, useRef, type KeyboardEvent } from 'react'
import { Button } from '@/components/common'
import { hatimService } from '@/services/hatim.service'
import { parseApiError } from '@/utils/apiError'
import { useAuthStore } from '@/store/auth.store'
import type { JuzSlot } from '@/types'

// ─── Cüz isim tablosu (1-30) ─────────────────────────────────────────────────
const JUZ_NAMES: Record<number, string> = {
  1:  'Elif Lâm Mîm', 2:  'Seyekûl',    3:  'Tilke',       4:  'Len Tenâlû',
  5:  'Vel Muhsanât', 6:  'Lâ Yuhibb',  7:  "Ve İzâ Semi'û", 8: 'Ve Lev Ennenâ',
  9:  "Kâle'l Mele", 10: "Ve A'lemû", 11: "Ya'tezirûn", 12: 'Ve Mâ Min Dâbbe',
  13: "Ve Mâ Überi'u", 14: 'Rubemâ',  15: 'Subhânellezî', 16: 'Kal Ele',
  17: 'İkterebe',     18: 'Kad Efleha', 19: 'Ve Kâlelezîne', 20: 'Emmen Halak',
  21: 'Utlu Mâ Ûhıye', 22: 'Ve Men Yaknut', 23: 'Ve Mâlî', 24: 'Fe Men Ezlemu',
  25: 'İleyhi Yurâddu', 26: 'Hâ Mîm',  27: 'Kâle Fe Mâ Hatbukum', 28: "Kad Semi'allâh",
  29: "Tebâreke'llezî", 30: 'Amme',
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface JoinHatimModalProps {
  hatimId: string
  hatimTitle: string
  /** Hatim oluşturucusunun ID'si; mevcut kullanıcı ile eşleşirse proxy input gösterilir */
  creatorId: string
  juzSlots: JuzSlot[]
  onClose: () => void
  onSuccess: () => void
}

// ─── Bileşen ──────────────────────────────────────────────────────────────────
export default function JoinHatimModal({
  hatimId,
  hatimTitle,
  creatorId,
  juzSlots,
  onClose,
  onSuccess,
}: JoinHatimModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [proxyName, setProxyName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hatim sahibi mi? -> proxy input göster
  const isOwner = !!user && user.id === creatorId

  // Focus trap
  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  // Cüz seçim toggle
  const toggleJuz = (juzNumber: number, status: string) => {
    if (status !== 'Available') return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(juzNumber)) next.delete(juzNumber)
      else next.add(juzNumber)
      return next
    })
  }

  const handleJoin = async () => {
    if (selected.size === 0) {
      setError('Lütfen en az bir cüz seçin.')
      return
    }
    if (!user?.id) {
      setError('Katılmak için giriş yapmanız gerekiyor.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await hatimService.joinWithSelectedJuzs(
        hatimId,
        Array.from(selected),
        proxyName.trim()
          ? { userId: user.id, proxyName: proxyName.trim() }
          : { userId: user.id }
      )
      onSuccess()
    } catch (err) {
      const { message } = parseApiError(err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOverlayKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.key === 'Enter') onClose()
    if (e.key === 'Escape') onClose()
  }

  // Cüz durumuna göre stil
  const getJuzStyle = (slot: JuzSlot) => {
    const isSelected = selected.has(slot.juzNumber)

    if (slot.status === 'Completed') {
      return [
        'bg-emerald-50 border-emerald-300 text-emerald-700',
        'dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400',
        'cursor-not-allowed opacity-70',
      ].join(' ')
    }
    if (slot.status === 'Assigned') {
      return [
        'bg-slate-100 border-slate-200 text-slate-400',
        'dark:bg-dark-surface-high dark:border-dark-outline dark:text-dark-text-muted',
        'cursor-not-allowed',
      ].join(' ')
    }
    // Available
    if (isSelected) {
      return [
        'bg-amber-500 border-amber-500 text-white shadow-md scale-105',
        'dark:bg-gold dark:border-gold dark:text-dark-surface',
        'cursor-pointer',
      ].join(' ')
    }
    return [
      'bg-white border-slate-300 text-slate-700',
      'dark:bg-dark-surface dark:border-dark-outline dark:text-dark-text',
      'hover:border-amber-400 hover:bg-amber-50 dark:hover:border-gold/60 dark:hover:bg-gold/10',
      'cursor-pointer',
    ].join(' ')
  }

  const getStatusIcon = (status: string) => {
    if (status === 'Completed') return '✓'
    if (status === 'Assigned') return '🔒'
    return null
  }

  const availableCount  = juzSlots.filter((s) => s.status === 'Available').length
  const assignedCount   = juzSlots.filter((s) => s.status === 'Assigned').length
  const completedCount  = juzSlots.filter((s) => s.status === 'Completed').length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={handleOverlayKeyDown}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-hatim-title"
        tabIndex={-1}
        className={[
          'relative w-full max-w-2xl',
          'rounded-xl border shadow-xl',
          'bg-white border-slate-200',
          'dark:bg-dark-surface dark:border-dark-outline dark:shadow-glass',
          'animate-fade-in',
          'max-h-[92vh] flex flex-col',
          'focus:outline-none',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-dark-outline/60 flex-shrink-0">
          <div>
            <h2
              id="join-hatim-title"
              className="font-serif text-xl text-slate-900 dark:text-dark-text"
            >
              Hatime Katıl
            </h2>
            <p className="font-sans text-sm text-slate-500 dark:text-dark-text-muted mt-0.5 truncate max-w-xs">
              {hatimTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Modalı kapat"
            className={[
              'flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0 ml-4',
              'text-slate-400 dark:text-dark-text-muted',
              'hover:bg-slate-100 hover:text-slate-600',
              'dark:hover:bg-dark-surface-high dark:hover:text-dark-text',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
            ].join(' ')}
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Durum özeti */}
        <div className="px-6 py-3 flex items-center gap-4 text-xs font-sans flex-shrink-0 border-b border-slate-100 dark:border-dark-outline/40">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-dark-text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
            <span>{availableCount} Boş</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-400 dark:text-dark-text-muted/60">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-dark-outline inline-block" />
            <span>{assignedCount} Dağıtıldı</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>{completedCount} Tamamlandı</span>
          </span>
          {selected.size > 0 && (
            <span className="ml-auto font-medium text-amber-600 dark:text-gold">
              {selected.size} cüz seçildi
            </span>
          )}
        </div>

        {/* Talimat */}
        <p className="px-6 pt-3 pb-1 font-sans text-sm text-slate-500 dark:text-dark-text-muted flex-shrink-0">
          Okumak istediğiniz cüzleri seçin. Sarı olanlar boş; gri olanlar dağıtılmış.
        </p>


        {/* Proxy atama — yalnızca hatim sahibine gösterilir */}
        {isOwner && (
          <div className="px-6 pb-2 flex-shrink-0">
            <label
              htmlFor="proxy-name"
              className="block font-sans text-sm font-medium text-slate-700 dark:text-dark-text mb-1"
            >
              Başkası Adına Cüz Al
              <span className="ml-1.5 font-normal text-slate-400 dark:text-dark-text-muted">(isteğe bağlı)</span>
            </label>
            <input
              id="proxy-name"
              type="text"
              value={proxyName}
              onChange={(e) => setProxyName(e.target.value)}
              placeholder="Örn: Dedem, Annem, Ali Amca…"
              maxLength={100}
              className={[
                'w-full px-3 py-2 rounded-lg font-sans text-sm',
                'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400',
                'dark:bg-dark-surface-high dark:border-dark-outline dark:text-dark-text dark:placeholder:text-dark-text-muted/60',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                'transition-colors duration-150',
              ].join(' ')}
              aria-describedby="proxy-hint"
            />
            <p id="proxy-hint" className="mt-1 font-sans text-xs text-slate-400 dark:text-dark-text-muted/60">
              Doldurulursa seçilen cüzler bu isim adına kaydedilir.
            </p>
          </div>
        )}

        {/* Cüz Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 pt-2">
            {juzSlots.map((slot) => {
              const isSelected = selected.has(slot.juzNumber)
              const icon = getStatusIcon(slot.status)

              return (
                <button
                  key={slot.juzNumber}
                  type="button"
                  disabled={slot.status !== 'Available' || isLoading}
                  onClick={() => toggleJuz(slot.juzNumber, slot.status)}
                  aria-pressed={isSelected}
                  aria-label={`Cüz ${slot.juzNumber}${slot.status === 'Assigned' ? ` — ${slot.assigneeName}` : ''}`}
                  title={
                    slot.status === 'Assigned'
                      ? `Atandı: ${slot.assigneeName}`
                      : slot.status === 'Completed'
                      ? `Tamamlandı: ${slot.assigneeName}`
                      : `Cüz ${slot.juzNumber} — ${JUZ_NAMES[slot.juzNumber] ?? ''}`
                  }
                  className={[
                    'relative flex flex-col items-center justify-center',
                    'rounded-lg border-2 p-2 transition-all duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                    getJuzStyle(slot),
                  ].join(' ')}
                >
                  {/* Cüz numarası */}
                  <span className="font-serif font-bold text-base leading-none">
                    {slot.juzNumber}
                  </span>
                  {/* Durum ikonu */}
                  {icon && (
                    <span className="text-xs mt-0.5 leading-none">{icon}</span>
                  )}
                  {/* Seçim checkmark */}
                  {isSelected && !icon && (
                    <span className="text-xs mt-0.5 leading-none">✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 flex-shrink-0 border-t border-slate-100 dark:border-dark-outline/60">
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 font-sans text-sm text-red-700 dark:border-error/30 dark:bg-error/10 dark:text-error"
            >
              {error}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="font-sans text-xs text-slate-400 dark:text-dark-text-muted/60">
              {selected.size === 0
                ? 'Henüz cüz seçilmedi'
                : `${selected.size} cüz seçildi: ${Array.from(selected).sort((a, b) => a - b).join(', ')}`}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
                İptal
              </Button>
              <Button
                type="button"
                size="md"
                isLoading={isLoading}
                disabled={selected.size === 0}
                onClick={handleJoin}
              >
                Cüzleri Al ve Katıl
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
