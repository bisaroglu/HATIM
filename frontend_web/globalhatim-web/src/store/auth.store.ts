import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { tokenStorage } from '@/services/api'
import { authService } from '@/services/auth.service'
import type { User, LoginRequest, RegisterRequest } from '@/types'

// ─── State shape ─────────────────────────────────────────────────────────────
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  fetchCurrentUser: () => Promise<void>
  clearError: () => void
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: !!tokenStorage.getAccess(),
        isLoading: false,
        error: null,

        // ── Giriş ──────────────────────────────────────────────────────────
        login: async (data) => {
          set({ isLoading: true, error: null })
          try {
            const res = await authService.login(data)
            set({ user: res.user, isAuthenticated: true, isLoading: false })
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Giriş başarısız.'
            set({ error: msg, isLoading: false })
            throw err
          }
        },

        // ── Kayıt ──────────────────────────────────────────────────────────
        register: async (data) => {
          set({ isLoading: true, error: null })
          try {
            const res = await authService.register(data)
            set({ user: res.user, isAuthenticated: true, isLoading: false })
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Kayıt başarısız.'
            set({ error: msg, isLoading: false })
            throw err
          }
        },

        // ── Çıkış ──────────────────────────────────────────────────────────
        logout: async () => {
          set({ isLoading: true })
          try {
            await authService.logout()
          } finally {
            set({ user: null, isAuthenticated: false, isLoading: false, error: null })
          }
        },

        // ── Mevcut kullanıcıyı getir (sayfa yenileme sonrası) ───────────────
        fetchCurrentUser: async () => {
          if (!tokenStorage.getAccess()) return
          set({ isLoading: true })
          try {
            const user = await authService.getMe()
            set({ user, isAuthenticated: true, isLoading: false })
          } catch {
            set({ user: null, isAuthenticated: false, isLoading: false })
            tokenStorage.clearTokens()
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'gh-auth',
        // Sadece kullanıcı profilini persist et; token zaten localStorage'da
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      },
    ),
    { name: 'AuthStore' },
  ),
)

// ─── Selector kısayolları ────────────────────────────────────────────────────
export const useCurrentUser = () => useAuthStore((s) => s.user)
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated)
export const useAuthLoading = () => useAuthStore((s) => s.isLoading)
