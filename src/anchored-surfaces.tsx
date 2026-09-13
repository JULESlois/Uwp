import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
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

export function Flyout({ open, onClose, anchor, children }: { open: boolean; onClose: () => void; anchor: ReactNode; children: ReactNode }) {
  const host = useRef<HTMLSpanElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)
  const [placement, setPlacement] = useState<AnchoredPlacement>('bottom-start')
  const presence = useLayerPresence(open)

  useLayoutEffect(() => {
    if (!presence.mounted) return
    setPlacement(resolvePlacement(host.current, surface.current))
  }, [presence.mounted, open])

  useEffect(() => {
    if (open && !wasOpen.current) {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      requestAnimationFrame(() => surface.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus())
    } else if (!open && wasOpen.current) {
      requestAnimationFrame(() => returnFocus.current?.focus())
    }
    wasOpen.current = open
  }, [open])

  return <span ref={host} className="flyout-anchor">{anchor}{presence.mounted && <>
    <button className={`flyout-scrim internal-popover-scrim${open ? ' active' : ''}`} aria-label="关闭弹出菜单" tabIndex={open ? 0 : -1} onClick={onClose} />
    <div ref={surface} className={`flyout internal-popover placement-${placement}${presence.entered ? ' entered' : ''}`} role="menu" aria-hidden={!open} onKeyDown={(event) => { if (open) menuKeyDown(event, onClose) }} onTransitionEnd={(event) => { if (event.target !== surface.current || event.propertyName !== 'transform' || open) return; presence.finishExit() }}>{children}</div>
  </>}</span>
}

export function TeachingTip({ open, title, children, anchor, onClose }: { open: boolean; title: string; children: ReactNode; anchor: ReactNode; onClose: () => void }) {
  const host = useRef<HTMLSpanElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<AnchoredPlacement>('bottom-start')
  const presence = useLayerPresence(open)

  useLayoutEffect(() => {
    if (!presence.mounted) return
    setPlacement(resolvePlacement(host.current, surface.current))
  }, [presence.mounted, open])

  return <span ref={host} className="teaching-anchor">{anchor}{presence.mounted && <div ref={surface} className={`teaching-tip internal-popover placement-${placement}${presence.entered ? ' entered' : ''}`} role="status" aria-hidden={!open} onTransitionEnd={(event) => { if (event.target !== surface.current || event.propertyName !== 'transform' || open) return; presence.finishExit() }}><button className="teaching-close" tabIndex={open ? 0 : -1} aria-label="关闭提示" onClick={onClose}><span className="teaching-close-icon" aria-hidden="true"><CommandIcon name="close" /></span></button><strong>{title}</strong><div>{children}</div></div>}</span>
}
