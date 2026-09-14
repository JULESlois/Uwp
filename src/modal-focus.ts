export type ModalTabTarget = 'first' | 'last' | null

export function modalTabTarget(focusableCount: number, activeIndex: number, shiftKey: boolean): ModalTabTarget {
  if (focusableCount <= 0) return null
  if (activeIndex < 0 || activeIndex >= focusableCount) return shiftKey ? 'last' : 'first'
  if (shiftKey && activeIndex === 0) return 'last'
  if (!shiftKey && activeIndex === focusableCount - 1) return 'first'
  return null
}
