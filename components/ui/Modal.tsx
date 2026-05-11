'use client'
import { ReactNode } from 'react'

interface ModalProps {
  title: string
  children: ReactNode
  footer: ReactNode
  onClose: () => void
}

export function Modal({ title, children, footer, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-charcoal">{title}</h2>
        <div className="mb-6">{children}</div>
        <div className="flex justify-end gap-3">{footer}</div>
      </div>
    </div>
  )
}
