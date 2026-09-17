import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject, type ReactNode } from 'react'
import { CommandIcon } from './command-icons'
import { menuKeyDown } from './focus-utils'
import { useLayerPresence } from './internal-motion'

type AnchoredPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'

function resolvePlacement(host: HTMLElement | null, floating: HTMLElement | null): AnchoredPlacement {
  if (!host || !floating || typeof window === 'undefined') return 'bottom-start'
  const anchor = host.getBoundingClientRect()
  const surface = floating.getBoundingClientRect()
  const below = window.innerHeight - anchor.bottom
  const above = anchor.top
  const vertical = below >= Math.min(surface.height + 12, above) ? 'bottom' : 'top'
  const roomToRight = window.innerWidth - anchor.left
  const horizontal = roomToRight >= surface.width + 12 ? 'start' : 'end'
  return `${vertical}-${horizontal}` as AnchoredPlacement
}

function useAnchoredPlacement(
  host: RefObject<HTMLElement | null>,
  surface: RefObject<HTMLElement | null>,
  mounted: boolean,
) {
  const [placement, setPlacement] = useState<AnchoredPlacement>('bottom-start')

  useLayoutEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    const update = () => setPlacement(resolvePlacement(host.current, surface.current))
    update()

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    if (host.current) observer?.observe(host.current)
    if (surface.current) observer?.observe(surface.current)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [host, mounted, surface])

  return placement
}

export interface FlyoutProps {
  open: boolean
  onClose: () => void
  anchor: ReactNode
  children: ReactNode
  ariaLabel?: string
  dismissLabel?: string
}

export function Flyout({ open, onClose, anchor, children, ariaLabel, dismissLabel = '关闭弹出菜单' }: FlyoutProps) {
  const host = useRef<HTMLSpanElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const presence = useLayerPresence(open)
  const placement = useAnchoredPlacement(host, surface, presence.mounted)

  useEffect(() => {
    if (open && !wasOpen.current) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      requestAnimationFrame(() => surface.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"]), button:not(:disabled)')?.focus())
    } else if (!open && wasOpen.current) {
      requestAnimationFrame(() => returnFocus.current?.focus())
    }
    wasOpen.current = open
  }, [open])

  return <span ref={host} className="flyout-anchor">{anchor}{presence.mounted && <>
    <button className={`flyout-scrim internal-popover-scrim${open ? ' active' : ''}`} aria-label={dismissLabel} tabIndex={open ? 0 : -1} onClick={onClose} />
    <div ref={surface} className={`flyout internal-popover placement-${placement}${presence.entered ? ' entered' : ''}`} role="menu" aria-label={ariaLabel} aria-hidden={!open} onKeyDown={(event) => { if (open) menuKeyDown(event, onClose) }} onTransitionEnd={(event) => { if (event.target !== surface.current || event.propertyName !== 'transform' || open) return; presence.finishExit() }}>{children}</div>
  </>}</span>
}

export interface TeachingTipProps {
  open: boolean
  title: string
  children: ReactNode
  anchor: ReactNode
  onClose: () => void
  closeLabel?: string
}

export function TeachingTip({ open, title, children, anchor, onClose, closeLabel = '关闭提示' }: TeachingTipProps) {
  const host = useRef<HTMLSpanElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const presence = useLayerPresence(open)
  const placement = useAnchoredPlacement(host, surface, presence.mounted)

  return <span ref={host} className="teaching-anchor">{anchor}{presence.mounted && <div ref={surface} className={`teaching-tip internal-popover placement-${placement}${presence.entered ? ' entered' : ''}`} role="dialog" aria-modal="false" aria-labelledby={titleId} aria-hidden={!open} onTransitionEnd={(event) => { if (event.target !== surface.current || event.propertyName !== 'transform' || open) return; presence.finishExit() }}><button className="teaching-close" tabIndex={open ? 0 : -1} aria-label={closeLabel} onClick={onClose}><span className="teaching-close-icon" aria-hidden="true"><CommandIcon name="close" /></span></button><strong id={titleId}>{title}</strong><div>{children}</div></div>}</span>
}
