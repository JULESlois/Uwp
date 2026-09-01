import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { NavigationView, type NavItem, type PaneMode } from './components'

export type NavigationPaneMode = PaneMode | 'overlay'

type HierarchyNode<T extends string> = {
  id: string
  label: string
  glyph: string
  key?: T
  children?: HierarchyNode<T>[]
}

function toLeaf<T extends string>(item: NavItem<T>): HierarchyNode<T> {
  return { id: `item-${item.key}`, key: item.key, label: item.label, glyph: item.glyph }
}

function buildHierarchy<T extends string>(items: NavItem<T>[]) {
  if (items.length < 4) return items.map(toLeaf)
  const first = items[0]
  const last = items[items.length - 1]
  const middle = items.slice(1, -1)
  const roots: HierarchyNode<T>[] = []
  if (first) roots.push(toLeaf(first))
  if (middle.length) roots.push({ id: 'group-features', label: '功能', glyph: '▤', children: middle.map(toLeaf) })
  if (last && last !== first) roots.push(toLeaf(last))
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

export function AdaptiveNavigationView<T extends string>({ items, value, onChange, mode = 'auto' }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void; mode?: NavigationPaneMode }) {
  if (mode !== 'overlay') return <NavigationView items={items} value={value} onChange={onChange} mode={mode} />
  return <OverlayNavigationView items={items} value={value} onChange={onChange} />
}

function OverlayNavigationView<T extends string>({ items, value, onChange }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void }) {
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState<HierarchyNode<T>[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['group-features']))
  const paneRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const hierarchy = buildHierarchy(items)
  const currentNodes = path.length ? path[path.length - 1]?.children ?? [] : hierarchy
  const currentTitle = path[path.length - 1]?.label ?? 'UWP LAB'

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => paneRef.current?.querySelector<HTMLButtonElement>('.overlay-tree-action[aria-current="page"],.overlay-tree-action')?.focus())
  }, [open, path.length])

  const visibleActions = (host: HTMLElement) => Array.from(host.querySelectorAll<HTMLButtonElement>('.overlay-tree-action')).filter((button) => button.offsetParent !== null)

  const move = (event: ReactKeyboardEvent<HTMLElement>, delta: number) => {
    const buttons = visibleActions(event.currentTarget)
    if (!buttons.length) return
    const current = document.activeElement as HTMLButtonElement
    const index = Math.max(0, buttons.indexOf(current))
    const next = buttons[(index + delta + buttons.length) % buttons.length]
    if (next) { event.preventDefault(); next.focus() }
  }

  const close = () => {
    setOpen(false)
    setPath([])
    requestAnimationFrame(() => toggleRef.current?.focus())
  }

  const goBack = () => {
    if (path.length) setPath((current) => current.slice(0, -1))
    else close()
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
    if (event.key === 'Escape') { event.preventDefault(); goBack(); return }
    if (event.key === 'ArrowDown') { move(event, 1); return }
    if (event.key === 'ArrowUp') { move(event, -1); return }
    if (event.key === 'Home') { event.preventDefault(); visibleActions(event.currentTarget)[0]?.focus(); return }
    if (event.key === 'End') { event.preventDefault(); const buttons = visibleActions(event.currentTarget); buttons[buttons.length - 1]?.focus(); return }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const active = document.activeElement as HTMLButtonElement | null
      const id = active?.dataset.nodeId
      if (!id) return
      const node = findNode(currentNodes, id)
      if (event.key === 'ArrowRight' && node?.children?.length) { event.preventDefault(); setNodeExpanded(id, true); return }
      if (event.key === 'ArrowLeft') {
        if (expanded.has(id)) { event.preventDefault(); setNodeExpanded(id, false); return }
        if (path.length) { event.preventDefault(); goBack() }
      }
    }
  }

  const enterNode = (node: HierarchyNode<T>) => {
    if (node.children?.length) {
      setPath((current) => [...current, node])
      return
    }
    if (node.key) {
      onChange(node.key)
      close()
    }
  }

  const chooseDirect = (key: T) => {
    onChange(key)
    setOpen(false)
    setPath([])
  }

  const renderNodes = (nodes: HierarchyNode<T>[], depth = 0) => nodes.map((node) => {
    const active = nodeIsActive(node, value)
    const isLeafCurrent = node.key === value
    const hasChildren = Boolean(node.children?.length)
    const isExpanded = hasChildren && expanded.has(node.id)
    const depthStyle = { '--tree-depth': depth } as CSSProperties
    return <div key={node.id} className="overlay-tree-branch" style={depthStyle}><div className={`overlay-tree-node${active ? ' active' : ''}`}><button className="overlay-tree-action" data-node-id={node.id} aria-current={isLeafCurrent ? 'page' : undefined} aria-haspopup={hasChildren ? 'tree' : undefined} aria-expanded={hasChildren ? isExpanded : undefined} onClick={() => enterNode(node)}><span aria-hidden="true">{node.glyph}</span><b>{node.label}</b>{hasChildren ? <i className="overlay-enter" aria-hidden="true">›</i> : null}</button>{hasChildren ? <button className="overlay-disclosure" aria-label={`${isExpanded ? '折叠' : '展开'}${node.label}`} aria-expanded={isExpanded} onClick={(event) => { event.stopPropagation(); toggleNode(node.id) }}><span aria-hidden="true">⌄</span></button> : null}</div>{hasChildren && isExpanded ? <div className="overlay-tree-children" role="group">{renderNodes(node.children ?? [], depth + 1)}</div> : null}</div>
  })

  return <div className="adaptive-overlay-nav"><aside className="overlay-rail" aria-label="主导航"><button ref={toggleRef} className="overlay-toggle" aria-label="打开导航窗格" aria-expanded={open} onClick={() => { if (open) close(); else setOpen(true) }}><span aria-hidden="true">☰</span></button><nav>{items.map((item) => <button key={item.key} className={value === item.key ? 'active' : ''} aria-current={value === item.key ? 'page' : undefined} aria-label={item.label} onClick={() => chooseDirect(item.key)}><span aria-hidden="true">{item.glyph}</span></button>)}</nav></aside>{open && <button className="overlay-nav-scrim" aria-label="关闭导航窗格" onClick={close} />}<aside ref={paneRef} className={`overlay-pane${open ? ' open' : ''}`} aria-hidden={!open} aria-label="展开导航" onKeyDown={paneKey}><header><button aria-label={path.length ? '返回上一级' : '收起导航窗格'} onClick={goBack}>{path.length ? '←' : '×'}</button><strong>{currentTitle}</strong></header><nav className="overlay-pane-list" aria-label={currentTitle}>{renderNodes(currentNodes)}</nav></aside></div>
}
