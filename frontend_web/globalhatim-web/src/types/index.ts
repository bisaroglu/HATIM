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
