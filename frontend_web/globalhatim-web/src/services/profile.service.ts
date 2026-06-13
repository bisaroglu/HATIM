import apiClient from './api'
import type { UserProfile, UserHatimEntry, RecitationLevel } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Backend ham yanıt tipleri
// ─────────────────────────────────────────────────────────────────────────────

// UserStatsDto (GetMyProfileQuery) → JSON camelCase:
//   totalJuzRead, totalHatimsJoined, totalHatimsCompleted, totalHatimsCreated
interface BackendStats {
  totalJuzRead?: number
  totalHatimsJoined?: number
  totalHatimsCompleted?: number
  totalHatimsCreated?: number
}

interface BackendProfile {
  // UserProfileDto: UserId (C#) → userId (JSON camelCase)
  userId?: string
  // Geriye dönük uyumluluk
  id?: string | number
  email?: string
  firstName?: string
  lastName?: string
  displayName?: string
  fullName?: string
  avatarUrl?: string
  profilePictureUrl?: string
  memberType?: string
  membershipType?: string
  /** C# enum: "Mubtedi" | "Mutawassit" | "Mutaqaddim" | "Mujawwid" */
  level?: string
  recitationLevel?: string
  stats?: BackendStats
  statistics?: BackendStats
  joinedAt?: string
  createdAt?: string
}

/**
 * Backend UserAllocationDto — UsersController.GetAllocations yanıtı.
 * Tüm alan isimleri camelCase (ExceptionHandlingMiddleware JsonNamingPolicy.CamelCase)
 */
interface BackendHatimEntry {
  // UserAllocationDto alanları (yeni backend format)
  allocationId?: string
  hatimId?: string | number
  hatimTitle?: string
  creatorName?: string
  planType?: string   // "Every2Days1Juz" | "WeeklyNoAccel" | "LongTermHybrid"
  juzNumber?: number
  cycleNumber?: number
  completedJuzInHatim?: number
  totalJuz?: number
  assignedAt?: string
  deadlineAt?: string

  // Eski/alternatif alan isimleri (backward-compat)
  id?: string | number
  title?: string
  organizerName?: string
  organizer?: string
  hatimType?: string
  type?: string
  assignedJuzNumber?: number
  assignedJuz?: number
  surahName?: string
  surahTitle?: string
  hatimProgressPercentage?: number
  progress?: number
  completedJuzCount?: number
  completedJuz?: number
  daysRemaining?: number
  remainingDays?: number
  status?: string
  juzStatus?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Eşleştirme tabloları
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_MAP: Record<string, { level: RecitationLevel; label: string }> = {
  mubtedi:    { level: 'MUBTEDI',     label: 'MUBTEDİ' },
  Mubtedi:    { level: 'MUBTEDI',     label: 'MUBTEDİ' },
  MUBTEDI:    { level: 'MUBTEDI',     label: 'MUBTEDİ' },
  mutawassit: { level: 'MUTAWASSIT',  label: 'MUTAVASSIT' },
  Mutawassit: { level: 'MUTAWASSIT',  label: 'MUTAVASSIT' },
  MUTAWASSIT: { level: 'MUTAWASSIT',  label: 'MUTAVASSIT' },
  mutaqaddim: { level: 'MUTAQADDIM',  label: 'MUTAKADDIM' },
  Mutaqaddim: { level: 'MUTAQADDIM',  label: 'MUTAKADDIM' },
  MUTAQADDIM: { level: 'MUTAQADDIM',  label: 'MUTAKADDIM' },
  mujawwid:   { level: 'MUJAWWID',    label: 'MÜCEVVID' },
  Mujawwid:   { level: 'MUJAWWID',    label: 'MÜCEVVID' },
  MUJAWWID:   { level: 'MUJAWWID',    label: 'MÜCEVVID' },
}

const TYPE_BADGE_MAP: Record<string, { badge: string; variant: UserHatimEntry['typeBadgeVariant'] }> = {
  // Yeni PlanType enum değerleri
  Every2Days1Juz:  { badge: 'Plan B – 2 Günde 1 Cüz', variant: 'amber' },
  WeeklyNoAccel:   { badge: 'Plan E – Haftalık',       variant: 'sky' },
  LongTermHybrid:  { badge: 'Plan F – Uzun Vadeli',    variant: 'emerald' },
  // Eski string format fallback
  Fixed:   { badge: 'Sabit Hatim',    variant: 'amber' },
  fixed:   { badge: 'Sabit Hatim',    variant: 'amber' },
  Cyclic:  { badge: 'Döngülü Hatim',  variant: 'sky' },
  cyclic:  { badge: 'Döngülü Hatim',  variant: 'sky' },
  Daily:   { badge: 'Günlük Hatim',   variant: 'emerald' },
  daily:   { badge: 'Günlük Hatim',   variant: 'emerald' },
  Weekly:  { badge: 'Haftalık Hatim', variant: 'slate' },
  weekly:  { badge: 'Haftalık Hatim', variant: 'slate' },
}

/** Juz assignment durumunu aksiyon tipine çevir */
function mapStatus(raw: string | undefined): UserHatimEntry['action'] {
  const s = (raw ?? '').toLowerCase()
  if (s === 'pending' || s === 'not_started')   return 'approve'
  if (s === 'inprogress' || s === 'in_progress') return 'start'
  return 'view'
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalizasyon fonksiyonları
// ─────────────────────────────────────────────────────────────────────────────

function normalizeProfile(raw: BackendProfile): UserProfile {
  const rawLevel = raw.level ?? raw.recitationLevel ?? 'Mujawwid'
  const levelData = LEVEL_MAP[rawLevel] ?? { level: 'MUJAWWID' as RecitationLevel, label: 'MÜCEVVID' }

  // UserProfileDto → JSON: stats.totalJuzRead / totalHatimsCompleted / totalHatimsCreated
  const stats = raw.stats ?? {}
  const nameParts = (raw.displayName ?? raw.fullName ?? '').split(' ')

  return {
    // UserProfileDto.UserId → JSON: userId
    id:          String(raw.userId ?? raw.id ?? ''),
    firstName:   raw.firstName ?? nameParts[0] ?? '',
    lastName:    raw.lastName  ?? nameParts.slice(1).join(' ') ?? '',
    email:       raw.email ?? '',
    avatarUrl:   raw.avatarUrl ?? raw.profilePictureUrl,
    memberType:  raw.memberType ?? raw.membershipType ?? 'Global Hatim Member',
    level:       levelData.level,
    levelLabel:  levelData.label,
    joinedAt:    raw.joinedAt ?? raw.createdAt ?? new Date().toISOString(),
    stats: {
      // Direkt eşleşme — UserStatsDto camelCase alan adları
      readJuz:         stats.totalJuzRead         ?? 0,
      completedHatims: stats.totalHatimsCompleted  ?? 0,
      createdHatims:   stats.totalHatimsCreated    ?? 0,
    },
  }
}

function normalizeEntry(raw: BackendHatimEntry): UserHatimEntry {
  // Yeni UserAllocationDto formatı (planType) veya eski format (hatimType/type) her ikisini destekle
  const rawType  = raw.planType ?? raw.hatimType ?? raw.type ?? 'Every2Days1Juz'
  const typeData = TYPE_BADGE_MAP[rawType] ?? { badge: 'Hatim', variant: 'slate' as const }

  // allocationId: yeni formatta allocationId, eski formatta id
  const allocationId = raw.allocationId ?? String(raw.id ?? '')

  // deadline → daysRemaining hesapla (backend deadlineAt ISO string döndürür)
  let daysRemaining: number | undefined
  if (raw.daysRemaining !== undefined) {
    daysRemaining = Number(raw.daysRemaining)
  } else if (raw.remainingDays !== undefined) {
    daysRemaining = Number(raw.remainingDays)
  } else if (raw.deadlineAt) {
    const diff = new Date(raw.deadlineAt).getTime() - Date.now()
    daysRemaining = Math.max(0, Math.ceil(diff / 86_400_000))
  }

  // Tamamlanma yüzdesi: completedJuzInHatim / totalJuz
  const completedJuz = Number(
    raw.completedJuzInHatim ?? raw.completedJuzCount ?? raw.completedJuz ?? 0
  )
  const totalJuz = Number(raw.totalJuz ?? 30)
  const hatimProgress = Number(
    raw.hatimProgressPercentage ?? raw.progress ?? Math.round((completedJuz / totalJuz) * 100)
  )

  return {
    id:               allocationId,
    hatimId:          String(raw.hatimId ?? ''),
    hatimTitle:       raw.hatimTitle ?? raw.title ?? '',
    organizerName:    raw.creatorName ?? raw.organizerName ?? raw.organizer ?? '',
    typeBadge:        typeData.badge,
    typeBadgeVariant: typeData.variant,
    assignedJuz:      Number(raw.juzNumber ?? raw.assignedJuzNumber ?? raw.assignedJuz ?? 0),
    surahName:        raw.surahName ?? raw.surahTitle,
    hatimProgress,
    completedJuz,
    totalJuz,
    daysRemaining,
    // Assigned = okunmayı bekliyor → approve aksiyonu
    action: mapStatus(raw.status ?? raw.juzStatus ?? 'Pending'),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Servis
// ─────────────────────────────────────────────────────────────────────────────

export const profileService = {
  /**
   * GET /api/Users/{userId}/profile
   * Kullanıcının profil bilgileri ve istatistikleri.
   * Backend: UsersController.GetProfile → GetMyProfileQuery
   */
  async getMyProfile(userId: string): Promise<UserProfile> {
    const res = await apiClient.get<BackendProfile>(`/Users/${userId}/profile`)
    return normalizeProfile(res.data)
  },

  /**
   * GET /api/Users/{userId}/allocations
   * Kullanıcının aktif cüz taahhütleri (status = Assigned).
   * Backend: UsersController.GetAllocations → GetMyAllocationsQuery
   */
  async getMyHatimEntries(userId: string): Promise<UserHatimEntry[]> {
    const res = await apiClient.get<BackendHatimEntry[]>(`/Users/${userId}/allocations`)
    const items = Array.isArray(res.data)
      ? res.data
      : (res.data as { items?: BackendHatimEntry[] }).items ?? []
    return items.map(normalizeEntry)
  },

  /**
   * POST /api/JuzAllocations/{allocationId}/complete
   * Cüzü tamamlandı olarak işaretler.
   * Backend: JuzAllocationsController.CompleteJuz → CompleteJuzCommand
   *
   * @param allocationId  JuzAllocation.Id (UserHatimEntry.id)
   * @param userId        İsteği yapan kullanıcının Id'si (CompleteJuzRequest.RequesterUserId)
   */
  async approveJuz(allocationId: string, userId: string): Promise<void> {
    await apiClient.post(`/JuzAllocations/${allocationId}/complete`, {
      requesterUserId: userId,
      guestToken:      null,
    })
  },

  /**
   * JuzAllocation durum makinesi Available → Assigned → Completed şeklindedir.
   * "start" kavramına karşılık gelen ayrı bir endpoint yoktur.
   * Cüz Assigned durumuna düşer düşmez approve edilebilir hale gelir.
   * Bu metod geriye dönük uyumluluk için korunmuştur; UI'da "Başla" butonu
   * direkt approve aksiyonuna yönlendirilmelidir.
   */
  async startJuz(allocationId: string, userId: string): Promise<void> {
    // "start" = approve ile aynı endpoint; domain başka bir ara durum tanımlamıyor
    return this.approveJuz(allocationId, userId)
  },
}
