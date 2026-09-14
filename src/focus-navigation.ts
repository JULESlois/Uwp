export function nextRovingIndex(length: number, currentIndex: number, delta: number) {
  if (length <= 0) return -1
  if (currentIndex < 0) return delta >= 0 ? 0 : length - 1
  return (currentIndex + delta + length) % length
}
