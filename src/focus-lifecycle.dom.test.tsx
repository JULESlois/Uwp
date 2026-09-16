// @vitest-environment jsdom
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { trapModalFocus, useFocusReturn } from './focus-lifecycle'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function flushFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

function EmptyModal({ open }: { open: boolean }) {
  const surface = createRef<HTMLElement>()
  useFocusReturn(open, surface)
  return <section ref={surface} data-testid="surface" />
}

describe('modal focus lifecycle', () => {
  it('focuses the modal surface when there is no interactive initial target', async () => {
    const { getByTestId } = render(<EmptyModal open />)
    const surface = getByTestId('surface')

    await flushFrame()

    expect(document.activeElement).toBe(surface)
    expect(surface.tabIndex).toBe(-1)
  })

  it('keeps Tab inside a modal with no focusable descendants', () => {
    const surface = document.createElement('section')
    document.body.append(surface)
    const onEscape = vi.fn()
    const event = {
      key: 'Tab',
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as Parameters<typeof trapModalFocus>[0]

    trapModalFocus(event, surface, onEscape)

    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(surface)
    expect(surface.tabIndex).toBe(-1)
    expect(onEscape).not.toHaveBeenCalled()
    surface.remove()
  })

  it('still closes on Escape when the modal has no controls', () => {
    const surface = document.createElement('section')
    const onEscape = vi.fn()
    const event = {
      key: 'Escape',
      shiftKey: false,
      preventDefault: vi.fn(),
    } as unknown as Parameters<typeof trapModalFocus>[0]

    trapModalFocus(event, surface, onEscape)

    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(onEscape).toHaveBeenCalledOnce()
  })
})
