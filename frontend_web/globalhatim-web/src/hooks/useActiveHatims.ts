import { useState, useEffect } from 'react'
import type { Participant } from '@/components/common'
import { hatimService } from '@/services/hatim.service'
import type { HatimListItem } from '@/hooks/useHatims'
import { parseApiError } from '@/utils/apiError'

// ─── Tip tanımları ────────────────────────────────────────────────────────────
export interface ActiveHatimCard {
  id: string
  title: string
  subtitle: string
  completedJuz: number
  totalJuz: number
  participants: Participant[]
  /** Opsiyonel durum etiketi — "GÜNCEL", "AÇIK" vb. */
  badgeLabel?: string
  badgeVariant?: 'gold' | 'blue' | 'green' | 'slate'
}

// ─── HatimListItem → ActiveHatimCard dönüştürücü ─────────────────────────────
const STATUS_BADGE: Record<string, { label: string; variant: ActiveHatimCard['badgeVariant'] }> = {
  active:    { label: 'GÜNCEL', variant: 'gold' },
  completed: { label: 'TAMAMLANDI', variant: 'green' },
  pending:   { label: 'YAKINDA', variant: 'blue' },
}

function mapToCard(item: HatimListItem): ActiveHatimCard {
  const badge = STATUS_BADGE[item.status] ?? { label: undefined, variant: 'slate' }
  return {
    id:           item.id,
    title:        item.title,
    subtitle:     item.description,
    completedJuz: item.completedJuz,
    totalJuz:     item.totalJuz,
    participants: item.participants ?? [],
    badgeLabel:   badge.label,
    badgeVariant: badge.variant,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
interface UseActiveHatimsResult {
  hatims: ActiveHatimCard[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useActiveHatims(limit = 4): UseActiveHatimsResult {
  const [hatims, setHatims] = useState<ActiveHatimCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = () => setTick((t) => t + 1)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    hatimService
      .getAll({ page: 1, pageSize: limit, status: 'active' })
      .then((items) => {
        if (cancelled) return
        setHatims(items.slice(0, limit).map(mapToCard))
      })
      .catch((err) => {
        if (cancelled) return
        setError(parseApiError(err).message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [limit, tick])

  return { hatims, isLoading, error, refetch }
}
