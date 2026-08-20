'use client'
import { Component, Fragment, ReactNode } from 'react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  retryKey: number
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, retryKey: 0 }
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-border bg-white p-8 text-center">
          <div>
            <p className="font-medium text-charcoal mb-1">Something went wrong</p>
            <p className="text-sm text-text-muted mb-4">You can try again — if it keeps happening, refresh the page.</p>
            <Button
              size="sm"
              onClick={() => this.setState(s => ({ hasError: false, retryKey: s.retryKey + 1 }))}
            >
              Try again
            </Button>
          </div>
        </div>
      )
    }
    // Keyed fragment so "Try again" remounts the subtree (re-running effects
    // and data fetches) instead of re-rendering into the same crashed state.
    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>
  }
}
