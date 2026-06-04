import { forwardRef, type InputHTMLAttributes, useId } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  hideLabel?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, hideLabel = false, className = '', id: externalId, ...props }, ref) => {
    const generatedId = useId()
    const id = externalId ?? generatedId
    const errorId = `${id}-error`
    const hintId = `${id}-hint`
    const describedBy = [error ? errorId : '', hint ? hintId : ''].filter(Boolean).join(' ')

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label */}
        <label
          htmlFor={id}
          className={[
            'font-sans text-label-md uppercase tracking-widest',
            // Light: koyu slate; Dark: altın tonu
            'text-slate-600 dark:text-gold/80',
            hideLabel ? 'sr-only' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {label}
        </label>

        {/* Input — sadece alt kenarlık, focus'ta altın */}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          className={[
            'w-full bg-transparent',
            'border-b pb-2 transition-colors duration-150',
            // Kenarlık: light koyu gri; dark: daha soluk
            'border-slate-300 dark:border-dark-outline',
            // Metin: light near-black; dark: kırık beyaz
            'font-sans text-body-md text-slate-900 dark:text-dark-text',
            // Placeholder
            'placeholder:text-slate-400 dark:placeholder:text-dark-text-muted/40',
            // Focus
            'focus:outline-none focus:border-slate-900 dark:focus:border-gold',
            // Error
            error ? 'border-red-500 dark:border-error' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="font-sans text-xs text-slate-500 dark:text-dark-text-muted/60">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="font-sans text-xs text-red-600 dark:text-error">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
