import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'orange' | 'green' | 'gray' | 'red' | 'amber'
}

export function Badge({ variant = 'orange', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-orange-light text-orange-dark': variant === 'orange',
          'bg-green-light text-green-dark': variant === 'green',
          'bg-border text-text-muted': variant === 'gray',
          'bg-red-light text-red-dark': variant === 'red',
          'bg-amber-light text-amber-dark': variant === 'amber',
        },
        className,
      )}
      {...props}
    />
  )
}
