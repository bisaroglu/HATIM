import { useState, useEffect, useCallback } from 'react'
import type { UserProfile, UserHatimEntry } from '@/types'
import { profileService } from '@/services/profile.service'
import { parseApiError } from '@/utils/apiError'
import { useAuthStore } from '@/store/auth.store'


// ─────────────────────────────────────────────────────────────────────────────
// Hook arayüzü
// ─────────────────────────────────────────────────────────────────────────────

interface UseProfileResult {
  profile: UserProfile | null
  hatimEntries: UserHatimEntry[]
  /** Sayfa ilk yüklenirken true — skeleton için */
  isInitialLoading: boolean
  /** Refetch veya aksiyon sırasında true */
  isLoading: boolean
  error: string | null
  refetch: () => void
  approveJuz: (entryId: string) => Promise<void>
  startJuz: (entryId: string) => Promise<void>
  dismissError: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useProfile(): UseProfileResult {
  const storeUser = useAuthStore((s) => s.user)

  const [profile, setProfile]               = useState<UserProfile | null>(null)
  const [hatimEntries, setEntries]           = useState<UserHatimEntry[]>([])
  const [isInitialLoading, setInitial]      = useState(true)
  const [isLoading, setIsLoading]           = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [tick, setTick]                     = useState(0)

  const refetch   = useCallback(() => setTick((t) => t + 1), [])
  const dismissError = useCallback(() => setError(null), [])

  // ── Veri yükleme ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Kullanıcı kimliği olmadan istek atmaya gerek yok
    if (!storeUser?.id) return

    let cancelled = false
    setError(null)

    Promise.all([
      profileService.getMyProfile(storeUser.id),
      profileService.getMyHatimEntries(storeUser.id),
    ])
      .then(([prof, entries]) => {
        if (cancelled) return
        setProfile(prof)
        setEntries(entries)
      })
      .catch((err) => {
        if (cancelled) return
        const { message } = parseApiError(err)

        // API başarısız olduğunda:
        // - Auth store'daki minimal bilgiyle sayfa render edilebilsin
        // - Stats sıfır gösterilmek yerine HER ZAMAN hata banner'ı açılsın
        //   (sessiz sıfırlar kullanıcıyı yanıltır; banner gerçek nedeni açıklar)
        if (storeUser) {
          const nameParts = storeUser.displayName.split(' ')
          setProfile({
            id:          storeUser.id,
            firstName:   nameParts[0] ?? storeUser.displayName,
            lastName:    nameParts.slice(1).join(' '),
            email:       storeUser.email,
            avatarUrl:   storeUser.avatarUrl,
            memberType:  'Global Hatim Member',
            level:       'MUJAWWID',
            levelLabel:  'MÜCEVVID',
            joinedAt:    new Date().toISOString(),
            stats:       { readJuz: 0, completedHatims: 0, createdHatims: 0 },
          })
          setEntries([])
        }
        // Hata banner'ını her zaman göster — "0 çıkıyor" yanılgısını önler
        setError(message)
      })
      .finally(() => {
        if (!cancelled) {
          setInitial(false)
        }
      })

    return () => { cancelled = true }
  }, [storeUser, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cüz Onayla — optimistic update ───────────────────────────────────────
  const approveJuz = useCallback(async (entryId: string) => {
    const entry = hatimEntries.find((e) => e.id === entryId)
    if (!entry) return

    // 1. Optimistic: aksiyon 'view'e çek, stat +1, progress artır
    const progressDelta = Math.round((1 / entry.totalJuz) * 100)

    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, action: 'view' as const, hatimProgress: Math.min(100, e.hatimProgress + progressDelta) }
          : e,
      ),
    )
    setProfile((prev) =>
      prev ? { ...prev, stats: { ...prev.stats, readJuz: prev.stats.readJuz + 1 } } : prev,
    )

    setIsLoading(true)
    try {
      // entry.id = allocationId; storeUser.id = requesterUserId
      await profileService.approveJuz(entry.id, storeUser!.id)
      // Başarılı: backend'den güncel veriyi al
      const [freshProfile, freshEntries] = await Promise.all([
        profileService.getMyProfile(storeUser!.id),
        profileService.getMyHatimEntries(storeUser!.id),
      ])
      setProfile(freshProfile)
      setEntries(freshEntries)
    } catch (err) {
      // Geri al
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, action: 'approve' as const, hatimProgress: entry.hatimProgress }
            : e,
        ),
      )
      setProfile((prev) =>
        prev ? { ...prev, stats: { ...prev.stats, readJuz: prev.stats.readJuz - 1 } } : prev,
      )
      const { message } = parseApiError(err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [hatimEntries])

  // ── Okumaya Başla — optimistic update ────────────────────────────────────
  const startJuz = useCallback(async (entryId: string) => {
    const entry = hatimEntries.find((e) => e.id === entryId)
    if (!entry) return

    // 1. Optimistic: aksiyon 'approve'a yükselt
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, action: 'approve' as const } : e,
      ),
    )

    setIsLoading(true)
    try {
      await profileService.startJuz(entry.id, storeUser!.id)
    } catch (err) {
      // Geri al
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, action: 'start' as const } : e,
        ),
      )
      const { message } = parseApiError(err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [hatimEntries])

  return {
    profile,
    hatimEntries,
    isInitialLoading,
    isLoading,
    error,
    refetch,
    approveJuz,
    startJuz,
    dismissError,
  }
}
