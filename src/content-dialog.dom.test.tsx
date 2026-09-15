// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { ContentDialog } from './components'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function flushFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

function DialogHarness() {
  const [open, setOpen] = useState(false)
  return <>
    <button onClick={() => setOpen(true)}>Open dialog</button>
    <ContentDialog open={open} title="Confirm action" onClose={() => setOpen(false)} primaryButtonText="Save" secondaryButtonText="Cancel">
      <p>Review the change.</p>
    </ContentDialog>
  </>
}

describe('ContentDialog DOM focus behavior', () => {
  it('moves focus into the dialog when opened', async () => {
    render(<DialogHarness />)
    const trigger = screen.getByRole('button', { name: 'Open dialog' })
    trigger.focus()
    fireEvent.click(trigger)
    await flushFrame()

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('dialog', { name: 'Confirm action' }).getAttribute('aria-modal')).toBe('true')
  })

  it('wraps Tab focus inside the dialog', async () => {
    render(<DialogHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }))
    await flushFrame()

    const dialog = screen.getByRole('dialog', { name: 'Confirm action' })
    const save = screen.getByRole('button', { name: 'Save' })
    const cancel = screen.getByRole('button', { name: 'Cancel' })

    cancel.focus()
    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(document.activeElement).toBe(save)

    save.focus()
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(cancel)
  })

  it('closes on Escape and restores focus to the opener', async () => {
    render(<DialogHarness />)
    const trigger = screen.getByRole('button', { name: 'Open dialog' })
    trigger.focus()
    fireEvent.click(trigger)
    await flushFrame()

    const dialog = screen.getByRole('dialog', { name: 'Confirm action' })
    const layer = dialog.closest('.dialog-layer')
    expect(layer).not.toBeNull()

    fireEvent.keyDown(dialog, { key: 'Escape' })
    await flushFrame()

    expect(document.activeElement).toBe(trigger)
    expect(layer?.getAttribute('aria-hidden')).toBe('true')
    expect(dialog.hasAttribute('aria-modal')).toBe(false)
  })
})
