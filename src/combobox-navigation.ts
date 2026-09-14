export function getComboInitialActiveIndex(selectedIndex: number, enabledIndices: readonly number[]) {
  if (selectedIndex >= 0 && enabledIndices.includes(selectedIndex)) return selectedIndex
  return enabledIndices[0] ?? -1
}

export function getNextComboActiveIndex(
  enabledIndices: readonly number[],
  activeIndex: number,
  delta: number,
) {
  if (!enabledIndices.length || delta === 0) {
    return activeIndex >= 0 && enabledIndices.includes(activeIndex) ? activeIndex : -1
  }

  const currentPosition = enabledIndices.indexOf(activeIndex)
  if (currentPosition < 0) return delta > 0 ? enabledIndices[0]! : enabledIndices[enabledIndices.length - 1]!

  const direction = delta > 0 ? 1 : -1
  const nextPosition = (currentPosition + direction + enabledIndices.length) % enabledIndices.length
  return enabledIndices[nextPosition]!
}
