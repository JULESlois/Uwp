import { describe, expect, it } from 'vitest'
import { getPivotNavigationTarget } from './pivot-navigation'

describe('getPivotNavigationTarget', () => {
  it('moves right and wraps from the last tab to the first', () => {
    expect(getPivotNavigationTarget(1, 3, 'ArrowRight')).toEqual({ index: 2, direction: 'forward' })
    expect(getPivotNavigationTarget(2, 3, 'ArrowRight')).toEqual({ index: 0, direction: 'forward' })
  })

  it('moves left and wraps from the first tab to the last', () => {
    expect(getPivotNavigationTarget(1, 3, 'ArrowLeft')).toEqual({ index: 0, direction: 'backward' })
    expect(getPivotNavigationTarget(0, 3, 'ArrowLeft')).toEqual({ index: 2, direction: 'backward' })
  })

  it('maps Home and End to the tablist boundaries', () => {
    expect(getPivotNavigationTarget(1, 4, 'Home')).toEqual({ index: 0, direction: 'backward' })
    expect(getPivotNavigationTarget(1, 4, 'End')).toEqual({ index: 3, direction: 'forward' })
  })

  it('keeps single-tab navigation stable', () => {
    expect(getPivotNavigationTarget(0, 1, 'ArrowRight')).toEqual({ index: 0, direction: 'forward' })
    expect(getPivotNavigationTarget(0, 1, 'ArrowLeft')).toEqual({ index: 0, direction: 'backward' })
  })

  it('ignores unsupported keys and invalid tab states', () => {
    expect(getPivotNavigationTarget(0, 3, 'Enter')).toBeNull()
    expect(getPivotNavigationTarget(0, 0, 'ArrowRight')).toBeNull()
    expect(getPivotNavigationTarget(-1, 3, 'ArrowRight')).toBeNull()
    expect(getPivotNavigationTarget(3, 3, 'ArrowRight')).toBeNull()
  })
})
