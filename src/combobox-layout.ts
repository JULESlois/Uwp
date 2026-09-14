export type ComboPopupPlacement = 'above' | 'below'

export type ComboPopupLayout = {
  placement: ComboPopupPlacement
  maxHeight: number
}

export type ComboPopupLayoutInput = {
  triggerTop: number
  triggerBottom: number
  viewportHeight: number
  popupScrollHeight: number
  viewportPadding?: number
  gap?: number
  maxPopupHeight?: number
  minimumPreferredHeight?: number
}

export function calculateComboPopupLayout({
  triggerTop,
  triggerBottom,
  viewportHeight,
  popupScrollHeight,
  viewportPadding = 8,
  gap = 4,
  maxPopupHeight = 300,
  minimumPreferredHeight = 152,
}: ComboPopupLayoutInput): ComboPopupLayout {
  const below = Math.max(0, viewportHeight - triggerBottom - viewportPadding - gap)
  const above = Math.max(0, triggerTop - viewportPadding - gap)
  const preferredHeight = Math.min(maxPopupHeight, Math.max(minimumPreferredHeight, popupScrollHeight))
  const placement: ComboPopupPlacement = below < preferredHeight && above > below ? 'above' : 'below'
  const available = placement === 'above' ? above : below

  return {
    placement,
    maxHeight: Math.min(maxPopupHeight, available),
  }
}
