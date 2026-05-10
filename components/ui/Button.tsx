import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-orange hover:bg-orange-dark text-white': variant === 'primary',
          'border border-border bg-white hover:bg-warm-gray text-charcoal': variant === 'secondary',
          'hover:bg-orange-light text-charcoal': variant === 'ghost',
        },
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-5 py-2.5 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className,
      )}
      {...props}
    />
  )
}
