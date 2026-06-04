import { useState, useEffect } from 'react'
import type { Participant } from '@/components/common'
import { hatimService } from '@/services/hatim.service'

// ─── Tip tanımları ────────────────────────────────────────────────────────────
export interface ActiveHatimCard {
  id: string
  title: string
  subtitle: string
  completedJuz: number
  totalJuz: number
  participants: Participant[]
  /** Opsiyonel durum etiketi — "GÜNCEL", "YAKINDA" vb. */
  badgeLabel?: string
  badgeVariant?: 'gold' | 'blue' | 'green' | 'slate'
}

// ─── Mock veri — API hazır olana kadar ───────────────────────────────────────
const MOCK_DATA: ActiveHatimCard[] = [
  {
    id: 'mock-1',
    title: 'Ramazan Birliği',
    subtitle: '1. Cüz\'den Başlıyor',
    completedJuz: 24,
    totalJuz: 30,
    badgeLabel: 'GÜNCEL',
    badgeVariant: 'gold',
    participants: [
      { id: 'p1', initials: 'AY', bgColor: 'bg-amber-500' },
      { id: 'p2', initials: 'MK', bgColor: 'bg-sky-500' },
      { id: 'p3', initials: 'FÇ', bgColor: 'bg-emerald-500' },
      { id: 'p4', initials: 'HB', bgColor: 'bg-violet-500' },
      { id: 'p5', initials: 'ZY', bgColor: 'bg-rose-500' },
      { id: 'p6', initials: 'OK', bgColor: 'bg-teal-500' },
    ],
  },
  {
    id: 'mock-2',
    title: 'Küresel Cuma',
    subtitle: 'Haftalık Topluluk Hatmi',
    completedJuz: 5,
    totalJuz: 30,
    badgeLabel: 'AÇIK',
    badgeVariant: 'blue',
    participants: [
      { id: 'p7', initials: 'SK', bgColor: 'bg-sky-500' },
      { id: 'p8', initials: 'NE', bgColor: 'bg-violet-500' },
      { id: 'p9', initials: 'BT', bgColor: 'bg-amber-500' },
    ],
  },
]

// ─── API yanıtını ActiveHatimCard formatına dönüştür ─────────────────────────
function mapApiToCard(item: Record<string, unknown>): ActiveHatimCard {
  // TODO: Backend hatim modeliyle eşleştir
  return {
    id: String(item.id ?? ''),
    title: String(item.title ?? ''),
    subtitle: String(item.description ?? ''),
    completedJuz: Number(item.completedCount ?? 0),
    totalJuz: 30,
    participants: [],
    badgeLabel: item.status === 'active' ? 'GÜNCEL' : undefined,
    badgeVariant: 'gold',
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
      .then((res) => {
        if (cancelled) return
        if (res.items.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setHatims(res.items.map((item) => mapApiToCard(item as any)))
        } else {
          // API boş dönerse mock data göster
          setHatims(MOCK_DATA.slice(0, limit))
        }
      })
      .catch(() => {
        if (cancelled) return
        // API erişilemiyorsa mock data'ya düş
        setHatims(MOCK_DATA.slice(0, limit))
        setError(null) // Geliştirme aşamasında hata UI'ı gösterme
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [limit, tick])

  return { hatims, isLoading, error, refetch }
}
