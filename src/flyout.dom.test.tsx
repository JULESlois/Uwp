// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { Flyout } from './anchored-surfaces'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function flushFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

function FlyoutHarness() {
  const [open, setOpen] = useState(false)
  return <Flyout
    open={open}
    onClose={() => setOpen(false)}
    anchor={<button onClick={() => setOpen(true)}>Open menu</button>}
    ariaLabel="Project actions"
    dismissLabel="Close project actions"
  >
    <button role="menuitem">Rename</button>
    <button role="menuitem">Delete</button>
  </Flyout>
}

describe('Flyout DOM focus behavior', () => {
  it('moves focus to the first menu action when opened and exposes a named menu', async () => {
    render(<FlyoutHarness />)
    const trigger = screen.getByRole('button', { name: 'Open menu' })
    trigger.focus()
    fireEvent.click(trigger)
    await flushFrame()

    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Rename' }))
    expect(screen.getByRole('menu', { name: 'Project actions' }).getAttribute('aria-hidden')).toBe('false')
  })

  it('closes on Escape and restores focus to the opener', async () => {
    render(<FlyoutHarness />)
    const trigger = screen.getByRole('button', { name: 'Open menu' })
    trigger.focus()
    fireEvent.click(trigger)
    await flushFrame()

    const menu = screen.getByRole('menu', { name: 'Project actions' })
    fireEvent.keyDown(menu, { key: 'Escape' })
    await flushFrame()

    expect(document.activeElement).toBe(trigger)
    expect(menu.getAttribute('aria-hidden')).toBe('true')
  })

  it('uses the caller-provided dismiss label and restores focus', async () => {
    render(<FlyoutHarness />)
    const trigger = screen.getByRole('button', { name: 'Open menu' })
    trigger.focus()
    fireEvent.click(trigger)
    await flushFrame()

    const menu = screen.getByRole('menu', { name: 'Project actions' })
    fireEvent.click(screen.getByRole('button', { name: 'Close project actions' }))
    await flushFrame()

    expect(document.activeElement).toBe(trigger)
    expect(menu.getAttribute('aria-label')).toBe('Project actions')
    expect(menu.getAttribute('aria-hidden')).toBe('true')
  })
})
