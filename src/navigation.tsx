import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { NavItem, PaneMode } from './components'

export type NavigationPaneMode = PaneMode | 'overlay' | 'left' | 'leftCompact' | 'leftMinimal' | 'top'
type ResolvedPaneMode = 'left' | 'leftCompact' | 'leftMinimal' | 'overlay' | 'top'
type PaneChangeSource = 'user' | 'system' | 'navigation'

type HierarchyNode<T extends string> = {
  id: string
  label: string
  glyph: string
  key?: T
  children?: HierarchyNode<T>[]
}

type NavigationChromeProps = {
  title: string
  onBack?: () => void
  backLabel?: string
  className?: string
}

function NavigationBackButton({ onClick, label = '返回上一页', className = '' }: { onClick: () => void; label?: string; className?: string }) {
  return <button className={`navigation-chrome-button navigation-back ${className}`.trim()} aria-label={label} onClick={onClick}>←</button>
}

function NavigationPaneToggle({ open, onClick, className = '' }: { open: boolean; onClick: () => void; className?: string }) {
  return <button className={`navigation-chrome-button navigation-pane-toggle ${className}`.trim()} aria-label={open ? '收起导航窗格' : '打开导航窗格'} aria-expanded={open} onClick={onClick}><span aria-hidden="true">☰</span></button>
}

function NavigationHeader({ title, onBack, backLabel, className = '' }: NavigationChromeProps) {
  return <header className={`navigation-header${onBack ? ' has-back' : ''} ${className}`.trim()}>{onBack && <NavigationBackButton onClick={onBack} label={backLabel} />}<strong>{title}</strong></header>
}

function toLeaf<T extends string>(item: NavItem<T>): HierarchyNode<T> {
  return { id: `item-${item.key}`, key: item.key, label: item.label, glyph: item.glyph }
}

function buildHierarchy<T extends string>(items: NavItem<T>[]) {
  if (items.length < 4) return items.map((item) => toLeaf<T>(item))
  const first = items[0]
  const last = items[items.length - 1]
  const middle = items.slice(1, -1)
  const roots: HierarchyNode<T>[] = []
  if (first) roots.push(toLeaf<T>(first))
  if (middle.length) roots.push({ id: 'group-features', label: '功能', glyph: '▤', children: middle.map((item) => toLeaf<T>(item)) })
  if (last && last !== first) roots.push(toLeaf<T>(last))
  return roots
}

function nodeIsActive<T extends string>(node: HierarchyNode<T>, value: T): boolean {
  return node.key === value || Boolean(node.children?.some((child) => nodeIsActive(child, value)))
}

function findNode<T extends string>(nodes: HierarchyNode<T>[], id: string): HierarchyNode<T> | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const child = node.children ? findNode(node.children, id) : undefined
    if (child) return child
  }
  return undefined
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

function useAutoPaneMode() {
  const [mode, setMode] = useState<ResolvedPaneMode>(() => modeForWidth(typeof window === 'undefined' ? 1280 : window.innerWidth))
  useEffect(() => {
    const update = () => setMode(modeForWidth(window.innerWidth))
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])
  return mode
}

function paneFallback(mode: ResolvedPaneMode) {
  return mode === 'left'
}

function paneIntentKey(mode: ResolvedPaneMode) {
  return `uwp.navigation.intent.${mode}`
}

function readPaneIntent(mode: ResolvedPaneMode) {
  if (mode === 'top') return false
  const fallback = paneFallback(mode)
  if (typeof window === 'undefined') return fallback
  try {
    const stored = window.sessionStorage.getItem(paneIntentKey(mode))
    return stored === null ? fallback : stored === '1'
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
    setOpen(readPaneIntent(mode))
  }, [mode])

  const setUserOpen = (next: boolean) => {
    if (mode === 'top') return
    setSource('user')
    setOpen(next)
    try { window.sessionStorage.setItem(paneIntentKey(mode), next ? '1' : '0') }
    catch { /* storage can be unavailable in hardened contexts */ }
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

export function AdaptiveNavigationView<T extends string>({ items, value, onChange, mode = 'auto' }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void; mode?: NavigationPaneMode }) {
  const autoMode = useAutoPaneMode()
  const resolved = normalizeMode(mode, autoMode)
  const history = useNavigationHistory(value, onChange)
  const pane = usePaneLifecycle(resolved)

  if (resolved === 'top') return <TopNavigationView items={items} value={value} onChange={history.navigate} canGoBack={history.canGoBack} onBack={history.goBack} />
  if (resolved === 'left') return <LeftNavigationView items={items} value={value} onChange={history.navigate} open={pane.open} source={pane.source} onOpenChange={pane.setUserOpen} />
  if (resolved === 'leftCompact') return <OverlayNavigationView items={items} value={value} onChange={history.navigate} open={pane.open} source={pane.source} onUserOpenChange={pane.setUserOpen} onNavigationOpenChange={pane.setNavigationOpen} />
  if (resolved === 'leftMinimal') return <OverlayNavigationView items={items} value={value} onChange={history.navigate} open={pane.open} source={pane.source} onUserOpenChange={pane.setUserOpen} onNavigationOpenChange={pane.setNavigationOpen} minimal />
  return <OverlayNavigationView items={items} value={value} onChange={history.navigate} open={pane.open} source={pane.source} onUserOpenChange={pane.setUserOpen} onNavigationOpenChange={pane.setNavigationOpen} hierarchical />
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

function TopNavigationView<T extends string>({ items, value, onChange, canGoBack, onBack }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void; canGoBack: boolean; onBack: () => void }) {
  const hostRef = useRef<HTMLElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const moreRef = useRef<HTMLButtonElement>(null)
  const [visibleCount, setVisibleCount] = useState(items.length)
  const [open, setOpen] = useState(false)

  useLayoutEffect(() => {
    const host = hostRef.current
    const measureHost = measureRef.current
    if (!host || !measureHost) return
    const measure = () => {
      const widths = Array.from(measureHost.querySelectorAll<HTMLElement>('[data-measure-item]')).map((item) => item.offsetWidth)
      const backWidth = canGoBack ? 48 : 0
      const available = Math.max(0, host.clientWidth - 24 - backWidth)
      const overflowWidth = 52
      let used = 0
      let count = 0
      for (let index = 0; index < widths.length; index += 1) {
        const width = widths[index] ?? 0
        const reserve = index < widths.length - 1 ? overflowWidth : 0
        if (used + width + reserve > available) break
        used += width
        count += 1
      }
      setVisibleCount(Math.max(1, Math.min(items.length, count)))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    measure()
    return () => observer.disconnect()
  }, [items, canGoBack])

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus())
  }, [open])

  const selectedIndex = items.findIndex((item) => item.key === value)
  let visible = items.slice(0, visibleCount)
  if (selectedIndex >= visibleCount && visibleCount > 0) visible = [...items.slice(0, Math.max(0, visibleCount - 1)), items[selectedIndex]!]
  const visibleKeys = new Set(visible.map((item) => item.key))
  const overflow = items.filter((item) => !visibleKeys.has(item.key))
  const overflowActive = overflow.some((item) => item.key === value)

  const moveTopFocus = (event: ReactKeyboardEvent<HTMLElement>, delta: number) => {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('.top-nav-back,.top-nav-action,.top-nav-more')).filter((button) => button.offsetParent !== null)
    if (!buttons.length) return
    const current = document.activeElement as HTMLButtonElement | null
    const index = Math.max(0, current ? buttons.indexOf(current) : 0)
    const next = buttons[(index + delta + buttons.length) % buttons.length]
    if (next) { event.preventDefault(); next.focus() }
  }

  const menuKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'))
    if (!buttons.length) return
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
    if (event.key === 'Home') { event.preventDefault(); event.currentTarget.querySelector<HTMLButtonElement>('.top-nav-back,.top-nav-action')?.focus() }
    if (event.key === 'End') { event.preventDefault(); const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('.top-nav-back,.top-nav-action,.top-nav-more'); buttons[buttons.length - 1]?.focus() }
  }}>{canGoBack && <NavigationBackButton className="top-nav-back" onClick={onBack} />}<div ref={measureRef} className="top-nav-measure" aria-hidden="true">{items.map((item) => <span key={item.key} data-measure-item><span>{item.glyph}</span>{item.label}</span>)}</div><div className="top-nav-items">{visible.map((item) => <button key={item.key} className={`top-nav-action${value === item.key ? ' active' : ''}`} aria-current={value === item.key ? 'page' : undefined} tabIndex={value === item.key || (!visible.some((candidate) => candidate.key === value) && item === visible[0]) ? 0 : -1} onClick={() => { onChange(item.key); setOpen(false) }}><span aria-hidden="true">{item.glyph}</span><b>{item.label}</b></button>)}{overflow.length > 0 && <button ref={moreRef} className={`top-nav-more${overflowActive ? ' active' : ''}`} aria-label="更多导航" aria-expanded={open} onClick={() => setOpen((current) => !current)}>•••</button>}</div>{open && overflow.length > 0 && <><button className="top-nav-scrim" aria-label="关闭更多导航" onClick={() => setOpen(false)} /><div ref={menuRef} className="top-nav-overflow" role="menu" onKeyDown={menuKey}>{overflow.map((item) => <button key={item.key} role="menuitem" className={value === item.key ? 'active' : ''} onClick={() => { onChange(item.key); setOpen(false) }}><span aria-hidden="true">{item.glyph}</span><b>{item.label}</b></button>)}</div></>}</nav>
}

function OverlayNavigationView<T extends string>({ items, value, onChange, open, source, onUserOpenChange, onNavigationOpenChange, minimal = false, hierarchical = false }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void; open: boolean; source: PaneChangeSource; onUserOpenChange: (value: boolean) => void; onNavigationOpenChange: (value: boolean) => void; minimal?: boolean; hierarchical?: boolean }) {
  const [path, setPath] = useState<HierarchyNode<T>[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['group-features']))
  const paneRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const hierarchy = hierarchical ? buildHierarchy(items) : items.map((item) => toLeaf<T>(item))
  const currentNodes = path.length ? path[path.length - 1]?.children ?? [] : hierarchy
  const currentTitle = path[path.length - 1]?.label ?? 'UWP LAB'

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => paneRef.current?.querySelector<HTMLButtonElement>('.overlay-tree-action[aria-current="page"],.overlay-tree-action')?.focus())
  }, [open, path.length])

  useEffect(() => {
    if (!hierarchical && path.length) setPath([])
  }, [hierarchical, path.length])

  const visibleActions = (host: HTMLElement) => Array.from(host.querySelectorAll<HTMLButtonElement>('.overlay-tree-action')).filter((button) => button.offsetParent !== null)

  const move = (event: ReactKeyboardEvent<HTMLElement>, delta: number) => {
    const buttons = visibleActions(event.currentTarget)
    if (!buttons.length) return
    const current = document.activeElement as HTMLButtonElement
    const index = Math.max(0, buttons.indexOf(current))
    const next = buttons[(index + delta + buttons.length) % buttons.length]
    if (next) { event.preventDefault(); next.focus() }
  }

  const close = (changeSource: 'user' | 'navigation' = 'user') => {
    if (changeSource === 'user') onUserOpenChange(false)
    else onNavigationOpenChange(false)
    setPath([])
    if (changeSource === 'user') requestAnimationFrame(() => toggleRef.current?.focus())
  }

  const goPaneBack = () => {
    if (path.length) setPath((current) => current.slice(0, -1))
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

  const enterNode = (node: HierarchyNode<T>) => {
    if (hierarchical && node.children?.length) {
      setPath((current) => [...current, node])
      return
    }
    if (node.key) {
      onChange(node.key)
      close('navigation')
    }
  }

  const chooseDirect = (key: T) => {
    onChange(key)
    close('navigation')
  }

  const renderNodes = (nodes: HierarchyNode<T>[], depth = 0) => nodes.map((node) => {
    const active = nodeIsActive(node, value)
    const isLeafCurrent = node.key === value
    const hasChildren = hierarchical && Boolean(node.children?.length)
    const isExpanded = hasChildren && expanded.has(node.id)
    const depthStyle = { '--tree-depth': depth } as CSSProperties
    return <div key={node.id} className="overlay-tree-branch" style={depthStyle}><div className={`overlay-tree-node${active ? ' active' : ''}`}><button className="overlay-tree-action" data-node-id={node.id} aria-current={isLeafCurrent ? 'page' : undefined} aria-haspopup={hasChildren ? 'tree' : undefined} aria-expanded={hasChildren ? isExpanded : undefined} onClick={() => enterNode(node)}><span aria-hidden="true">{node.glyph}</span><b>{node.label}</b>{hasChildren ? <i className="overlay-enter" aria-hidden="true">›</i> : null}</button>{hasChildren ? <button className="overlay-disclosure" aria-label={`${isExpanded ? '折叠' : '展开'}${node.label}`} aria-expanded={isExpanded} onClick={(event) => { event.stopPropagation(); toggleNode(node.id) }}><span aria-hidden="true">⌄</span></button> : null}</div>{hasChildren && isExpanded ? <div className="overlay-tree-children" role="group">{renderNodes(node.children ?? [], depth + 1)}</div> : null}</div>
  })

  const paneHeader = <NavigationHeader className="overlay-pane-header" title={currentTitle} onBack={path.length ? goPaneBack : undefined} backLabel="返回上一级" />
  const pane = <aside ref={paneRef} className={`overlay-pane${open ? ' open' : ''}`} aria-hidden={!open} aria-label="展开导航" onKeyDown={paneKey}>{paneHeader}<nav className="overlay-pane-list" aria-label={currentTitle}>{renderNodes(currentNodes)}</nav>{minimal && <NavigationPaneToggle open={open} onClick={() => onUserOpenChange(!open)} className="minimal-nav-toggle" />}</aside>

  if (minimal) {
    return <div className={`adaptive-overlay-nav minimal${open ? ' open' : ''} pane-change-${source}`}>{open && <button className="overlay-nav-scrim" aria-label="关闭导航窗格" onClick={() => close('user')} />}<div className={`minimal-pane-shell${open ? ' open' : ''}`}>{pane}</div></div>
  }

  return <div className={`adaptive-overlay-nav${hierarchical ? ' hierarchical' : ' flat'}${open ? ' open' : ''} pane-change-${source}`}><aside className="overlay-rail" aria-label="主导航"><NavigationPaneToggle open={open} onClick={() => onUserOpenChange(!open)} className="overlay-toggle" /><nav>{items.map((item) => <button key={item.key} className={value === item.key ? 'active' : ''} aria-current={value === item.key ? 'page' : undefined} aria-label={item.label} onClick={() => chooseDirect(item.key)}><span aria-hidden="true">{item.glyph}</span></button>)}</nav></aside>{open && <button className="overlay-nav-scrim" aria-label="关闭导航窗格" onClick={() => close('user')} />}{pane}</div>
}
