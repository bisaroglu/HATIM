import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { Button } from '@/components/common'
import { ProgressBar } from '@/components/common/ProgressBar'
import JoinHatimModal from '@/components/hatim/JoinHatimModal'
import { hatimService } from '@/services/hatim.service'
import { parseApiError } from '@/utils/apiError'
import { useAuthStore } from '@/store/auth.store'
import type { HatimDetails, JuzSlot } from '@/types'

const PLAN_LABELS: Record<string, string> = {
  Fixed:   'Sabit',
  Cyclic:  'Donguelu',
  Daily:   'Gunluk',
  Weekly:  'Haftalik',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Active:    { label: 'Aktif',      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    Completed: { label: 'Tamamlandi', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    Cancelled: { label: 'Iptal',      cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    Paused:    { label: 'Duraklati',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  }
  const entry = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 dark:bg-dark-surface-high dark:text-dark-text-muted' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-xs font-medium ${entry.cls}`}>
      {entry.label}
    </span>
  )
}

function getJuzMiniStyle(slot: JuzSlot): string {
  if (slot.status === 'Completed') return 'bg-emerald-500 dark:bg-emerald-600'
  if (slot.status === 'Assigned')  return 'bg-slate-300 dark:bg-dark-outline'
  return 'bg-amber-300 dark:bg-gold/50'
}

function Skeleton() {
  return (
    <section className="container py-section max-w-4xl mx-auto px-4">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-dark-surface-high" />
        <div className="h-8 w-2/3 rounded bg-slate-200 dark:bg-dark-surface-high" />
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-slate-200 dark:bg-dark-surface-high" />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HatimDetayPage() {
  const { id }        = useParams<{ id: string }>()
  const navigate      = useNavigate()
  const location      = useLocation()
  const user          = useAuthStore((s) => s.user)
  const autoOpenedRef = useRef(false)

  const [hatim, setHatim]                   = useState<HatimDetails | null>(null)
  const [isLoading, setIsLoading]           = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [showJoinModal, setShowJoinModal]   = useState(false)
  const [joinSuccess, setJoinSuccess]       = useState(false)

  const loadHatim = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await hatimService.getDetails(id)
      setHatim(data)
    } catch (err) {
      const { message } = parseApiError(err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { loadHatim() }, [loadHatim])

  // HatimlerPage'deki "Katıl" butonu state: { openJoin: true } ile yönlendirir.
  // Hatim verisi ilk yüklenince modal'ı otomatik aç; tekrar tetiklenmemesi için ref kullan.
  useEffect(() => {
    if (!hatim || autoOpenedRef.current) return
    if ((location.state as { openJoin?: boolean } | null)?.openJoin) {
      autoOpenedRef.current = true
      setShowJoinModal(true)
      // State'i temizle — geri butonu ile dönüldüğünde yeniden açılmasın
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [hatim, location.state, location.pathname, navigate])

  const handleJoinSuccess = async () => {
    setShowJoinModal(false)
    setJoinSuccess(true)
    await loadHatim()
  }

  if (isLoading) return <Skeleton />

  if (error) {
    return (
      <section className="container py-section">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center dark:border-error/30 dark:bg-error/10">
          <p className="font-serif text-lg text-red-700 dark:text-error mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Geri Don
          </Button>
        </div>
      </section>
    )
  }

  if (!hatim) return null

  const completedCount = hatim.juzSlots.filter((s) => s.status === 'Completed').length
  const assignedCount  = hatim.juzSlots.filter((s) => s.status === 'Assigned').length
  const availableCount = hatim.juzSlots.filter((s) => s.status === 'Available').length
  const progressPct    = Math.round((completedCount / 30) * 100)

  const canJoin = !!user && hatim.status === 'Active' && availableCount > 0

  return (
    <>
      <section className="container py-section max-w-4xl mx-auto px-4">

        <Link
          to="/hatimler"
          className="inline-flex items-center gap-1.5 font-sans text-sm text-slate-500 hover:text-slate-800 dark:text-dark-text-muted dark:hover:text-dark-text mb-6 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Tum Hatimler
        </Link>

        {joinSuccess && (
          <div role="alert" className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-700/40 dark:bg-emerald-900/20">
            <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="font-sans text-sm text-emerald-700 dark:text-emerald-400">
              Hatime basariyla katildiniz! Sectiginiz cuzler size atandi.
            </p>
            <button type="button" onClick={() => setJoinSuccess(false)} aria-label="Kapat" className="ml-auto text-emerald-500 hover:text-emerald-700 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Baslik karti */}
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-dark-surface dark:border-dark-outline p-6 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {hatim.categoryName && (
              <span className="font-sans text-xs text-slate-500 dark:text-dark-text-muted bg-slate-100 dark:bg-dark-surface-high rounded-full px-2.5 py-0.5">
                {hatim.categoryName}
              </span>
            )}
            <StatusBadge status={hatim.status} />
            <span className="font-sans text-xs text-slate-500 dark:text-dark-text-muted bg-slate-100 dark:bg-dark-surface-high rounded-full px-2.5 py-0.5">
              {PLAN_LABELS[hatim.planType] ?? hatim.planType}
            </span>
            {!hatim.isPublic && (
              <span className="font-sans text-xs text-slate-500 dark:text-dark-text-muted bg-slate-100 dark:bg-dark-surface-high rounded-full px-2.5 py-0.5">
                Ozel
              </span>
            )}
          </div>

          <h1 className="font-serif text-headline-lg-mobile lg:text-headline-lg text-slate-900 dark:text-dark-text mb-2">
            {hatim.title}
          </h1>

          {hatim.description && (
            <p className="font-sans text-body-md text-slate-600 dark:text-dark-text-muted mb-4">
              {hatim.description}
            </p>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-1 font-sans text-sm text-slate-500 dark:text-dark-text-muted mb-5">
            <span>Organizator: <strong className="text-slate-700 dark:text-dark-text">{hatim.creatorName}</strong></span>
            <span>Baslangic: <strong className="text-slate-700 dark:text-dark-text">{hatim.startDate}</strong></span>
            {hatim.endDate && <span>Bitis: <strong className="text-slate-700 dark:text-dark-text">{hatim.endDate}</strong></span>}
            <span>Dongu: <strong className="text-slate-700 dark:text-dark-text">{hatim.currentCycle}/{hatim.totalCycles}</strong></span>
            <span>Katilimci: <strong className="text-slate-700 dark:text-dark-text">{hatim.totalParticipants}</strong></span>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between font-sans text-sm mb-2">
              <span className="text-slate-600 dark:text-dark-text-muted">Genel Ilerleme</span>
              <span className="font-medium text-slate-800 dark:text-dark-text">{completedCount}/30 Cuz - %{progressPct}</span>
            </div>
            <ProgressBar value={progressPct} label={`Hatim ilerlemesi %${progressPct}`} />
          </div>

          {user ? (
            canJoin ? (
              <Button size="md" onClick={() => setShowJoinModal(true)}>
                Hatime Katil
              </Button>
            ) : hatim.status !== 'Active' ? (
              <p className="font-sans text-sm text-slate-400 dark:text-dark-text-muted">Bu hatim su anda katilima kapali.</p>
            ) : (
              <p className="font-sans text-sm text-slate-400 dark:text-dark-text-muted">Tum cuzler dagitilmis, yeni katilim alinmiyor.</p>
            )
          ) : (
            <Link to="/auth">
              <Button size="md" variant="secondary">Katilmak icin Giris Yap</Button>
            </Link>
          )}
        </div>

        {/* Cuz durumu karti */}
        <div className="rounded-2xl border bg-white border-slate-200 dark:bg-dark-surface dark:border-dark-outline p-6">
          <h2 className="font-serif text-xl text-slate-900 dark:text-dark-text mb-4">Cuz Durumu</h2>

          <div className="flex flex-wrap gap-4 mb-5 font-sans text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-300 dark:bg-gold/50 inline-block" />
              <span className="text-slate-600 dark:text-dark-text-muted">Bos <strong className="text-slate-800 dark:text-dark-text">{availableCount}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-dark-outline inline-block" />
              <span className="text-slate-600 dark:text-dark-text-muted">Dagitildi <strong className="text-slate-800 dark:text-dark-text">{assignedCount}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 dark:bg-emerald-600 inline-block" />
              <span className="text-slate-600 dark:text-dark-text-muted">Tamamlandi <strong className="text-slate-800 dark:text-dark-text">{completedCount}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
            {hatim.juzSlots.map((slot) => (
              <div
                key={slot.juzNumber}
                title={slot.status === 'Available' ? `Cuz ${slot.juzNumber} - Bos` : `Cuz ${slot.juzNumber} - ${slot.assigneeName}`}
                className={['relative rounded-lg flex flex-col items-center justify-center p-1.5 min-h-[3rem] transition-colors duration-150', getJuzMiniStyle(slot)].join(' ')}
              >
                <span className="font-serif font-bold text-sm leading-none text-white">{slot.juzNumber}</span>
                {slot.status === 'Completed' && <span className="text-white text-[10px] leading-none mt-0.5">v</span>}
                {slot.status === 'Assigned' && slot.assigneeName !== '-' && (
                  <span className="text-[9px] leading-none mt-0.5 truncate w-full text-center text-slate-600 dark:text-dark-text-muted">
                    {slot.assigneeName.split(' ')[0]}
                  </span>
                )}
              </div>
            ))}
          </div>

          {(assignedCount + completedCount) > 0 && (
            <details className="mt-6 group">
              <summary className="font-sans text-sm text-slate-500 dark:text-dark-text-muted cursor-pointer hover:text-slate-700 dark:hover:text-dark-text select-none transition-colors">
                <span className="group-open:hidden">Atanan cuzleri goster ({assignedCount + completedCount})</span>
                <span className="hidden group-open:inline">Gizle</span>
              </summary>
              <div className="mt-3 divide-y divide-slate-100 dark:divide-dark-outline/40 max-h-64 overflow-y-auto">
                {hatim.juzSlots
                  .filter((s) => s.status !== 'Available')
                  .map((slot) => (
                    <div key={slot.allocationId} className="flex items-center justify-between py-2 font-sans text-sm">
                      <span className="text-slate-700 dark:text-dark-text">Cuz {slot.juzNumber}</span>
                      <span className={slot.status === 'Completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-dark-text-muted'}>
                        {slot.assigneeName}{slot.status === 'Completed' ? ' v' : ''}
                      </span>
                    </div>
                  ))}
              </div>
            </details>
          )}
        </div>
      </section>

      {showJoinModal && (
        <JoinHatimModal
          hatimId={hatim.id}
          hatimTitle={hatim.title}
          creatorId={hatim.creatorId}
          juzSlots={hatim.juzSlots}
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleJoinSuccess}
        />
      )}
    </>
  )
}
