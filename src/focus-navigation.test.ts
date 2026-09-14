import { describe, expect, it } from 'vitest'
import { nextRovingIndex } from './focus-navigation'

describe('nextRovingIndex', () => {
  it('wraps forward and backward navigation', () => {
    expect(nextRovingIndex(3, 2, 1)).toBe(0)
    expect(nextRovingIndex(3, 0, -1)).toBe(2)
  })

  it('enters the collection at the nearest boundary when current focus is outside', () => {
    expect(nextRovingIndex(3, -1, 1)).toBe(0)
    expect(nextRovingIndex(3, -1, -1)).toBe(2)
  })

  it('handles a single item without moving away', () => {
    expect(nextRovingIndex(1, 0, 1)).toBe(0)
    expect(nextRovingIndex(1, 0, -1)).toBe(0)
  })

  it('returns -1 for an empty collection', () => {
    expect(nextRovingIndex(0, -1, 1)).toBe(-1)
  })
})
