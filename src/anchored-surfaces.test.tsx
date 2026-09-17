import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TeachingTip } from './anchored-surfaces'

describe('TeachingTip', () => {
  it('exposes a labelled non-modal dialog while open', () => {
    render(<TeachingTip open title="Keyboard shortcuts" anchor={<button>Help</button>} onClose={() => undefined}>Use Ctrl+K to search.</TeachingTip>)

    const dialog = screen.getByRole('dialog', { name: 'Keyboard shortcuts' })
    expect(dialog.getAttribute('aria-modal')).toBe('false')
    expect(dialog.getAttribute('aria-hidden')).toBe('false')
  })

  it('supports a consumer-provided close label', () => {
    const onClose = vi.fn()
    render(<TeachingTip open title="Selection" anchor={<button>Help</button>} onClose={onClose} closeLabel="Dismiss selection tip">Use Shift to extend a selection.</TeachingTip>)

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss selection tip' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
