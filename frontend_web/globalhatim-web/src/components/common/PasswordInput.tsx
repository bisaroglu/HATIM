import { forwardRef, useState, useId, type InputHTMLAttributes } from 'react'

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
  hint?: string
  /** Sağ üstte "Forgot?" bağlantısı göster */
  forgotLink?: React.ReactNode
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, hint, forgotLink, className = '', id: externalId, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const generatedId = useId()
    const id = externalId ?? generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`
    const describedBy = [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ')

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label satırı — sol: etiket, sağ: forgot */}
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="font-sans text-label-md uppercase tracking-widest text-slate-600 dark:text-gold/80"
          >
            {label}
          </label>
          {forgotLink && (
            <span className="font-sans text-label-md">{forgotLink}</span>
          )}
        </div>

        {/* Input wrapper */}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            aria-invalid={!!error}
            aria-describedby={describedBy || undefined}
            // Sağda göz ikonu için padding
            className={[
              'w-full bg-transparent pr-10',
              'border-b pb-2 transition-colors duration-150',
              'border-slate-300 dark:border-dark-outline',
              'font-sans text-body-md text-slate-900 dark:text-dark-text',
              'placeholder:text-slate-400 dark:placeholder:text-dark-text-muted/40',
              'focus:outline-none focus:border-slate-900 dark:focus:border-gold',
              error ? 'border-red-500 dark:border-error' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {/* Göster/gizle toggle butonu */}
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Şifreyi gizle' : 'Şifreyi göster'}
            aria-pressed={visible}
            className={[
              'absolute right-0 bottom-2 p-0.5',
              'text-slate-400 dark:text-dark-text-muted/60',
              'hover:text-slate-700 dark:hover:text-gold',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded',
            ].join(' ')}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {hint && !error && (
          <p id={hintId} className="font-sans text-xs text-dark-text/50 dark:text-dark-text-muted/60">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="font-sans text-xs text-error">
            {error}
          </p>
        )}
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'

// ─── İkonlar ─────────────────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
      />
    </svg>
  )
}
