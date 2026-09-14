import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { nextRovingIndex } from './focus-navigation'

function interactive(root: HTMLElement | null, selector: string) {
  if (!root) return [] as HTMLElement[]
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true',
  )
}

function moveFocus(root: HTMLElement | null, selector: string, current: HTMLElement, delta: number) {
  const items = interactive(root, selector)
  const index = nextRovingIndex(items.length, items.indexOf(current), delta)
  if (index < 0) return
  items[index]?.focus()
}

function focusBoundary(root: HTMLElement | null, selector: string, end: boolean) {
  const items = interactive(root, selector)
  ;(end ? items[items.length - 1] : items[0])?.focus()
}

export function menuKeyDown(event: ReactKeyboardEvent<HTMLElement>, onEscape?: () => void) {
  const selector = '[role="menuitem"]:not(:disabled),[role="option"]:not(:disabled),button:not(:disabled)'
  if (event.key === 'ArrowDown') { event.preventDefault(); moveFocus(event.currentTarget, selector, event.target as HTMLElement, 1) }
  if (event.key === 'ArrowUp') { event.preventDefault(); moveFocus(event.currentTarget, selector, event.target as HTMLElement, -1) }
  if (event.key === 'Home') { event.preventDefault(); focusBoundary(event.currentTarget, selector, false) }
  if (event.key === 'End') { event.preventDefault(); focusBoundary(event.currentTarget, selector, true) }
  if (event.key === 'Escape') { event.preventDefault(); onEscape?.() }
}

export function toolbarKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
  const selector = '[data-roving="true"]:not(:disabled)'
  if (event.key === 'ArrowRight') { event.preventDefault(); moveFocus(event.currentTarget, selector, event.target as HTMLElement, 1) }
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveFocus(event.currentTarget, selector, event.target as HTMLElement, -1) }
  if (event.key === 'Home') { event.preventDefault(); focusBoundary(event.currentTarget, selector, false) }
  if (event.key === 'End') { event.preventDefault(); focusBoundary(event.currentTarget, selector, true) }
}

export { interactive as enabledElements }
