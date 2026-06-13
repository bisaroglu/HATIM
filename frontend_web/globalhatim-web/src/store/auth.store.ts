import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { tokenStorage } from '@/services/api'
import { authService } from '@/services/auth.service'
import { parseApiError } from '@/utils/apiError'
import type { User, LoginRequest, RegisterRequest } from '@/types'

// ─── State shape ─────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean

  /** Genel hata mesajı — alert banner'da gösterilir */
  error: string | null

  /**
   * Alan bazlı sunucu doğrulama hataları.
   * key = form field adı (camelCase), value = gösterilecek mesaj
   * Örn: { email: "Bu e-posta zaten kayıtlı.", password: "..." }
   */
  fieldErrors: Record<string, string> | null

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
      (set) => ({
        user: null,
        isAuthenticated: !!tokenStorage.getAccess(),
        isLoading: false,
        error: null,
        fieldErrors: null,

        // ── Giriş ─────────────────────────────────────────────────────────
        login: async (data) => {
          set({ isLoading: true, error: null, fieldErrors: null })
          try {
            const res = await authService.login(data)
            set({
              user: res.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              fieldErrors: null,
            })
          } catch (err) {
            const { message, fieldErrors } = parseApiError(err)
            set({
              error: message,
              fieldErrors: fieldErrors ?? null,
              isLoading: false,
            })
            // Formun navigate etmemesi için hatayı yeniden fırlat
            throw err
          }
        },

        // ── Kayıt ─────────────────────────────────────────────────────────
        register: async (data) => {
          set({ isLoading: true, error: null, fieldErrors: null })
          try {
            const res = await authService.register(data)
            set({
              user: res.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              fieldErrors: null,
            })
          } catch (err) {
            const { message, fieldErrors } = parseApiError(err)
            set({
              error: message,
              fieldErrors: fieldErrors ?? null,
              isLoading: false,
            })
            throw err
          }
        },

        // ── Çıkış ─────────────────────────────────────────────────────────
        logout: async () => {
          set({ isLoading: true })
          try {
            await authService.logout()
          } finally {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              fieldErrors: null,
            })
          }
        },

        // ── Sayfa yenilemede mevcut kullanıcıyı getir ─────────────────────
        fetchCurrentUser: async () => {
          if (!tokenStorage.getAccess()) return
          set({ isLoading: true })
          try {
            const user = await authService.getMe()
            set({ user, isAuthenticated: true, isLoading: false })
          } catch {
            // Token geçersiz — sil, login'e yönlendir
            set({ user: null, isAuthenticated: false, isLoading: false })
            tokenStorage.clearTokens()
          }
        },

        // ── Hata temizle ──────────────────────────────────────────────────
        clearError: () => set({ error: null, fieldErrors: null }),
      }),
      {
        name: 'gh-auth',
        /**
         * Versiyon 2: AuthResult düz format desteği eklendi.
         * Önceki versiyonlarda user.id='' olarak kaydedilen bozuk state
         * migrate fonksiyonu ile temizlenir; kullanıcı tek sefer yeniden giriş yapar.
         */
        version: 2,
        migrate: () => ({ user: null, isAuthenticated: false }),

        // Token localStorage'da ayrıca tutulduğu için sadece user + auth flag persist et
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),

        onRehydrateStorage: () => (state) => {
          if (!state) return

          // Bozuk persisted data guard: user.id boşsa temizle
          if (state.user && !state.user.id) {
            state.user = null
            state.isAuthenticated = false
          }

          // isAuthenticated her zaman gerçek token varlığıyla senkronize olsun
          // (persist'ten gelen değer ile localStorage arasındaki uyuşmazlığı önler)
          state.isAuthenticated = !!tokenStorage.getAccess()
        },
      },
    ),
    { name: 'AuthStore' },
  ),
)

// ─── Selector kısayolları ─────────────────────────────────────────────────────
export const useCurrentUser     = () => useAuthStore((s) => s.user)
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated)
export const useAuthLoading     = () => useAuthStore((s) => s.isLoading)
export const useAuthFieldErrors = () => useAuthStore((s) => s.fieldErrors)
