// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Calendar } from './calendar'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function flushFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

describe('Calendar DOM keyboard behavior', () => {
  it('uses roving focus and commits the keyboard-focused date', async () => {
    const onValueChange = vi.fn()
    render(<Calendar defaultValue={new Date(2026, 8, 15)} locale="en-US" firstDayOfWeek={0} onValueChange={onValueChange} />)

    const selected = screen.getByRole('button', { name: 'September 15, 2026' })
    expect(selected.tabIndex).toBe(0)
    selected.focus()

    fireEvent.keyDown(selected, { key: 'ArrowRight' })
    await flushFrame()

    const next = screen.getByRole('button', { name: 'September 16, 2026' })
    expect(document.activeElement).toBe(next)
    expect(next.tabIndex).toBe(0)
    expect(selected.tabIndex).toBe(-1)

    fireEvent.keyDown(next, { key: 'Enter' })
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange.mock.calls[0][0]).toEqual(new Date(2026, 8, 16))
  })

  it('moves across month boundaries with PageDown while preserving the day', async () => {
    render(<Calendar defaultValue={new Date(2026, 0, 31)} locale="en-US" firstDayOfWeek={0} />)

    const january31 = screen.getByRole('button', { name: 'January 31, 2026' })
    january31.focus()
    fireEvent.keyDown(january31, { key: 'PageDown' })
    await flushFrame()

    const february28 = screen.getByRole('button', { name: 'February 28, 2026' })
    expect(document.activeElement).toBe(february28)
    expect(february28.tabIndex).toBe(0)
    expect(screen.getByText('February 2026')).toBeTruthy()
  })

  it('keeps keyboard focus inside the allowed date range', async () => {
    render(<Calendar
      defaultValue={new Date(2026, 8, 15)}
      min={new Date(2026, 8, 14)}
      max={new Date(2026, 8, 16)}
      locale="en-US"
      firstDayOfWeek={0}
    />)

    const september15 = screen.getByRole('button', { name: 'September 15, 2026' })
    september15.focus()
    fireEvent.keyDown(september15, { key: 'ArrowRight' })
    await flushFrame()

    const september16 = screen.getByRole('button', { name: 'September 16, 2026' })
    expect(document.activeElement).toBe(september16)
    fireEvent.keyDown(september16, { key: 'ArrowRight' })
    await flushFrame()

    expect(document.activeElement).toBe(september16)
    expect(screen.getByRole('button', { name: 'September 17, 2026' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: 'Next month' }).hasAttribute('disabled')).toBe(true)
  })
})
