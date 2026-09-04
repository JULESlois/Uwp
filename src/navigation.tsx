import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type Ref } from 'react'
import type { NavItem, PaneMode } from './components'

export type NavigationPaneMode = PaneMode | 'overlay' | 'left' | 'leftCompact' | 'leftMinimal' | 'top'
export type NavigationNode<T extends string> = {
  id: string
  label: string
  glyph: string
  key?: T
  children?: NavigationNode<T>[]
}

type ResolvedPaneMode = 'left' | 'leftCompact' | 'leftMinimal' | 'overlay' | 'top'
type PaneChangeSource = 'user' | 'system' | 'navigation'
type PathDirection = 'neutral' | 'forward' | 'backward'
type TopFocusKey<T extends string> = T | '__more__'

type NavigationChromeProps = {
  title: string
  onBack?: () => void
  backLabel?: string
  className?: string
}

const TOP_NAV_WIDTH_HYSTERESIS = 12
const TOP_NAV_SETTLE_DELAY = 140

function NavigationBackButton({ onClick, label = '返回上一页', className = '' }: { onClick: () => void; label?: string; className?: string }) {
  return <button className={`navigation-chrome-button navigation-back ${className}`.trim()} aria-label={label} onClick={onClick}>←</button>
}

function NavigationPaneToggle({ open, onClick, className = '', buttonRef }: { open: boolean; onClick: () => void; className?: string; buttonRef?: Ref<HTMLButtonElement> }) {
  return <button ref={buttonRef} className={`navigation-chrome-button navigation-pane-toggle ${className}`.trim()} aria-label={open ? '收起导航窗格' : '打开导航窗格'} aria-expanded={open} onClick={onClick}><span aria-hidden="true">☰</span></button>
}

function NavigationHeader({ title, onBack, backLabel, className = '' }: NavigationChromeProps) {
  return <header className={`navigation-header${onBack ? ' has-back' : ''} ${className}`.trim()}>{onBack && <NavigationBackButton onClick={onBack} label={backLabel} />}<strong>{title}</strong></header>
}

function toLeaf<T extends string>(item: NavItem<T>): NavigationNode<T> {
  return { id: `item-${item.key}`, key: item.key, label: item.label, glyph: item.glyph }
}

function nodeIsActive<T extends string>(node: NavigationNode<T>, value: T): boolean {
  return node.key === value || Boolean(node.children?.some((child) => nodeIsActive(child, value)))
}

function activeBranchIds<T extends string>(nodes: NavigationNode<T>[], value: T, result: string[] = []) {
  for (const node of nodes) {
    if (!node.children?.length || !nodeIsActive(node, value)) continue
    result.push(node.id)
    activeBranchIds(node.children, value, result)
  }
  return result
}

function findNode<T extends string>(nodes: NavigationNode<T>[], id: string): NavigationNode<T> | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const child = node.children ? findNode(node.children, id) : undefined
    if (child) return child
  }
  return undefined
}

function focusableButtons(host: HTMLElement) {
  return Array.from(host.querySelectorAll<HTMLButtonElement>('button:not([disabled])')).filter((button) => button.offsetParent !== null)
}

function trapTab(event: ReactKeyboardEvent<HTMLElement>, buttons: HTMLButtonElement[]) {
  if (event.key !== 'Tab' || !buttons.length) return false
  const current = document.activeElement as HTMLButtonElement | null
  const index = current ? buttons.indexOf(current) : -1
  if (event.shiftKey && index <= 0) {
    event.preventDefault()
    buttons[buttons.length - 1]?.focus()
    return true
  }
  if (!event.shiftKey && (index === buttons.length - 1 || index < 0)) {
    event.preventDefault()
    buttons[0]?.focus()
    return true
  }
  return false
}

function modeForWidth(width: number): ResolvedPaneMode {
  if (width >= 1280) return 'left'
  if (width >= 760) return 'leftCompact'
  return 'leftMinimal'
}

function normalizeMode(mode: NavigationPaneMode, autoMode: ResolvedPaneMode): ResolvedPaneMode {
  if (mode === 'auto') return autoMode
  if (mode === 'expanded') return 'left'
  if (mode === 'compact') return 'leftCompact'
  return mode
}

function useAutoPaneMode(scopeRef: { current: HTMLElement | null }) {
  const [mode, setMode] = useState<ResolvedPaneMode>(() => modeForWidth(typeof window === 'undefined' ? 1280 : window.innerWidth))
  useLayoutEffect(() => {
    const marker = scopeRef.current
    const host = marker?.closest<HTMLElement>('.app') ?? marker?.parentElement
    if (!host) return
    const measure = (width = host.getBoundingClientRect().width) => setMode(modeForWidth(width))
    const observer = new ResizeObserver((entries) => measure(entries[0]?.contentRect.width))
    observer.observe(host)
    measure()
    return () => observer.disconnect()
  }, [scopeRef])
  return mode
}

function paneFallback(mode: ResolvedPaneMode) {
  return mode === 'left'
}

const sharedPaneIntentKey = 'uwp.navigation.intent.shared'
const paneIntentKey = (mode: ResolvedPaneMode) => `uwp.navigation.intent.${mode}`

function readPaneIntent(mode: ResolvedPaneMode) {
  if (mode === 'top') return false
  const fallback = paneFallback(mode)
  if (typeof window === 'undefined') return fallback
  try {
    const local = window.sessionStorage.getItem(paneIntentKey(mode))
    if (local !== null) return local === '1'
    const shared = window.sessionStorage.getItem(sharedPaneIntentKey)
    return shared === null ? fallback : shared === '1'
  } catch {
    return fallback
  }
}

function usePaneLifecycle(mode: ResolvedPaneMode) {
  const [open, setOpen] = useState(() => readPaneIntent(mode))
  const [source, setSource] = useState<PaneChangeSource>('system')
  const modeRef = useRef(mode)

  useLayoutEffect(() => {
    if (modeRef.current === mode) return
    modeRef.current = mode
    setSource('system')
  }, [mode])

  const setUserOpen = (next: boolean) => {
    if (mode === 'top') return
    setSource('user')
    setOpen(next)
    try {
      window.sessionStorage.setItem(paneIntentKey(mode), next ? '1' : '0')
      window.sessionStorage.setItem(sharedPaneIntentKey, next ? '1' : '0')
    } catch {
      // Storage can be unavailable in hardened contexts.
    }
  }

  const setNavigationOpen = (next: boolean) => {
    if (mode === 'top') return
    setSource('navigation')
    setOpen(next)
  }

  return { open, source, setUserOpen, setNavigationOpen }
}

function useNavigationHistory<T extends string>(value: T, onChange: (value: T) => void) {
  const stackRef = useRef<T[]>([])
  const previousRef = useRef(value)
  const suppressNextRef = useRef(false)
  const [, setRevision] = useState(0)

  useEffect(() => {
    if (previousRef.current === value) return
    if (suppressNextRef.current) suppressNextRef.current = false
    else stackRef.current = [...stackRef.current, previousRef.current].slice(-24)
    previousRef.current = value
    setRevision((current) => current + 1)
  }, [value])

  const navigate = (next: T) => {
    if (next !== value) onChange(next)
  }

  const goBack = () => {
    const next = stackRef.current[stackRef.current.length - 1]
    if (!next) return
    stackRef.current = stackRef.current.slice(0, -1)
    suppressNextRef.current = true
    onChange(next)
    setRevision((current) => current + 1)
  }

  return { navigate, goBack, canGoBack: stackRef.current.length > 0 }
}

export function AdaptiveNavigationView<T extends string>({ items, value, onChange, mode = 'auto', hierarchy }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void; mode?: NavigationPaneMode; hierarchy?: NavigationNode<T>[] }) {
  const scopeRef = useRef<HTMLSpanElement>(null)
  const autoMode = useAutoPaneMode(scopeRef)
  const resolved = normalizeMode(mode, autoMode)
  const history = useNavigationHistory(value, onChange)
  const pane = usePaneLifecycle(resolved)
  const explicitHierarchy = hierarchy ?? items.map(toLeaf)

  useLayoutEffect(() => {
    const app = scopeRef.current?.closest<HTMLElement>('.app')
    if (!app) return
    if (mode === 'auto') app.dataset.resolvedNav = resolved
    else delete app.dataset.resolvedNav
    return () => {
      if (app.dataset.resolvedNav === resolved) delete app.dataset.resolvedNav
    }
  }, [mode, resolved])

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.shiftKey || event.ctrlKey || event.metaKey || event.key !== 'ArrowLeft' || !history.canGoBack) return
      event.preventDefault()
      history.goBack()
    }
    window.addEventListener('keydown', keyDown, true)
    return () => window.removeEventListener('keydown', keyDown, true)
  }, [history.canGoBack, history.goBack])

  let navigation
  if (resolved === 'top') navigation = <TopNavigationView items={items} value={value} onChange={history.navigate} />
  else if (resolved === 'left') navigation = <LeftNavigationView items={items} value={value} onChange={history.navigate} open={pane.open} source={pane.source} onOpenChange={pane.setUserOpen} />
  else if (resolved === 'leftCompact') navigation = <OverlayNavigationView items={items} value={value} onChange={history.navigate} open={pane.open} source={pane.source} onUserOpenChange={pane.setUserOpen} onNavigationOpenChange={pane.setNavigationOpen} />
  else if (resolved === 'leftMinimal') navigation = <OverlayNavigationView items={items} value={value} onChange={history.navigate} open={pane.open} source={pane.source} onUserOpenChange={pane.setUserOpen} onNavigationOpenChange={pane.setNavigationOpen} minimal />
  else navigation = <OverlayNavigationView items={items} value={value} onChange={history.navigate} open={pane.open} source={pane.source} onUserOpenChange={pane.setUserOpen} onNavigationOpenChange={pane.setNavigationOpen} hierarchical hierarchy={explicitHierarchy} />

  return <><span ref={scopeRef} hidden aria-hidden="true" />{navigation}</>
}

function LeftNavigationView<T extends string>({ items, value, onChange, open, source, onOpenChange }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void; open: boolean; source: PaneChangeSource; onOpenChange: (value: boolean) => void }) {
  const rootRef = useRef<HTMLElement>(null)
  const [focusKey, setFocusKey] = useState<T>(value)
  useEffect(() => setFocusKey(value), [value])

  const focusAt = (index: number) => {
    const bounded = Math.max(0, Math.min(items.length - 1, index))
    const item = items[bounded]
    if (!item) return
    setFocusKey(item.key)
    requestAnimationFrame(() => rootRef.current?.querySelectorAll<HTMLButtonElement>('.side-nav-action')[bounded]?.focus())
  }

  const keyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); focusAt(index + 1) }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); focusAt(index - 1) }
    if (event.key === 'Home') { event.preventDefault(); focusAt(0) }
    if (event.key === 'End') { event.preventDefault(); focusAt(items.length - 1) }
  }

  return <aside ref={rootRef} className={`side-navigation${open ? ' open' : ' closed'} pane-change-${source}`} aria-label="主导航"><div className="side-navigation-header"><NavigationPaneToggle open={open} onClick={() => onOpenChange(!open)} className="side-nav-toggle" /><strong className="side-nav-brand">UWP LAB</strong></div><nav className="side-nav-items">{items.map((item, index) => <button key={item.key} className={`side-nav-action${value === item.key ? ' active' : ''}`} aria-current={value === item.key ? 'page' : undefined} aria-label={!open ? item.label : undefined} tabIndex={focusKey === item.key ? 0 : -1} onFocus={() => setFocusKey(item.key)} onClick={() => { setFocusKey(item.key); onChange(item.key) }} onKeyDown={(event) => keyDown(event, index)}><span aria-hidden="true">{item.glyph}</span><b>{item.label}</b></button>)}</nav></aside>
}

function useStableVisibleCount<T extends string>(items: NavItem<T>[], hostRef: { current: HTMLElement | null }, measureRef: { current: HTMLDivElement | null }) {
  const [visibleCount, setVisibleCount] = useState(items.length)
  const lastWidthRef = useRef<number | null>(null)
  const settleTimerRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const host = hostRef.current
    const measureHost = measureRef.current
    if (!host || !measureHost) return

    const calculate = (width: number) => {
      const widths = Array.from(measureHost.querySelectorAll<HTMLElement>('[data-measure-item]')).map((item) => item.offsetWidth)
      const available = Math.max(0, width - 24)
      const overflowWidth = 52
      let used = 0
      let count = 0
      for (let index = 0; index < widths.length; index += 1) {
        const itemWidth = widths[index] ?? 0
        const reserve = index < widths.length - 1 ? overflowWidth : 0
        if (used + itemWidth + reserve > available) break
        used += itemWidth
        count += 1
      }
      const next = items.length === 0 ? 0 : Math.max(1, Math.min(items.length, count))
      setVisibleCount((current) => current === next ? current : next)
    }

    const clearSettle = () => {
      if (settleTimerRef.current === null) return
      window.clearTimeout(settleTimerRef.current)
      settleTimerRef.current = null
    }

    const commitWidth = (width: number) => {
      clearSettle()
      lastWidthRef.current = width
      calculate(width)
    }

    const observeWidth = (width: number) => {
      const previous = lastWidthRef.current
      if (previous === null || Math.abs(width - previous) >= TOP_NAV_WIDTH_HYSTERESIS) {
        commitWidth(width)
        return
      }
      clearSettle()
      settleTimerRef.current = window.setTimeout(() => {
        settleTimerRef.current = null
        lastWidthRef.current = width
        calculate(width)
      }, TOP_NAV_SETTLE_DELAY)
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width !== undefined) observeWidth(width)
    })
    observer.observe(host)
    commitWidth(host.getBoundingClientRect().width)

    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) calculate(lastWidthRef.current ?? host.getBoundingClientRect().width)
    })

    return () => {
      cancelled = true
      clearSettle()
      observer.disconnect()
    }
  }, [items, hostRef, measureRef])

  return visibleCount
}

function TopNavigationView<T extends string>({ items, value, onChange }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void }) {
  const hostRef = useRef<HTMLElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)
  const visibleCount = useStableVisibleCount(items, hostRef, measureRef)
  const [focusKey, setFocusKey] = useState<TopFocusKey<T>>(value)
  const [open, setOpen] = useState(false)

  const selectedIndex = items.findIndex((item) => item.key === value)
  let visible = items.slice(0, visibleCount)
  if (selectedIndex >= visibleCount && visibleCount > 0) {
    visible = [...items.slice(0, Math.max(0, visibleCount - 1)), items[selectedIndex]!]
  }
  const visibleKeys = new Set(visible.map((item) => item.key))
  const overflow = items.filter((item) => !visibleKeys.has(item.key))
  const overflowActive = overflow.some((item) => item.key === value)
  const focusIsVisible = focusKey !== '__more__' && visibleKeys.has(focusKey)
  const rovingKey: TopFocusKey<T> | null = focusIsVisible
    ? focusKey
    : focusKey === '__more__' && overflow.length > 0
      ? '__more__'
      : visibleKeys.has(value)
        ? value
        : overflowActive && overflow.length > 0
          ? '__more__'
          : visible[0]?.key ?? (overflow.length > 0 ? '__more__' : null)

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      const current = buttons.find((button) => button.dataset.navKey === value)
      ;(current ?? buttons[0])?.focus()
    })
  }, [open, value])

  useEffect(() => {
    if (open && overflow.length === 0) setOpen(false)
  }, [open, overflow.length])

  const focusPrimaryOrMore = (key: T) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const host = hostRef.current
      if (!host) return
      const recovered = Array.from(host.querySelectorAll<HTMLButtonElement>('.top-nav-action')).find((button) => button.dataset.navKey === key)
      if (recovered) {
        setFocusKey(key)
        recovered.focus()
        return
      }
      if (moreRef.current) {
        setFocusKey('__more__')
        moreRef.current.focus()
      }
    }))
  }

  const moveTopFocus = (event: ReactKeyboardEvent<HTMLElement>, delta: number) => {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('.top-nav-action,.top-nav-more')).filter((button) => button.offsetParent !== null)
    if (!buttons.length) return
    const current = document.activeElement as HTMLButtonElement | null
    const index = Math.max(0, current ? buttons.indexOf(current) : 0)
    const next = buttons[(index + delta + buttons.length) % buttons.length]
    if (next) { event.preventDefault(); next.focus() }
  }

  const menuKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const buttons = focusableButtons(event.currentTarget)
    if (!buttons.length) return
    if (trapTab(event, buttons)) return
    const current = document.activeElement as HTMLButtonElement | null
    const index = Math.max(0, current ? buttons.indexOf(current) : 0)
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); requestAnimationFrame(() => moreRef.current?.focus()); return }
    if (event.key === 'ArrowDown') { event.preventDefault(); buttons[(index + 1) % buttons.length]?.focus() }
    if (event.key === 'ArrowUp') { event.preventDefault(); buttons[(index - 1 + buttons.length) % buttons.length]?.focus() }
    if (event.key === 'Home') { event.preventDefault(); buttons[0]?.focus() }
    if (event.key === 'End') { event.preventDefault(); buttons[buttons.length - 1]?.focus() }
  }

  return <nav ref={hostRef} className="top-navigation" aria-label="主导航" onKeyDown={(event) => {
    if (event.key === 'ArrowRight') moveTopFocus(event, 1)
    if (event.key === 'ArrowLeft') moveTopFocus(event, -1)
    if (event.key === 'Home') { event.preventDefault(); event.currentTarget.querySelector<HTMLButtonElement>('.top-nav-action')?.focus() }
    if (event.key === 'End') { event.preventDefault(); const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('.top-nav-action,.top-nav-more'); buttons[buttons.length - 1]?.focus() }
  }}><div ref={measureRef} className="top-nav-measure" aria-hidden="true">{items.map((item) => <span key={item.key} data-measure-item><span>{item.glyph}</span>{item.label}</span>)}</div><div className="top-nav-items">{visible.map((item) => <button key={item.key} data-nav-key={item.key} className={`top-nav-action${value === item.key ? ' active' : ''}`} aria-current={value === item.key ? 'page' : undefined} tabIndex={rovingKey === item.key ? 0 : -1} onFocus={() => setFocusKey(item.key)} onClick={() => { setFocusKey(item.key); onChange(item.key); setOpen(false) }}><span aria-hidden="true">{item.glyph}</span><b>{item.label}</b></button>)}{overflow.length > 0 && <button ref={moreRef} className={`top-nav-more${overflowActive ? ' active' : ''}`} aria-label="更多导航" aria-haspopup="menu" aria-expanded={open} tabIndex={rovingKey === '__more__' ? 0 : -1} onFocus={() => setFocusKey('__more__')} onClick={() => setOpen((current) => !current)}>•••</button>}</div>{open && overflow.length > 0 && <><button className="top-nav-scrim" aria-label="关闭更多导航" onClick={() => setOpen(false)} /><div ref={menuRef} className="top-nav-overflow" role="menu" onKeyDown={menuKey}>{overflow.map((item) => <button key={item.key} data-nav-key={item.key} role="menuitem" className={value === item.key ? 'active' : ''} onClick={() => { setFocusKey(item.key); onChange(item.key); setOpen(false); focusPrimaryOrMore(item.key) }}><span aria-hidden="true">{item.glyph}</span><b>{item.label}</b></button>)}</div></>}</nav>
}

function OverlayNavigationView<T extends string>({ items, value, onChange, open, source, onUserOpenChange, onNavigationOpenChange, minimal = false, hierarchical = false, hierarchy }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void; open: boolean; source: PaneChangeSource; onUserOpenChange: (value: boolean) => void; onNavigationOpenChange: (value: boolean) => void; minimal?: boolean; hierarchical?: boolean; hierarchy?: NavigationNode<T>[] }) {
  const roots = hierarchical ? (hierarchy ?? items.map(toLeaf)) : items.map(toLeaf)
  const [path, setPath] = useState<NavigationNode<T>[]>([])
  const [pathDirection, setPathDirection] = useState<PathDirection>('neutral')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(activeBranchIds(roots, value)))
  const paneRef = useRef<HTMLElement>(null)
  const railRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const focusRequestRef = useRef(0)
  const pendingPathResetRef = useRef(false)
  const currentNodes = path.length ? path[path.length - 1]?.children ?? [] : roots
  const currentTitle = path[path.length - 1]?.label ?? 'UWP LAB'
  const paneViewKey = path.map((node) => node.id).join('/') || 'root'
  const activeBranchKey = activeBranchIds(roots, value).join('\u0000')

  const queueFocus = (work: () => void) => {
    const request = ++focusRequestRef.current
    requestAnimationFrame(() => {
      if (focusRequestRef.current === request) work()
    })
  }

  const settleClosed = () => {
    if (open || !pendingPathResetRef.current) return
    pendingPathResetRef.current = false
    setPathDirection('neutral')
    setPath([])
  }

  useLayoutEffect(() => {
    const paneElement = paneRef.current
    if (!paneElement) return
    if (open) paneElement.removeAttribute('inert')
    else paneElement.setAttribute('inert', '')
  }, [open])

  useLayoutEffect(() => {
    if (!open && source === 'system' && pendingPathResetRef.current) settleClosed()
  }, [open, source])

  useEffect(() => {
    if (!open) return
    queueFocus(() => paneRef.current?.querySelector<HTMLButtonElement>('.overlay-tree-action[aria-current="page"],.overlay-tree-action')?.focus())
  }, [open, path.length])

  useEffect(() => {
    if (!hierarchical && path.length) {
      pendingPathResetRef.current = false
      setPathDirection('neutral')
      setPath([])
    }
  }, [hierarchical, path.length])

  useEffect(() => {
    if (!activeBranchKey) return
    const ids = activeBranchKey.split('\u0000')
    setExpanded((current) => {
      if (ids.every((id) => current.has(id))) return current
      const next = new Set(current)
      ids.forEach((id) => next.add(id))
      return next
    })
  }, [activeBranchKey])

  const visibleActions = (host: HTMLElement) => Array.from(host.querySelectorAll<HTMLButtonElement>('.overlay-tree-action')).filter((button) => button.offsetParent !== null)

  const move = (event: ReactKeyboardEvent<HTMLElement>, delta: number) => {
    const buttons = visibleActions(event.currentTarget)
    if (!buttons.length) return
    const current = document.activeElement as HTMLButtonElement
    const index = Math.max(0, buttons.indexOf(current))
    const next = buttons[(index + delta + buttons.length) % buttons.length]
    if (next) { event.preventDefault(); next.focus() }
  }

  const rememberOpener = () => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : toggleRef.current
  }

  const togglePane = () => {
    focusRequestRef.current += 1
    if (!open) {
      pendingPathResetRef.current = false
      rememberOpener()
    }
    onUserOpenChange(!open)
  }

  const focusRail = (key: T) => {
    const buttons = Array.from(railRef.current?.querySelectorAll<HTMLButtonElement>('[data-nav-key]') ?? [])
    buttons.find((button) => button.dataset.navKey === key)?.focus()
  }

  const close = (changeSource: 'user' | 'navigation' = 'user', returnKey?: T) => {
    focusRequestRef.current += 1
    pendingPathResetRef.current = true
    if (changeSource === 'user') onUserOpenChange(false)
    else onNavigationOpenChange(false)
    if (changeSource === 'user') {
      const returnTarget = openerRef.current ?? toggleRef.current
      queueFocus(() => returnTarget?.focus())
    } else if (returnKey) {
      queueFocus(() => {
        if (minimal) toggleRef.current?.focus()
        else focusRail(returnKey)
      })
    }
  }

  const goPaneBack = () => {
    if (!path.length) return
    setPathDirection('backward')
    setPath((current) => current.slice(0, -1))
  }

  const setNodeExpanded = (id: string, openState: boolean) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (openState) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleNode = (id: string) => setNodeExpanded(id, !expanded.has(id))

  const paneKey = (event: ReactKeyboardEvent<HTMLElement>) => {
    const paneButtons = focusableButtons(event.currentTarget)
    if (trapTab(event, paneButtons)) return
    if (event.key === 'Escape') {
      event.preventDefault()
      if (path.length) goPaneBack()
      else close('user')
      return
    }
    if (event.key === 'ArrowDown') { move(event, 1); return }
    if (event.key === 'ArrowUp') { move(event, -1); return }
    if (event.key === 'Home') { event.preventDefault(); visibleActions(event.currentTarget)[0]?.focus(); return }
    if (event.key === 'End') { event.preventDefault(); const buttons = visibleActions(event.currentTarget); buttons[buttons.length - 1]?.focus(); return }
    if (!hierarchical || (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')) return
    const active = document.activeElement as HTMLButtonElement | null
    const id = active?.dataset.nodeId
    if (!id) return
    const node = findNode(currentNodes, id)
    if (event.key === 'ArrowRight' && node?.children?.length) { event.preventDefault(); setNodeExpanded(id, true); return }
    if (event.key === 'ArrowLeft') {
      if (expanded.has(id)) { event.preventDefault(); setNodeExpanded(id, false); return }
      if (path.length) { event.preventDefault(); goPaneBack() }
    }
  }

  const enterNode = (node: NavigationNode<T>) => {
    if (hierarchical && node.children?.length) {
      setPathDirection('forward')
      setPath((current) => [...current, node])
      return
    }
    if (node.key) {
      onChange(node.key)
      close('navigation', node.key)
    }
  }

  const chooseDirect = (key: T) => {
    onChange(key)
    if (open) close('navigation', key)
    else onNavigationOpenChange(false)
  }

  const renderNodes = (nodes: NavigationNode<T>[], depth = 0): React.ReactNode => nodes.map((node) => {
    const active = nodeIsActive(node, value)
    const isLeafCurrent = node.key === value
    const hasChildren = hierarchical && Boolean(node.children?.length)
    const isExpanded = hasChildren && expanded.has(node.id)
    const depthStyle = { '--tree-depth': depth } as CSSProperties
    return <div key={node.id} className="overlay-tree-branch" style={depthStyle}><div className={`overlay-tree-node${active ? ' active' : ''}`}><button className="overlay-tree-action" data-node-id={node.id} data-nav-key={node.key} aria-current={isLeafCurrent ? 'page' : undefined} aria-haspopup={hasChildren ? 'menu' : undefined} aria-expanded={hasChildren ? isExpanded : undefined} onClick={() => enterNode(node)}><span aria-hidden="true">{node.glyph}</span><b>{node.label}</b>{hasChildren ? <i className="overlay-enter" aria-hidden="true">›</i> : null}</button>{hasChildren ? <button className="overlay-disclosure" aria-label={`${isExpanded ? '折叠' : '展开'}${node.label}`} aria-expanded={isExpanded} onClick={(event) => { event.stopPropagation(); toggleNode(node.id) }}><span aria-hidden="true">⌄</span></button> : null}</div>{hasChildren && isExpanded ? <div className="overlay-tree-children" role="group">{renderNodes(node.children ?? [], depth + 1)}</div> : null}</div>
  })

  const paneHeader = <NavigationHeader key={`header-${paneViewKey}`} className="overlay-pane-header" title={currentTitle} onBack={path.length ? goPaneBack : undefined} backLabel="返回上一级" />
  const pane = <aside ref={paneRef} className={`overlay-pane${open ? ' open' : ''}`} data-path-direction={pathDirection} aria-hidden={!open} aria-label="展开导航" onKeyDown={paneKey} onTransitionEnd={(event) => { if (event.propertyName === 'transform') settleClosed() }}>{paneHeader}<nav key={`list-${paneViewKey}`} className="overlay-pane-list" aria-label={currentTitle}>{renderNodes(currentNodes)}</nav></aside>
  const scrim = <button className="overlay-nav-scrim" aria-label="关闭导航窗格" aria-hidden={!open} tabIndex={open ? 0 : -1} onClick={() => { if (open) close('user') }} />

  if (minimal) {
    return <div className={`adaptive-overlay-nav minimal${open ? ' open' : ''} pane-change-${source}`}>{scrim}<div className={`minimal-pane-shell${open ? ' open' : ''}`} onTransitionEnd={(event) => { if (event.propertyName === 'transform') settleClosed() }}>{pane}<NavigationPaneToggle buttonRef={toggleRef} open={open} onClick={togglePane} className="minimal-nav-toggle" /></div></div>
  }

  return <div className={`adaptive-overlay-nav${hierarchical ? ' hierarchical' : ' flat'}${open ? ' open' : ''} pane-change-${source}`}><aside ref={railRef} className="overlay-rail" aria-label="主导航"><NavigationPaneToggle buttonRef={toggleRef} open={open} onClick={togglePane} className="overlay-toggle" /><nav>{items.map((item) => <button key={item.key} data-nav-key={item.key} className={value === item.key ? 'active' : ''} aria-current={value === item.key ? 'page' : undefined} aria-label={item.label} onClick={() => chooseDirect(item.key)}><span aria-hidden="true">{item.glyph}</span></button>)}</nav></aside>{scrim}{pane}</div>
}
