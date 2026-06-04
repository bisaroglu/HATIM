import { useTheme, useToggleTheme } from '@/store/theme.store'

export function ThemeToggle() {
  const theme = useTheme()
  const toggle = useToggleTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggle}
      // a11y: dinamik aria-label, klavye + screen reader uyumlu
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      aria-pressed={isDark}
      className={[
        'relative h-7 w-14 rounded-full transition-colors duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
        'focus-visible:ring-offset-light-bg dark:focus-visible:ring-offset-dark-bg',
        isDark
          ? 'bg-dark-surface-high border border-gold/30'
          : 'bg-light-surface border border-light-outline',
      ].join(' ')}
    >
      {/* Kaydıran top */}
      <span
        aria-hidden="true"
        className={[
          'absolute top-0.5 h-6 w-6 rounded-full transition-transform duration-300 flex items-center justify-center text-sm',
          isDark
            ? 'translate-x-7 bg-gold-dim text-gold-text'
            : 'translate-x-0.5 bg-white text-yellow-500 shadow-sm',
        ].join(' ')}
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  )
}
