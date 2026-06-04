import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

// DOM'a class uygula — Tailwind darkMode: 'class' stratejisi
const applyThemeToDom = (theme: Theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set, get) => ({
        // Sistem tercihine göre başlat
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',

        setTheme: (theme) => {
          applyThemeToDom(theme)
          set({ theme })
        },

        toggleTheme: () => {
          const next = get().theme === 'dark' ? 'light' : 'dark'
          applyThemeToDom(next)
          set({ theme: next })
        },
      }),
      {
        name: 'gh-theme',
        // Persist sonrası DOM'u güncelle
        onRehydrateStorage: () => (state) => {
          if (state) applyThemeToDom(state.theme)
        },
      },
    ),
    { name: 'ThemeStore' },
  ),
)

export const useTheme = () => useThemeStore((s) => s.theme)
export const useToggleTheme = () => useThemeStore((s) => s.toggleTheme)
