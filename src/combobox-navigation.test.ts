import { describe, expect, it } from 'vitest'
import { getComboInitialActiveIndex, getNextComboActiveIndex } from './combobox-navigation'

describe('ComboBox active navigation', () => {
  it('keeps an enabled selected option active', () => {
    expect(getComboInitialActiveIndex(2, [0, 2, 4])).toBe(2)
  })

  it('falls back to the first enabled option for disabled or missing selections', () => {
    expect(getComboInitialActiveIndex(1, [0, 2, 4])).toBe(0)
    expect(getComboInitialActiveIndex(-1, [2, 4])).toBe(2)
  })

  it('uses -1 when no options are enabled', () => {
    expect(getComboInitialActiveIndex(0, [])).toBe(-1)
    expect(getNextComboActiveIndex([], 0, 1)).toBe(-1)
  })

  it('enters the enabled set from the correct edge when active state is invalid', () => {
    expect(getNextComboActiveIndex([1, 3, 5], -1, 1)).toBe(1)
    expect(getNextComboActiveIndex([1, 3, 5], -1, -1)).toBe(5)
  })

  it('wraps without landing in disabled gaps', () => {
    expect(getNextComboActiveIndex([0, 2, 4], 4, 1)).toBe(0)
    expect(getNextComboActiveIndex([0, 2, 4], 0, -1)).toBe(4)
    expect(getNextComboActiveIndex([0, 2, 4], 0, 1)).toBe(2)
  })
})
