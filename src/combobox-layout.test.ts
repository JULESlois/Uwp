import { describe, expect, it } from 'vitest'
import { calculateComboPopupLayout } from './combobox-layout'

describe('ComboBox popup layout', () => {
  it('keeps the popup below when there is enough room', () => {
    expect(calculateComboPopupLayout({ triggerTop: 120, triggerBottom: 152, viewportHeight: 600, popupScrollHeight: 220 }))
      .toEqual({ placement: 'below', maxHeight: 300 })
  })

  it('moves above when below cannot fit the preferred height and above has more room', () => {
    expect(calculateComboPopupLayout({ triggerTop: 420, triggerBottom: 452, viewportHeight: 520, popupScrollHeight: 240 }))
      .toEqual({ placement: 'above', maxHeight: 300 })
  })

  it('never invents a minimum height when the viewport has no room', () => {
    expect(calculateComboPopupLayout({ triggerTop: 4, triggerBottom: 40, viewportHeight: 52, popupScrollHeight: 180 }))
      .toEqual({ placement: 'below', maxHeight: 0 })
  })

  it('uses the larger side even when neither side fits the preferred height', () => {
    expect(calculateComboPopupLayout({ triggerTop: 96, triggerBottom: 128, viewportHeight: 220, popupScrollHeight: 260 }))
      .toEqual({ placement: 'above', maxHeight: 84 })
  })

  it('caps available room at the UWP popup maximum', () => {
    expect(calculateComboPopupLayout({ triggerTop: 100, triggerBottom: 132, viewportHeight: 900, popupScrollHeight: 800 }))
      .toEqual({ placement: 'below', maxHeight: 300 })
  })

  it('prefers below when both sides offer the same constrained space', () => {
    expect(calculateComboPopupLayout({ triggerTop: 112, triggerBottom: 144, viewportHeight: 256, popupScrollHeight: 220 }))
      .toEqual({ placement: 'below', maxHeight: 100 })
  })
})
