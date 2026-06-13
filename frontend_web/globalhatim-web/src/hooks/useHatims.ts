import { useState, useEffect, useCallback } from 'react'
import type { Participant } from '@/components/common'
import { hatimService, FRONTEND_TO_BACKEND_TYPE } from '@/services/hatim.service'
import { parseApiError } from '@/utils/apiError'
import { useAuthStore } from '@/store/auth.store'
import { useDebounce } from './useDebounce'

// ─── Tip tanımları ────────────────────────────────────────────────────────────

export type HatimType     = 'sabit' | 'döngülü' | 'günlük' | 'haftalık'
export type HatimStatus   = 'active' | 'upcoming' | 'completed'
export type FilterType    = 'all' | HatimType

export interface HatimListItem {
  id: string
  title: string
  description: string
  type: HatimType
  completedJuz: number
  totalJuz: number
  participants: Participant[]
  participantCount: number
  status: HatimStatus
  isJoined: boolean
  startDate?: string
}

// ─── Hook seçenekleri / sonucu ────────────────────────────────────────────────

interface UseHatimsOptions {
  search: string
  filter: FilterType
  tab: 'all' | 'mine'
}

export interface GuestJoinInfo {
  guestFirstName: string
  guestLastName:  string
}

interface UseHatimsResult {
  hatims: HatimListItem[]
  isLoading: boolean
  isInitialLoading: boolean
  error: string | null
  refetch: () => void
  joinHatim: (id: string, guestInfo?: GuestJoinInfo) => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHatims({ search, filter, tab }: UseHatimsOptions): UseHatimsResult {
  const user = useAuthStore((s) => s.user)

  const [hatims, setHatims]              = useState<HatimListItem[]>([])
  const [isLoading, setIsLoading]        = useState(false)
  const [isInitialLoading, setIsInitial] = useState(true)
  const [error, setError]                = useState<string | null>(null)
  const [tick, setTick]                  = useState(0)

  const debouncedSearch = useDebounce(search, 400)
  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    const params: Parameters<typeof hatimService.getAll>[0] = { page: 1, pageSize: 50 }
    if (debouncedSearch.trim())  params.search = debouncedSearch.trim()
    if (filter !== 'all')        params.type   = FRONTEND_TO_BACKEND_TYPE[filter]
    if (tab === 'mine')          params.joined = true

    hatimService
      .getAll(params)
      .then((items) => {
        if (cancelled) return
        setHatims(items)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        const { message } = parseApiError(err)
        setError(message)
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
          setIsInitial(false)
        }
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filter, tab, tick])

  // ── joinHatim — optimistic update ──────────────────────────────────────────
  const joinHatim = useCallback(async (id: string, guestInfo?: GuestJoinInfo) => {
    // Optimistic: UI'da hemen joined göster
    setHatims((prev) => prev.map((h) => (h.id === id ? { ...h, isJoined: true } : h)))

    try {
      if (user?.id) {
        // Kayitli kullanici akisi
        await hatimService.join(id, { userId: user.id })
      } else {
        // Misafir akisi — guestInfo caller tarafindan saglanmali
        if (!guestInfo?.guestFirstName || !guestInfo?.guestLastName) {
          throw new Error('Misafir olarak katilmak icin ad ve soyad gereklidir.')
        }
        await hatimService.join(id, {
          guestFirstName: guestInfo.guestFirstName,
          guestLastName:  guestInfo.guestLastName,
        })
      }
    } catch (err) {
      // Hata durumunda geri al
      setHatims((prev) => prev.map((h) => (h.id === id ? { ...h, isJoined: false } : h)))
      const { message } = parseApiError(err)
      setError(message)
    }
  }, [user?.id])

  return { hatims, isLoading, isInitialLoading, error, refetch, joinHatim }
}
