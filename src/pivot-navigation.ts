export type PivotNavigationKey = 'ArrowRight' | 'ArrowLeft' | 'Home' | 'End'
export type PivotNavigationDirection = 'forward' | 'backward'

export type PivotNavigationTarget = {
  index: number
  direction: PivotNavigationDirection
}

export function getPivotNavigationTarget(
  currentIndex: number,
  count: number,
  key: string,
): PivotNavigationTarget | null {
  if (!Number.isInteger(currentIndex) || count <= 0 || currentIndex < 0 || currentIndex >= count) return null

  if (key === 'ArrowRight') return { index: (currentIndex + 1) % count, direction: 'forward' }
  if (key === 'ArrowLeft') return { index: (currentIndex - 1 + count) % count, direction: 'backward' }
  if (key === 'Home') return { index: 0, direction: 'backward' }
  if (key === 'End') return { index: count - 1, direction: 'forward' }
  return null
}
