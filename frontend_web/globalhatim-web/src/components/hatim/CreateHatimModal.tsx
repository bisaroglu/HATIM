import {
  useState,
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { Input, Button } from '@/components/common'
import { hatimService, type CreateHatimRequest } from '@/services/hatim.service'
import { parseApiError } from '@/utils/apiError'
import { useAuthStore } from '@/store/auth.store'

// ─── PlanType (Hatim Türü) — backend PlanType enum: Fixed=1, Cyclic=2, Daily=3, Weekly=4 ──
const HATIM_TYPE_OPTIONS: { value: 1 | 2 | 3 | 4; label: string; hint: string }[] = [
  { value: 1, label: 'Sabit Hatim',    hint: 'Belirli bir süre ve tempoda tamamlanır.' },
  { value: 2, label: 'Döngülü Hatim',  hint: 'Tamamlandıkça yeni döngü otomatik başlar.' },
  { value: 3, label: 'Günlük Hatim',   hint: 'Topluluk her gün birlikte 1 cüz okur.' },
  { value: 4, label: 'Haftalık Hatim', hint: 'Haftada 1 cüz okunur; uzun soluklu.' },
]

// ─── ReadPacing (Okuma Hızı) — backend ReadPacing enum: Daily1Juz=1, Every2Days1Juz=2, Every4Days1Juz=3 ──
const READ_PACING_OPTIONS: { value: 1 | 2 | 3; label: string; hint: string }[] = [
  { value: 1, label: 'Günde 1 Cüz',              hint: 'Her okuyucunun deadline\'ı +1 gün.' },
  { value: 2, label: '2 Günde 1 Cüz',             hint: 'Her okuyucunun deadline\'ı +2 gün.' },
  { value: 3, label: '4 Günde 1 Cüz / Günde 1 Hizb', hint: 'Her okuyucunun deadline\'ı +4 gün.' },
]

const todayStr = () => new Date().toISOString().split('T')[0]

// ─── Yeniden kullanılabilir select alanı ──────────────────────────────────────
interface SelectFieldProps {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  options: { value: number; label: string; hint: string }[]
}

function SelectField({ id, label, value, onChange, options }: SelectFieldProps) {
  const selectedHint = options.find((o) => o.value === value)?.hint
  const selectCls = [
    'w-full appearance-none bg-transparent',
    'border-b border-slate-300 dark:border-dark-outline pb-2',
    'font-sans text-body-md text-slate-900 dark:text-dark-text',
    'focus:outline-none focus:border-slate-900 dark:focus:border-gold',
    'transition-colors duration-150 focus-visible:ring-0 cursor-pointer',
    'dark:[&>option]:bg-dark-surface',
  ].join(' ')

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-sans text-label-md uppercase tracking-widest text-slate-600 dark:text-gold/80"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={selectCls}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div aria-hidden="true" className="pointer-events-none absolute right-0 bottom-2.5">
          <svg className="h-4 w-4 text-slate-400 dark:text-dark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {selectedHint && (
        <p className="font-sans text-xs text-slate-400 dark:text-dark-text-muted/60" aria-live="polite">
          {selectedHint}
        </p>
      )}
    </div>
  )
}

interface CreateHatimModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return
    const el = containerRef.current
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable[0]?.focus()

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const first = focusable[0]
      const last  = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus() }
      }
    }

    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [isActive, containerRef])
}

export function CreateHatimModal({ isOpen, onClose, onCreated }: CreateHatimModalProps) {
  const user = useAuthStore((s) => s.user)

  const [title,       setTitle]      = useState('')
  const [description, setDesc]       = useState('')
  const [planType,    setPlanType]   = useState<1 | 2 | 3 | 4>(1)
  const [readPacing,  setReadPacing] = useState<1 | 2 | 3>(2)   // default: 2 günde 1 cüz
  const [startDate,   setStartDate]  = useState(todayStr())
  const [endDate,     setEndDate]    = useState('')
  const [isPublic,    setIsPublic]   = useState(true)
  const [isLoading,   setIsLoading]  = useState(false)
  const [error,       setError]      = useState<string | null>(null)
  const [fieldErrors, setFE]         = useState<Record<string, string>>({})

  const dialogRef = useRef<HTMLDivElement>(null)
  useFocusTrap(dialogRef, isOpen)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) {
      setTitle(''); setDesc(''); setPlanType(1); setReadPacing(2)
      setStartDate(todayStr()); setEndDate(''); setIsPublic(true)
      setError(null); setFE({})
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!title.trim())             errs.title     = 'Hatim başlığı gerekli.'
    if (title.trim().length > 255) errs.title     = 'Başlık en fazla 255 karakter olabilir.'
    if (!startDate)                errs.startDate = 'Başlangıç tarihi gerekli.'
    if (endDate && endDate <= startDate)
                                   errs.endDate   = 'Bitiş tarihi başlangıç tarihinden sonra olmalı.'
    return errs
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!user?.id) {
      setError('İşlem için giriş yapmanız gerekiyor.')
      return
    }

    const errs = validate()
    if (Object.keys(errs).length) { setFE(errs); return }
    setFE({})

    // Backend HatimsController.CreateHatimRequest DTO ile milimetrik eşleşme
    const payload: CreateHatimRequest = {
      title:         title.trim(),
      description:   description.trim() || undefined,
      creatorUserId: user.id,
      planType,     // int: 1=Fixed, 2=Cyclic, 3=Daily, 4=Weekly
      readPacing,   // int: 1=Daily1Juz, 2=Every2Days1Juz, 3=Every4Days1Juz
      startDate,
      isPublic,
      endDate:       endDate || undefined,
    }

    setIsLoading(true)
    try {
      await hatimService.create(payload)
      onCreated()
      onClose()
    } catch (err) {
      const parsed = parseApiError(err)
      setError(parsed.message)
      if (parsed.fieldErrors) setFE(parsed.fieldErrors)
      setIsLoading(false)
    }
  }

  const handleOverlayKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.key === 'Enter') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={handleOverlayKeyDown}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-hatim-title"
        aria-busy={isLoading}
        className={[
          'relative w-full max-w-lg',
          'rounded-xl border shadow-xl',
          'bg-white border-slate-200',
          'dark:bg-dark-surface dark:border-dark-outline dark:shadow-glass',
          'animate-fade-in',
          'max-h-[90vh] overflow-y-auto',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-dark-outline/60">
          <h2
            id="create-hatim-title"
            className="font-serif text-xl text-slate-900 dark:text-dark-text"
          >
            Yeni Hatim Oluştur
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Modalı kapat"
            className={[
              'flex items-center justify-center h-8 w-8 rounded-full',
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-busy={isLoading}
          className="px-6 py-5 flex flex-col gap-5"
        >
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-sans text-sm text-red-700 dark:border-error/30 dark:bg-error/10 dark:text-error"
            >
              {error}
            </div>
          )}

          {/* Başlık */}
          <Input
            label="Hatim Başlığı"
            type="text"
            placeholder="Ramazan Topluluk Hatmi"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setFE((p) => ({ ...p, title: undefined! })) }}
            error={fieldErrors.title}
            required
            autoFocus
          />

          {/* Açıklama */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="hatim-desc"
              className="font-sans text-label-md uppercase tracking-widest text-slate-600 dark:text-gold/80"
            >
              Açıklama
            </label>
            <textarea
              id="hatim-desc"
              rows={3}
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Hatim hakkında kısa bir açıklama..."
              className={[
                'w-full bg-transparent rounded-md px-0 py-2',
                'border-b border-slate-300 dark:border-dark-outline',
                'font-sans text-body-md text-slate-900 dark:text-dark-text',
                'placeholder:text-slate-400 dark:placeholder:text-dark-text-muted/40',
                'focus:outline-none focus:border-slate-900 dark:focus:border-gold',
                'transition-colors duration-150 resize-none focus-visible:ring-0',
              ].join(' ')}
            />
          </div>

          {/* Hatim Türü — PlanType int: 1=Fixed, 2=Cyclic, 3=Daily, 4=Weekly */}
          <SelectField
            id="hatim-type"
            label="Hatim Türü"
            value={planType}
            onChange={(v) => setPlanType(v as 1 | 2 | 3 | 4)}
            options={HATIM_TYPE_OPTIONS}
          />

          {/* Okuma Hızı — ReadPacing int: 1=Daily1Juz, 2=Every2Days1Juz, 3=Every4Days1Juz */}
          <SelectField
            id="hatim-pacing"
            label="Okuma Hızı"
            value={readPacing}
            onChange={(v) => setReadPacing(v as 1 | 2 | 3)}
            options={READ_PACING_OPTIONS}
          />

          {/* Tarihler — yan yana */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Başlangıç Tarihi"
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setFE((p) => ({ ...p, startDate: undefined! })) }}
              error={fieldErrors.startDate}
              min={todayStr()}
              required
            />
            <Input
              label="Bitiş Tarihi (opsiyonel)"
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setFE((p) => ({ ...p, endDate: undefined! })) }}
              error={fieldErrors.endDate}
              min={startDate || todayStr()}
            />
          </div>

          {/* Herkese Açık toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="font-sans text-sm font-medium text-slate-700 dark:text-dark-text">
                Herkese Açık
              </p>
              <p className="font-sans text-xs text-slate-400 dark:text-dark-text-muted/60 mt-0.5">
                Kapalı ise yalnızca davet edilenler katılabilir
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              aria-label="Herkese açık toggle"
              onClick={() => setIsPublic((v) => !v)}
              className={[
                'relative h-6 w-11 rounded-full flex-shrink-0 transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
                'focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-surface',
                isPublic
                  ? 'bg-slate-900 dark:bg-gold-dim'
                  : 'bg-slate-200 dark:bg-dark-surface-high',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className={[
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                  isPublic ? 'translate-x-5' : 'translate-x-0.5',
                ].join(' ')}
              />
            </button>
          </div>

          {/* Aksiyonlar */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-dark-outline/60">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
              İptal
            </Button>
            <Button type="submit" size="md" isLoading={isLoading}>
              Hatim Oluştur
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
