import apiClient, { tokenStorage } from './api'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Backend DTO tipleri — .NET yanıtının ham şekli
// (Frontend'in AuthResponse tipiyle birebir uyuşmayabilir)
// ─────────────────────────────────────────────────────────────────────────────

interface BackendUser {
  id?: string
  email?: string
  /** .NET backend displayName veya fullName döndürebilir */
  displayName?: string
  fullName?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  role?: string
  createdAt?: string
}

interface BackendAuthResponse {
  /** JWT — backend farklı alan adı kullanabilir */
  accessToken?: string
  token?: string
  access_token?: string
  /** Refresh token */
  refreshToken?: string
  refresh_token?: string
  /** Kullanıcı nesnesi (sarmalanmış format) */
  user?: BackendUser
  userData?: BackendUser
  /**
   * Düz (flat) AuthResult formatı — .NET backend'in döndürdüğü:
   * { userId, email, fullName, token }
   * user/userData nesnesi olmadığında bu alanlar üst seviyede gelir.
   */
  userId?: string
  email?: string
  fullName?: string
  displayName?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Yanıt normalizasyonu — backend isminden bağımsız, tutarlı iç format
// ─────────────────────────────────────────────────────────────────────────────

function normalizeUser(raw: BackendUser | undefined): User {
  if (!raw) {
    return { id: '', email: '', displayName: '', role: 'user', createdAt: '' }
  }
  const displayName =
    raw.displayName ??
    raw.fullName ??
    [raw.firstName, raw.lastName].filter(Boolean).join(' ') ??
    ''

  return {
    // id asla boş string olmamalı — boşsa '' değil; caller null kontrolü yapar
    id:          raw.id ?? '',
    email:       raw.email ?? '',
    displayName,
    avatarUrl:   raw.avatarUrl,
    role:        (raw.role as 'user' | 'admin') ?? 'user',
    createdAt:   raw.createdAt ?? new Date().toISOString(),
  }
}

function normalizeAuthResponse(raw: BackendAuthResponse): AuthResponse {
  const accessToken  = raw.accessToken ?? raw.token ?? raw.access_token ?? ''
  const refreshToken = raw.refreshToken ?? raw.refresh_token ?? ''

  // Backend iki farklı format döndürebilir:
  //   A) Sarmalanmış:  { user: { id, email, ... }, accessToken }
  //   B) Düz (AuthResult): { userId, email, fullName, token }  ← .NET backend şu an bunu döndürüyor
  const nestedUser = raw.user ?? raw.userData
  const user = nestedUser
    ? normalizeUser(nestedUser)
    : normalizeUser({
        id:          raw.userId,
        email:       raw.email,
        displayName: raw.fullName ?? raw.displayName,
        // fullName → firstName/lastName ayrıştırması normalizeUser içinde yapılıyor
      })

  return { accessToken, refreshToken, user }
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth servisi
// ─────────────────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * POST /api/Auth/login
   * Body: { email, password }
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await apiClient.post<BackendAuthResponse>('/Auth/login', data)
    const normalized = normalizeAuthResponse(res.data)
    tokenStorage.setTokens(normalized.accessToken, normalized.refreshToken)
    return normalized
  },

  /**
   * POST /api/Auth/register
   * Body: { firstName, lastName, email, password }
   *
   * .NET DTO'su RegisterUserDto veya CreateUserRequest olabilir —
   * camelCase olarak gönderilir, ASP.NET Core otomatik deserialize eder.
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await apiClient.post<BackendAuthResponse>('/Auth/register', data)
    const normalized = normalizeAuthResponse(res.data)
    tokenStorage.setTokens(normalized.accessToken, normalized.refreshToken)
    return normalized
  },

  /**
   * POST /api/Auth/logout
   * Backend refresh token'ı invalidate eder.
   * TODO: backend'in gerçek endpoint yolunu doğrula
   */
  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefresh()
    try {
      // Refresh token'ı revoke etmek için gönder (backend destekliyorsa)
      await apiClient.post('/Auth/logout', { refreshToken })
    } catch {
      // Backend logout endpoint'i yoksa veya hata alırsak sessizce devam et
      // Token zaten localStorage'dan silineceği için client tarafı güvenli
    } finally {
      tokenStorage.clearTokens()
    }
  },

  /**
   * GET /api/Auth/me  veya  GET /api/User/me
   * Mevcut oturum açık kullanıcının profilini getirir.
   * TODO: backend endpoint yolunu doğrula
   */
  async getMe(): Promise<User> {
    const res = await apiClient.get<BackendUser>('/Auth/me')
    return normalizeUser(res.data)
  },

  /**
   * POST /api/Auth/refresh
   * Access token yenileme — api.ts interceptor'ı otomatik çağırır.
   * Burada direct kullanım gerekmez.
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await apiClient.post<BackendAuthResponse>('/Auth/refresh', { refreshToken })
    const access = res.data.accessToken ?? res.data.token ?? res.data.access_token ?? ''
    const refresh = res.data.refreshToken ?? res.data.refresh_token ?? ''
    return { accessToken: access, refreshToken: refresh }
  },
}
