import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from 'react'
import { enabledElements } from './focus-utils'
import { modalTabTarget } from './modal-focus'

const focusableSelector = 'button:not(:disabled),input:not([type="hidden"]):not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[contenteditable="true"],[tabindex]:not([tabindex="-1"])'

function focusSurfaceFallback(surface: HTMLElement | null) {
  if (!surface) return
  if (!surface.hasAttribute('tabindex')) surface.tabIndex = -1
  surface.focus()
}

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
        const initialTarget = surface.current?.querySelector<HTMLElement>(initialSelector)
        if (initialTarget) initialTarget.focus()
        else focusSurfaceFallback(surface.current)
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
  if (!focusable.length) {
    event.preventDefault()
    focusSurfaceFallback(surface)
    return
  }

  const activeIndex = focusable.findIndex((element) => element === document.activeElement)
  const target = modalTabTarget(focusable.length, activeIndex, event.shiftKey)
  if (!target) return

  event.preventDefault()
  const next = target === 'first' ? focusable[0] : focusable[focusable.length - 1]
  next?.focus()
}
