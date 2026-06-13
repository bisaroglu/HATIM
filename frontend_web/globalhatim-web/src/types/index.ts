// ─── Kullanıcı ───────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  role: 'user' | 'admin'
  createdAt: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

// ─── Hatim ───────────────────────────────────────────────────────────────────
export interface Hatim {
  id: string
  title: string
  description?: string
  surahStart: number
  surahEnd: number
  participantCount: number
  completedCount: number
  createdBy: User
  createdAt: string
  deadline?: string
  isPublic: boolean
  status: 'active' | 'completed' | 'cancelled'
}

// ─── Profil ──────────────────────────────────────────────────────────────────

/** Kuran tilaveti seviyeleri (artan ustalik sirasiyla) */
export type RecitationLevel =
  | 'MUBTEDI'
  | 'MUTAWASSIT'
  | 'MUTAQADDIM'
  | 'MUJAWWID'

export interface UserStats {
  readJuz: number
  completedHatims: number
  createdHatims: number
}

export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
  memberType: string
  level: RecitationLevel
  levelLabel: string
  stats: UserStats
  joinedAt: string
}

export interface UserHatimEntry {
  id: string
  hatimId: string
  hatimTitle: string
  organizerName: string
  typeBadge: string
  typeBadgeVariant: 'amber' | 'sky' | 'emerald' | 'slate'
  assignedJuz: number
  surahName?: string
  hatimProgress: number
  completedJuz: number
  totalJuz: number
  daysRemaining?: number
  action: 'approve' | 'start' | 'view'
}

// ─── Hatim Detay ─────────────────────────────────────────────────────────────

export type JuzSlotStatus = 'Available' | 'Assigned' | 'Completed'

export interface JuzSlot {
  allocationId: string
  juzNumber: number
  status: JuzSlotStatus
  assigneeName: string
  isAssignedToGuest: boolean
  assignedAt?: string
  deadlineAt?: string
  completedAt?: string
}

export interface HatimDetails {
  id: string
  title: string
  description?: string
  planType: string
  status: string
  isPublic: boolean
  startDate: string
  endDate?: string
  currentCycle: number
  totalCycles: number
  totalParticipants: number
  creatorId: string
  creatorName: string
  categoryName?: string
  juzSlots: JuzSlot[]
}

// ─── API ─────────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string
  statusCode: number
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}
