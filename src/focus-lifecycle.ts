import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react'
import { enabledElements } from './focus-utils'

const focusableSelector = 'button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])'

export function useFocusReturn(open: boolean, surface: RefObject<HTMLElement | null>, initialSelector = 'button:not(:disabled)') {
  const returnFocus = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const focusVersion = useRef(0)

  useEffect(() => {
    const version = ++focusVersion.current
    if (open && !wasOpen.current) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      requestAnimationFrame(() => {
        if (focusVersion.current !== version) return
        surface.current?.querySelector<HTMLElement>(initialSelector)?.focus()
      })
    } else if (!open && wasOpen.current) {
      requestAnimationFrame(() => {
        if (focusVersion.current === version) returnFocus.current?.focus()
      })
    }
    wasOpen.current = open
  }, [initialSelector, open, surface])
}

export function trapModalFocus(
  event: ReactKeyboardEvent<HTMLElement>,
  surface: HTMLElement | null,
  onEscape: () => void,
) {
  if (event.key === 'Escape') {
    event.preventDefault()
    onEscape()
    return
  }
  if (event.key !== 'Tab') return

  const focusable = enabledElements(surface, focusableSelector)
  if (!focusable.length) return

  const first = focusable[0]!
  const last = focusable[focusable.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
