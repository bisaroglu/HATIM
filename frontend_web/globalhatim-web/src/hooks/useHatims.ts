import { useState, useEffect, useMemo } from 'react'
import type { Participant } from '@/components/common'
import { hatimService } from '@/services/hatim.service'

// ─── Tip tanımları ────────────────────────────────────────────────────────────

export type HatimType = 'sabit' | 'döngülü' | 'günlük' | 'haftalık'
export type HatimStatus = 'active' | 'upcoming' | 'completed'
export type FilterType = 'all' | HatimType

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

// ─── Mock veri ────────────────────────────────────────────────────────────────

const MOCK_HATIMS: HatimListItem[] = [
  {
    id: 'h1',
    title: 'Ramazan Hatmi - İstanbul',
    description: 'Birlikte Ramazan ayında tam bir hatim indiriyoruz. Her gün bir cüz.',
    type: 'sabit',
    completedJuz: 15,
    totalJuz: 30,
    participantCount: 24,
    status: 'active',
    isJoined: false,
    participants: [
      { id: 'p1', initials: 'AY', bgColor: 'bg-amber-500' },
      { id: 'p2', initials: 'MK', bgColor: 'bg-sky-500' },
      { id: 'p3', initials: 'FÇ', bgColor: 'bg-emerald-500' },
      { id: 'p4', initials: 'HB', bgColor: 'bg-violet-500' },
      { id: 'p5', initials: 'ZY', bgColor: 'bg-rose-500' },
    ],
  },
  {
    id: 'h2',
    title: 'Haftalık Aile Hatmi',
    description: 'Aile üyeleri arasında haftalık dönen hatim grubumuz.',
    type: 'döngülü',
    completedJuz: 28,
    totalJuz: 30,
    participantCount: 7,
    status: 'active',
    isJoined: true,
    participants: [
      { id: 'p6', initials: 'SK', bgColor: 'bg-sky-500' },
      { id: 'p7', initials: 'NE', bgColor: 'bg-violet-500' },
    ],
  },
  {
    id: 'h3',
    title: 'Küresel Dua Hatmi',
    description: 'Dünya çapında binlerce kişinin katılımıyla gerçekleşen organizasyon.',
    type: 'sabit',
    completedJuz: 5,
    totalJuz: 30,
    participantCount: 1200,
    status: 'active',
    isJoined: false,
    participants: [
      { id: 'p8', initials: 'BT', bgColor: 'bg-amber-500' },
      { id: 'p9', initials: 'OK', bgColor: 'bg-emerald-500' },
    ],
  },
  {
    id: 'h4',
    title: 'İstanbul Gençlik Anması',
    description: 'Gençlik anması için özel, döngülü bir hatim grubu.',
    type: 'sabit',
    completedJuz: 5,
    totalJuz: 30,
    participantCount: 18,
    status: 'upcoming',
    isJoined: false,
    startDate: '15 Oca',
    participants: [
      { id: 'p10', initials: 'EY', bgColor: 'bg-rose-500' },
    ],
  },
  {
    id: 'h5',
    title: 'Günlük Sabah Hatmi',
    description: 'Her sabah fecir vakti okunan günlük hatim programı.',
    type: 'günlük',
    completedJuz: 12,
    totalJuz: 30,
    participantCount: 45,
    status: 'active',
    isJoined: false,
    participants: [
      { id: 'p11', initials: 'CM', bgColor: 'bg-teal-500' },
      { id: 'p12', initials: 'AD', bgColor: 'bg-sky-500' },
      { id: 'p13', initials: 'RK', bgColor: 'bg-amber-500' },
    ],
  },
  {
    id: 'h6',
    title: 'Haftalık Cuma Hatmi',
    description: 'Cuma günleri yapılan haftalık topluluk okuması.',
    type: 'haftalık',
    completedJuz: 20,
    totalJuz: 30,
    participantCount: 33,
    status: 'active',
    isJoined: false,
    participants: [
      { id: 'p14', initials: 'YD', bgColor: 'bg-violet-500' },
      { id: 'p15', initials: 'SB', bgColor: 'bg-emerald-500' },
    ],
  },
]

// ─── API yanıtını dönüştür ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiToItem(item: any): HatimListItem {
  return {
    id: String(item.id ?? ''),
    title: String(item.title ?? ''),
    description: String(item.description ?? ''),
    type: 'sabit',
    completedJuz: Number(item.completedCount ?? 0),
    totalJuz: 30,
    participantCount: Number(item.participantCount ?? 0),
    status: (item.status as HatimStatus) ?? 'active',
    isJoined: false,
    participants: [],
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseHatimsOptions {
  search: string
  filter: FilterType
  tab: 'all' | 'mine'
}

interface UseHatimsResult {
  hatims: HatimListItem[]
  allHatims: HatimListItem[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useHatims({ search, filter, tab }: UseHatimsOptions): UseHatimsResult {
  const [allHatims, setAllHatims] = useState<HatimListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = () => setTick((t) => t + 1)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    hatimService
      .getAll({ page: 1, pageSize: 50 })
      .then((res) => {
        if (cancelled) return
        if (res.items.length > 0) {
          setAllHatims(res.items.map(mapApiToItem))
        } else {
          setAllHatims(MOCK_HATIMS)
        }
      })
      .catch(() => {
        if (!cancelled) setAllHatims(MOCK_HATIMS)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [tick])

  // Client-side arama + filtre — gerçek API'de query param olarak geçilecek
  const hatims = useMemo(() => {
    let result = allHatims

    // Tab filtresi
    if (tab === 'mine') {
      result = result.filter((h) => h.isJoined)
    }

    // Tür filtresi
    if (filter !== 'all') {
      result = result.filter((h) => h.type === filter)
    }

    // Arama
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q),
      )
    }

    return result
  }, [allHatims, search, filter, tab])

  return { hatims, allHatims, isLoading, error, refetch }
}
