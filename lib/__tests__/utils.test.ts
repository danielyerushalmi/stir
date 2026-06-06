import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('returns a single class name unchanged', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('merges multiple class names into one string', () => {
    const result = cn('px-4', 'py-2', 'rounded')
    expect(result).toContain('px-4')
    expect(result).toContain('py-2')
    expect(result).toContain('rounded')
  })

  it('deduplicates conflicting Tailwind classes (last one wins)', () => {
    // tailwind-merge should resolve text-red-500 vs text-blue-500
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toContain('text-blue-500')
    expect(result).not.toContain('text-red-500')
  })

  it('deduplicates conflicting padding utilities', () => {
    const result = cn('px-2', 'px-4')
    expect(result).toContain('px-4')
    expect(result).not.toContain('px-2')
  })

  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('returns an empty string when all arguments are falsy', () => {
    expect(cn(false, null, undefined, '')).toBe('')
  })

  it('includes conditional classes when the condition is truthy', () => {
    const isActive = true
    const result = cn('base', isActive && 'active')
    expect(result).toContain('active')
  })

  it('excludes conditional classes when the condition is falsy', () => {
    const isActive = false
    const result = cn('base', isActive && 'active')
    expect(result).not.toContain('active')
    expect(result).toContain('base')
  })

  it('handles object syntax for conditional classes', () => {
    const result = cn({ 'font-bold': true, 'font-thin': false })
    expect(result).toContain('font-bold')
    expect(result).not.toContain('font-thin')
  })

  it('handles array syntax', () => {
    const result = cn(['text-sm', 'leading-5'])
    expect(result).toContain('text-sm')
    expect(result).toContain('leading-5')
  })

  it('merges base and variant classes without duplication', () => {
    const result = cn('p-4', 'p-2')
    // tailwind-merge: last p wins
    expect(result).toBe('p-2')
  })
})
