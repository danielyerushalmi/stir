interface StirLogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon' | 'white'
  className?: string
}

const sizes = {
  sm: { icon: 24, text: 18 },
  md: { icon: 32, text: 22 },
  lg: { icon: 40, text: 28 },
}

export function StirLogo({ size = 'md', variant = 'full', className = '' }: StirLogoProps) {
  const { icon, text } = sizes[size]
  const color = variant === 'white' ? '#FFFFFF' : '#2C1810'
  const orangeColor = variant === 'white' ? '#FAF7F2' : '#E8630A'

  const SpoonIcon = (
    <svg
      width={icon}
      height={icon}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: 'rotate(-15deg)' }}
    >
      {/* Spoon bowl */}
      <ellipse cx="16" cy="9" rx="6" ry="7.5" fill={orangeColor} />
      {/* Smile curve inside bowl */}
      <path
        d="M12.5 10 Q16 13.5 19.5 10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Handle */}
      <path
        d="M16 16.5 Q15 22 14.5 28"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )

  if (variant === 'icon') return <div className={className}>{SpoonIcon}</div>

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {SpoonIcon}
      <span
        style={{
          fontSize: text,
          fontWeight: 600,
          color,
          letterSpacing: '-0.02em',
          fontFamily: "var(--font-figtree), sans-serif",
        }}
      >
        stir
      </span>
    </div>
  )
}
