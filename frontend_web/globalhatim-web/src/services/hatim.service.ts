import apiClient from './api'
import type { PaginatedResponse, HatimDetails } from '@/types'
import type { HatimListItem, HatimType } from '@/hooks/useHatims'

// Backend DTO tipleri
// HatimSummaryDto (GetActiveHatimsQuery) → JSON camelCase alanları:
//   id, title, description, planType, startDate, endDate, currentCycle,
//   totalParticipants, completedJuz, totalJuz, categoryName, createdAt
interface BackendHatim {
  id?: string | number
  title?: string
  description?: string
  // HatimSummaryDto'dan gelen asıl alan (PlanType → planType)
  planType?: string
  // Geriye dönük uyumluluk
  type?: string
  hatimType?: string
  // İlerleme — HatimSummaryDto'dan gelen asıl alan (CompletedJuz → completedJuz)
  completedJuz?: number
  // Geriye dönük uyumluluk
  completedJuzCount?: number
  completedCount?: number
  totalJuz?: number
  totalJuzCount?: number
  // Katılımcı — HatimSummaryDto'dan gelen asıl alan (TotalParticipants → totalParticipants)
  totalParticipants?: number
  // Geriye dönük uyumluluk
  participantCount?: number
  // Diğer yeni alanlar
  currentCycle?: number
  categoryName?: string
  status?: string
  isJoined?: boolean
  isPublic?: boolean
  startDate?: string
  endDate?: string
  createdAt?: string
  participants?: BackendParticipant[]
}

interface BackendParticipant {
  id?: string | number
  displayName?: string
  fullName?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
}

/** POST /api/JuzAllocations yaniti */
export interface AllocateJuzResponse {
  allocationId: string
  hatimId:      string
  juzNumber:    number
  assigneeName: string
  guestToken:   string | null
}

export interface CreateHatimRequest {
  title: string
  description?: string
  creatorUserId: string
  planType: 1 | 2 | 3 | 4
  readPacing: 1 | 2 | 3
  startDate: string
  isPublic: boolean
  categoryId?: number
  endDate?: string
}

export interface HatimQueryParams {
  search?: string
  type?: string
  joined?: boolean
  status?: string
  page?: number
  pageSize?: number
}

const FRONTEND_TO_BACKEND_TYPE: Record<HatimType, string> = {
  sabit:        'Fixed',
  'döngülü':   'Cyclic',
  'günlük':    'Daily',
  'haftalık':  'Weekly',
}

const BACKEND_TO_FRONTEND_TYPE: Record<string, HatimType> = {
  Fixed:   'sabit',
  Cyclic:  'döngülü',
  Daily:   'günlük',
  Weekly:  'haftalık',
  fixed:   'sabit',
  cyclic:  'döngülü',
  daily:   'günlük',
  weekly:  'haftalık',
  sabit:   'sabit',
}


const AVATAR_COLORS = [
  'bg-amber-500', 'bg-sky-500', 'bg-emerald-500',
  'bg-violet-500', 'bg-rose-500', 'bg-teal-500',
]

function getInitials(p: BackendParticipant): string {
  const full =
    p.displayName ?? p.fullName ??
    `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()
  const parts = full.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return '??'
}

function mapBackendHatim(raw: BackendHatim, index = 0): HatimListItem {
  // planType: HatimSummaryDto'dan gelen asıl ad; type/hatimType geriye dönük uyumluluk
  const rawType = raw.planType ?? raw.type ?? raw.hatimType ?? ''
  const type: HatimType = BACKEND_TO_FRONTEND_TYPE[rawType] ?? 'sabit'

  const participants = (raw.participants ?? []).map((p, i) => ({
    id: String(p.id ?? `p-${i}`),
    initials: getInitials(p),
    avatarUrl: p.avatarUrl,
    bgColor: AVATAR_COLORS[(index + i) % AVATAR_COLORS.length],
  }))

  return {
    id:               String(raw.id ?? ''),
    title:            raw.title ?? '',
    description:      raw.description ?? '',
    type,
    // completedJuz: HatimSummaryDto'dan CompletedJuz → completedJuz (asıl alan)
    completedJuz:     Number(raw.completedJuz ?? raw.completedJuzCount ?? raw.completedCount ?? 0),
    totalJuz:         Number(raw.totalJuz ?? raw.totalJuzCount ?? 30),
    // totalParticipants: HatimSummaryDto'dan TotalParticipants → totalParticipants (asıl alan)
    participantCount: Number(raw.totalParticipants ?? raw.participantCount ?? participants.length),
    status:           (raw.status?.toLowerCase() as HatimListItem['status']) ?? 'active',
    isJoined:         raw.isJoined ?? false,
    startDate:        raw.startDate,
    participants,
  }
}

function normalizePaginatedResponse(data: unknown): HatimListItem[] {
  if (Array.isArray(data)) {
    return data.map((item, i) => mapBackendHatim(item as BackendHatim, i))
  }
  const paged = data as PaginatedResponse<BackendHatim>
  const items = paged.items ?? (paged as unknown as { data: BackendHatim[] }).data ?? []
  return items.map((item, i) => mapBackendHatim(item, i))
}

export const hatimService = {
  async getAll(params: HatimQueryParams = {}): Promise<HatimListItem[]> {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== false)
    )
    const res = await apiClient.get<unknown>('/Hatims', { params: cleanParams })
    return normalizePaginatedResponse(res.data)
  },

  async getById(id: string): Promise<HatimListItem> {
    const res = await apiClient.get<BackendHatim>(`/Hatims/${id}`)
    return mapBackendHatim(res.data)
  },

  async create(data: CreateHatimRequest): Promise<HatimListItem> {
    const res = await apiClient.post<BackendHatim>('/Hatims', data)
    return mapBackendHatim(res.data)
  },

  async join(
    hatimId: string,
    params:
      | { userId: string; guestFirstName?: never; guestLastName?: never }
      | { guestFirstName: string; guestLastName: string; userId?: never }
  ): Promise<void> {
    await apiClient.post(`/Hatims/${hatimId}/join`, {
      userId:         'userId' in params ? params.userId : null,
      guestFirstName: 'guestFirstName' in params ? params.guestFirstName : null,
      guestLastName:  'guestLastName'  in params ? params.guestLastName  : null,
    })
  },

  async leave(id: string): Promise<void> {
    await apiClient.delete(`/Hatims/${id}/join`)
  },

  async getDetails(id: string): Promise<HatimDetails> {
    const res = await apiClient.get<HatimDetails>(`/Hatims/${id}`)
    return res.data
  },

  async getAvailableJuzs(hatimId: string): Promise<number[]> {
    const res = await apiClient.get<{
      hatimId: string
      cycleNumber: number
      availableJuzNumbers: number[]
    }>(`/Hatims/${hatimId}/available-juzs`)
    return res.data.availableJuzNumbers
  },

  async joinWithSelectedJuzs(
    hatimId: string,
    juzNumbers: number[],
    params:
      | { userId: string; guestFirstName?: never; guestLastName?: never; proxyName?: string }
      | { guestFirstName: string; guestLastName: string; userId?: never; proxyName?: never }
  ): Promise<AllocateJuzResponse[]> {
    const res = await apiClient.post<AllocateJuzResponse[]>(
      `/Hatims/${hatimId}/join-selected`,
      {
        juzNumbers,
        userId:         'userId' in params ? params.userId : null,
        guestFirstName: 'guestFirstName' in params ? params.guestFirstName : null,
        guestLastName:  'guestLastName'  in params ? params.guestLastName  : null,
        proxyName:      'proxyName' in params && params.proxyName ? params.proxyName : null,
      }
    )
    return res.data
  },

  async allocateJuz(
    hatimId: string,
    juzNumber: number,
    params:
      | { userId: string; guestFirstName?: never; guestLastName?: never }
      | { guestFirstName: string; guestLastName: string; userId?: never }
  ): Promise<AllocateJuzResponse> {
    const res = await apiClient.post<AllocateJuzResponse>('/JuzAllocations', {
      hatimId,
      juzNumber,
      userId:         'userId' in params ? params.userId : null,
      guestFirstName: 'guestFirstName' in params ? params.guestFirstName : null,
      guestLastName:  'guestLastName'  in params ? params.guestLastName  : null,
    })
    return res.data
  },
}

export { FRONTEND_TO_BACKEND_TYPE }
