import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

type StableWidthOptions = {
  hysteresis?: number
  settleDelay?: number
  fallbackWidth?: number
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
