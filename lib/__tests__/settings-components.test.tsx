import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { Toast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'

describe('Toast', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('renders the message', () => {
    render(<Toast message="Changes saved" type="success" onDismiss={() => {}} />)
    expect(screen.getByText('Changes saved')).toBeTruthy()
  })

  it('calls onDismiss after 4 seconds', () => {
    const onDismiss = vi.fn()
    render(<Toast message="ok" type="success" onDismiss={onDismiss} />)
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(4000) })
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('renders success dot for success type', () => {
    const { container } = render(<Toast message="ok" type="success" onDismiss={() => {}} />)
    const dot = container.querySelector('.bg-green')
    expect(dot).toBeTruthy()
  })

  it('renders error dot for error type', () => {
    const { container } = render(<Toast message="fail" type="error" onDismiss={() => {}} />)
    const dot = container.querySelector('.bg-red-dark')
    expect(dot).toBeTruthy()
  })
})

describe('Modal', () => {
  it('renders title and children', () => {
    render(
      <Modal title="Confirm delete" onClose={() => {}} footer={<button>OK</button>}>
        <p>Are you sure?</p>
      </Modal>
    )
    expect(screen.getByText('Confirm delete')).toBeTruthy()
    expect(screen.getByText('Are you sure?')).toBeTruthy()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal title="Test" onClose={onClose} footer={null}>
        <p>body</p>
      </Modal>
    )
    const backdrop = container.querySelector('.bg-black\\/30') as HTMLElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders footer content', () => {
    render(
      <Modal title="Test" onClose={() => {}} footer={<button>Confirm</button>}>
        <p>body</p>
      </Modal>
    )
    expect(screen.getByText('Confirm')).toBeTruthy()
  })
})
