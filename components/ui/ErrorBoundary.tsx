'use client'
import { Component, ReactNode } from 'react'
import { Button } from './Button'

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
            <Button size="sm" onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
