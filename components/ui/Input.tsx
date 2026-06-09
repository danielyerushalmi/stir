import { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const errorId = error ? `${id ?? props.name ?? 'input'}-error` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm font-medium text-charcoal">{label}</label>}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          'w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-text-lighter focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20',
          error && 'border-red-dark',
          className,
        )}
        {...props}
      />
      {error && <p id={errorId} className="text-xs text-red-dark">{error}</p>}
    </div>
  )
}
