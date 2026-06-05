'use client'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-border bg-white p-8 text-center">
          <div>
            <p className="font-medium text-charcoal mb-1">Something went wrong</p>
            <p className="text-sm text-text-muted mb-4">Refresh the page to try again.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="rounded-lg bg-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-dark transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
