import { cn } from '@/lib/utils'

const STEPS = ['Restaurant', 'Connect', 'Voice', 'Plan']

interface StepIndicatorProps {
  currentStep: number // 1-indexed
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const stepNum = i + 1
        const done = stepNum < currentStep
        const active = stepNum === currentStep
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  done && 'bg-orange text-white',
                  active && 'bg-orange text-white ring-4 ring-orange-light',
                  !done && !active && 'bg-border text-text-lighter',
                )}
              >
                {done ? (
                  <>
                    <span aria-hidden="true">✓</span>
                    <span className="sr-only">Completed</span>
                  </>
                ) : stepNum}
              </div>
              <span className={cn('text-xs', active ? 'text-orange-dark font-medium' : 'text-text-lighter')}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-2 h-px w-12 mb-5', done ? 'bg-orange' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
