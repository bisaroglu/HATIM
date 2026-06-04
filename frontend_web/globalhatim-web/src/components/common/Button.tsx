import { forwardRef, type ButtonHTMLAttributes } from 'react'

// ─── Variant tanımları ────────────────────────────────────────────────────────
const variantStyles = {
  primary: [
    // Light: siyah zemin + beyaz metin (tasarıma birebir uygun)
    'bg-slate-900 text-white hover:bg-slate-700',
    // Dark: altın zemin + koyu metin
    'dark:bg-gold-dim dark:text-gold-text dark:hover:bg-gold',
    'active:scale-[0.98]',
  ].join(' '),

  secondary: [
    // Light: koyu kenarlık + koyu metin
    'border border-slate-300 text-slate-800 bg-transparent',
    'hover:border-slate-500 hover:text-slate-900',
    // Dark: altın kenarlık + altın metin
    'dark:border-gold/50 dark:text-gold dark:hover:border-gold',
  ].join(' '),

  ghost: [
    'bg-transparent text-slate-700 dark:text-dark-text-muted',
    'hover:bg-slate-100 dark:hover:bg-dark-surface',
  ].join(' '),

  danger: [
    'bg-red-600 text-white hover:bg-red-700',
    'dark:bg-error dark:text-dark-bg dark:hover:opacity-90',
  ].join(' '),
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-label-md',
  md: 'px-5 py-2.5 text-body-md',
  lg: 'px-7 py-3.5 text-body-lg',
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
  isLoading?: boolean
  fullWidth?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={[
          'inline-flex items-center justify-center gap-2',
          'rounded font-sans font-semibold tracking-wide',
          'transition-all duration-150',
          // a11y focus ring (WCAG 2.4.7)
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
          'focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          fullWidth ? 'w-full' : '',
          variantStyles[variant],
          sizeStyles[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner aria-hidden="true" />
            <span className="sr-only">Yükleniyor…</span>
            <span aria-hidden="true">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'

function LoadingSpinner({ 'aria-hidden': ariaHidden }: { 'aria-hidden'?: boolean | 'true' }) {
  return (
    <svg
      aria-hidden={ariaHidden}
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
