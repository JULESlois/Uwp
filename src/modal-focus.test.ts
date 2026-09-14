import { describe, expect, it } from 'vitest'
import { modalTabTarget } from './modal-focus'

describe('modalTabTarget', () => {
  it('recaptures focus that escaped the modal', () => {
    expect(modalTabTarget(3, -1, false)).toBe('first')
    expect(modalTabTarget(3, -1, true)).toBe('last')
  })

  it('wraps at the modal boundaries', () => {
    expect(modalTabTarget(3, 2, false)).toBe('first')
    expect(modalTabTarget(3, 0, true)).toBe('last')
  })

  it('preserves native tab order for interior controls', () => {
    expect(modalTabTarget(3, 1, false)).toBeNull()
    expect(modalTabTarget(3, 1, true)).toBeNull()
  })

  it('does nothing when no focusable control exists', () => {
    expect(modalTabTarget(0, -1, false)).toBeNull()
    expect(modalTabTarget(0, -1, true)).toBeNull()
  })
})
