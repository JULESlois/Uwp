import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

type StableWidthOptions = {
  hysteresis?: number
  settleDelay?: number
  fallbackWidth?: number
}

type FitWidthOptions = {
  overflowReserve?: number
  minVisible?: number
}

export function readMeasuredWidths(root: ParentNode, selector: string) {
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).map((item) => item.offsetWidth)
}

export function fitPrefixCount(
  widths: readonly number[],
  availableWidth: number,
  { overflowReserve = 0, minVisible = 0 }: FitWidthOptions = {},
) {
  if (!widths.length) return 0
  const available = Math.max(0, availableWidth)
  let used = 0
  let count = 0

  for (let index = 0; index < widths.length; index += 1) {
    const width = Math.max(0, widths[index] ?? 0)
    const reserve = index < widths.length - 1 ? Math.max(0, overflowReserve) : 0
    if (used + width + reserve > available) break
    used += width
    count += 1
  }

  return Math.max(Math.min(minVisible, widths.length), Math.min(widths.length, count))
}

export function allocatePriorityIndices(
  widths: readonly number[],
  availableWidth: number,
  priorities: readonly ('primary' | 'secondary')[],
  { overflowReserve = 0, minVisible = 1 }: FitWidthOptions = {},
) {
  const allIndices = widths.map((_, index) => index)
  if (!allIndices.length) return []

  const total = widths.reduce((sum, width) => sum + Math.max(0, width), 0)
  if (total <= availableWidth) return allIndices

  const budget = Math.max(0, availableWidth - Math.max(0, overflowReserve))
  const visible = new Set(allIndices)
  let used = total
  const minimum = Math.max(0, Math.min(minVisible, allIndices.length))

  const removeUntilFit = (indices: number[]) => {
    for (const index of indices) {
      if (used <= budget || visible.size <= minimum) break
      if (!visible.has(index)) continue
      visible.delete(index)
      used -= Math.max(0, widths[index] ?? 0)
    }
  }

  removeUntilFit(allIndices.filter((index) => priorities[index] === 'secondary').reverse())
  removeUntilFit(allIndices.filter((index) => visible.has(index)).reverse())
  return allIndices.filter((index) => visible.has(index))
}

export function useStableElementWidth<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { hysteresis = 0, settleDelay = 0, fallbackWidth = 0 }: StableWidthOptions = {},
) {
  const [width, setWidth] = useState(fallbackWidth)
  const committedRef = useRef(fallbackWidth)
  const pendingTimerRef = useRef<number | null>(null)
  const pendingWidthRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const clearPending = () => {
      if (pendingTimerRef.current !== null) window.clearTimeout(pendingTimerRef.current)
      pendingTimerRef.current = null
      pendingWidthRef.current = null
    }

    const commit = (next: number) => {
      clearPending()
      committedRef.current = next
      setWidth((current) => current === next ? current : next)
    }

    const schedule = (next: number) => {
      pendingWidthRef.current = next
      if (pendingTimerRef.current !== null) window.clearTimeout(pendingTimerRef.current)
      pendingTimerRef.current = window.setTimeout(() => {
        const pending = pendingWidthRef.current
        if (pending !== null) commit(pending)
      }, settleDelay)
    }

    const update = (next: number) => {
      if (!Number.isFinite(next)) return
      if (committedRef.current <= 0 || Math.abs(next - committedRef.current) >= hysteresis || settleDelay <= 0) commit(next)
      else schedule(next)
    }

    update(element.getBoundingClientRect().width)
    const observer = new ResizeObserver((entries) => update(entries[0]?.contentRect.width ?? element.getBoundingClientRect().width))
    observer.observe(element)
    return () => {
      clearPending()
      observer.disconnect()
    }
  }, [hysteresis, ref, settleDelay])

  return width
}
