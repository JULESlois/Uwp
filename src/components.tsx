import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'

export type NavItem<T extends string> = { key: T; glyph: string; label: string }
export type PaneMode = 'auto' | 'compact' | 'expanded'
export type Command = { label: string; glyph: string; onClick?: () => void; primary?: boolean; disabled?: boolean }
export type ListItem = { key: string; title: string; detail?: string; glyph?: string; disabled?: boolean }

function enabledElements(root: HTMLElement | null, selector: string) {
  if (!root) return [] as HTMLElement[]
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true')
}

function focusRelative(root: HTMLElement | null, selector: string, current: HTMLElement, delta: number) {
  const items = enabledElements(root, selector)
  if (!items.length) return
  const currentIndex = Math.max(0, items.indexOf(current))
  items[(currentIndex + delta + items.length) % items.length]?.focus()
}

function focusEdge(root: HTMLElement | null, selector: string, edge: 'start' | 'end') {
  const items = enabledElements(root, selector)
  ;(edge === 'start' ? items[0] : items[items.length - 1])?.focus()
}

function menuKeyDown(event: ReactKeyboardEvent<HTMLElement>, onEscape?: () => void) {
  const selector = '[role="menuitem"]:not(:disabled),[role="option"]:not(:disabled),button:not(:disabled)'
  if (event.key === 'ArrowDown') { event.preventDefault(); focusRelative(event.currentTarget, selector, event.target as HTMLElement, 1) }
  if (event.key === 'ArrowUp') { event.preventDefault(); focusRelative(event.currentTarget, selector, event.target as HTMLElement, -1) }
  if (event.key === 'Home') { event.preventDefault(); focusEdge(event.currentTarget, selector, 'start') }
  if (event.key === 'End') { event.preventDefault(); focusEdge(event.currentTarget, selector, 'end') }
  if (event.key === 'Escape') { event.preventDefault(); onEscape?.() }
}

function toolbarKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
  const selector = '[data-roving="true"]:not(:disabled)'
  if (event.key === 'ArrowRight') { event.preventDefault(); focusRelative(event.currentTarget, selector, event.target as HTMLElement, 1) }
  if (event.key === 'ArrowLeft') { event.preventDefault(); focusRelative(event.currentTarget, selector, event.target as HTMLElement, -1) }
  if (event.key === 'Home') { event.preventDefault(); focusEdge(event.currentTarget, selector, 'start') }
  if (event.key === 'End') { event.preventDefault(); focusEdge(event.currentTarget, selector, 'end') }
}

export function CommandBar({ commands }: { commands: Command[] }) {
  const host = useRef<HTMLDivElement>(null)
  const overflowTrigger = useRef<HTMLButtonElement>(null)
  const overflowMenu = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(commands.length)
  const [overflowOpen, setOverflowOpen] = useState(false)

  useEffect(() => {
    const root = host.current
    if (!root) return
    const measure = () => {
      const maxButtons = Math.max(2, Math.floor(root.clientWidth / 88))
      setVisibleCount(maxButtons >= commands.length ? commands.length : Math.max(1, maxButtons - 1))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [commands.length])

  useEffect(() => {
    if (overflowOpen) requestAnimationFrame(() => overflowMenu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus())
  }, [overflowOpen])

  const shown = commands.slice(0, visibleCount)
  const overflow = commands.slice(visibleCount)
  const closeOverflow = () => { setOverflowOpen(false); requestAnimationFrame(() => overflowTrigger.current?.focus()) }

  return <div ref={host} className="commandbar" role="toolbar" aria-label="命令栏" onKeyDown={toolbarKeyDown}>{shown.map((command) => <button data-roving="true" key={command.label} disabled={command.disabled} className={command.primary ? 'primary' : ''} onClick={command.onClick}><span aria-hidden="true">{command.glyph}</span><b>{command.label}</b></button>)}{overflow.length > 0 && <span className="command-overflow-host"><button ref={overflowTrigger} data-roving="true" className="command-overflow-trigger" aria-haspopup="menu" aria-expanded={overflowOpen} aria-label="更多命令" onClick={() => setOverflowOpen((value) => !value)}><span aria-hidden="true">•••</span><b>更多</b></button>{overflowOpen && <><button className="command-overflow-scrim" aria-label="关闭更多命令" onClick={() => setOverflowOpen(false)} /><div ref={overflowMenu} className="command-overflow-menu" role="menu" onKeyDown={(event) => menuKeyDown(event, closeOverflow)}>{overflow.map((command) => <button key={command.label} role="menuitem" disabled={command.disabled} onClick={() => { command.onClick?.(); setOverflowOpen(false) }}><span aria-hidden="true">{command.glyph}</span><b>{command.label}</b></button>)}</div></>}</span>}</div>
}

export function AppBar({ commands, className = '' }: { commands: Command[]; className?: string }) {
  return <div className={`appbar ${className}`.trim()} role="toolbar" aria-label="应用栏" onKeyDown={toolbarKeyDown}>{commands.map((command, index) => <button data-roving="true" tabIndex={index === 0 ? 0 : -1} key={command.label} disabled={command.disabled} onClick={command.onClick}><span aria-hidden="true">{command.glyph}</span><b>{command.label}</b></button>)}</div>
}

export function EdgeAppBar({ open, onOpen, onClose, commands }: { open: boolean; onOpen: () => void; onClose: () => void; commands: Command[] }) {
  return <><button className="edge-appbar-hit" aria-label="打开底部应用栏" onPointerEnter={onOpen} onClick={onOpen} /><div className={`edge-appbar${open ? ' open' : ''}`} aria-hidden={!open} onPointerLeave={onClose}><AppBar commands={commands} /></div></>
}

export function Pivot<T extends string>({ tabs, value, onChange }: { tabs: Array<{ key: T; label: string }>; value: T; onChange: (value: T) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const activate = (index: number) => {
    const tab = tabs[index]
    if (!tab) return
    onChange(tab.key)
    requestAnimationFrame(() => root.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus())
  }
  return <div ref={root} className="pivot" role="tablist">{tabs.map((tab, index) => <button key={tab.key} role="tab" tabIndex={value === tab.key ? 0 : -1} aria-selected={value === tab.key} className={value === tab.key ? 'active' : ''} onClick={() => onChange(tab.key)} onKeyDown={(event) => { if (event.key === 'ArrowRight') { event.preventDefault(); activate((index + 1) % tabs.length) } if (event.key === 'ArrowLeft') { event.preventDefault(); activate((index - 1 + tabs.length) % tabs.length) } if (event.key === 'Home') { event.preventDefault(); activate(0) } if (event.key === 'End') { event.preventDefault(); activate(tabs.length - 1) } }}>{tab.label}</button>)}</div>
}

export function RadioButton({ checked, onChange, label, name, value, stopPropagation = false, disabled = false }: { checked: boolean; onChange: () => void; label?: ReactNode; name?: string; value?: string; stopPropagation?: boolean; disabled?: boolean }) {
  return <label className={`selector radio-selector${disabled ? ' disabled' : ''}`} onClick={(event) => stopPropagation && event.stopPropagation()}><input type="radio" checked={checked} disabled={disabled} name={name} value={value} onChange={onChange} /><span className="selector-mark" aria-hidden="true" />{label && <span className="selector-label">{label}</span>}</label>
}

export function ComboBox({ label, value, onChange, options, disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; disabled?: boolean }) {
  return <label className={`field-label${disabled ? ' disabled' : ''}`}>{label}<span className="select-shell"><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><i aria-hidden="true">⌄</i></span></label>
}

export function ToggleSwitch({ checked, onChange, label, detail, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; label: string; detail?: string; disabled?: boolean }) {
  return <label className={`setting-row${disabled ? ' disabled' : ''}`}><span><strong>{label}</strong>{detail && <small>{detail}</small>}</span><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><i className="switch" aria-hidden="true"><b /></i></label>
}

export function AutoSuggestBox({ value, onChange, suggestions, placeholder = '搜索', disabled = false }: { value: string; onChange: (value: string) => void; suggestions: string[]; placeholder?: string; disabled?: boolean }) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const matches = suggestions.filter((item) => item.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
  const choose = (item: string) => { onChange(item); setOpen(false); setActiveIndex(0) }
  const optionId = (index: number) => `${listId}-option-${index}`
  return <div className={`autosuggest${disabled ? ' disabled' : ''}`}><span className="autosuggest-input"><span aria-hidden="true">⌕</span><input value={value} disabled={disabled} placeholder={placeholder} aria-autocomplete="list" aria-expanded={!disabled && open && matches.length > 0} aria-controls={listId} aria-activedescendant={!disabled && open && matches[activeIndex] ? optionId(activeIndex) : undefined} onFocus={() => setOpen(true)} onChange={(event) => { onChange(event.target.value); setOpen(true); setActiveIndex(0) }} onKeyDown={(event) => { if (event.key === 'ArrowDown' && matches.length) { event.preventDefault(); setOpen(true); setActiveIndex((index) => (index + 1) % matches.length) } if (event.key === 'ArrowUp' && matches.length) { event.preventDefault(); setOpen(true); setActiveIndex((index) => (index - 1 + matches.length) % matches.length) } if (event.key === 'Enter' && open && matches[activeIndex]) { event.preventDefault(); choose(matches[activeIndex]!) } if (event.key === 'Escape') { setOpen(false); setActiveIndex(0) } }} /></span>{!disabled && open && value && matches.length > 0 && <div id={listId} className="autosuggest-menu" role="listbox">{matches.map((item, index) => <button id={optionId(index)} className={index === activeIndex ? 'active' : ''} key={item} role="option" aria-selected={index === activeIndex} tabIndex={-1} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(item)}>{item}</button>)}</div>}</div>
}

export function Flyout({ open, onClose, anchor, children }: { open: boolean; onClose: () => void; anchor: ReactNode; children: ReactNode }) {
  const host = useRef<HTMLSpanElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement
    requestAnimationFrame(() => host.current?.querySelector<HTMLElement>('.flyout [role="menuitem"]:not(:disabled),.flyout button:not(:disabled)')?.focus())
  }, [open])
  const close = () => { onClose(); requestAnimationFrame(() => returnFocus.current?.focus()) }
  return <span ref={host} className="flyout-anchor">{anchor}{open && <><button className="flyout-scrim" aria-label="关闭弹出菜单" onClick={close} /><div className="flyout" role="menu" onKeyDown={(event) => menuKeyDown(event, close)}>{children}</div></>}</span>
}

export function ContentDialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const titleId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus())
  }, [open])
  if (!open) return null
  const close = () => { onClose(); requestAnimationFrame(() => returnFocus.current?.focus()) }
  const trap = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); close(); return }
    if (event.key !== 'Tab') return
    const focusable = enabledElements(dialogRef.current, 'button:not(:disabled),input:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])')
    if (!focusable.length) return
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  return <div className="dialog-layer" role="presentation"><button className="dialog-scrim" aria-label="关闭对话框" onClick={close} /><section ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={trap}><h2 id={titleId}>{title}</h2><div>{children}</div><footer><button className="button accent" onClick={close}>确定</button><button className="button" onClick={close}>取消</button></footer></section></div>
}

export function SettingsPane({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return <div className="settings-layer"><button className="settings-scrim" aria-label="关闭设置面板" onClick={onClose} /><aside className="settings-pane" aria-label={title} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); onClose() } }}><header><button onClick={onClose} aria-label="返回">←</button><h2>{title}</h2></header>{children}</aside></div>
}

export function ContextMenu({ children, items }: { children: ReactNode; items: Array<{ label: string; onClick?: () => void; disabled?: boolean }> }) {
  const menuRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => { if (menu) requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()) }, [menu])
  const close = () => { setMenu(null); requestAnimationFrame(() => hostRef.current?.focus()) }
  const openAt = (x: number, y: number) => setMenu({ x: Math.min(x, Math.max(8, window.innerWidth - 230)), y: Math.min(y, Math.max(8, window.innerHeight - 220)) })
  const openFromKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    openAt(rect.left + 28, rect.top + 28)
  }
  return <div ref={hostRef} className="context-host" tabIndex={0} onKeyDown={openFromKeyboard} onContextMenu={(event) => { event.preventDefault(); openAt(event.clientX, event.clientY) }}>{children}{menu && <><button className="context-scrim" aria-label="关闭上下文菜单" onClick={close} /><div ref={menuRef} className="context-menu" role="menu" style={{ left: menu.x, top: menu.y }} onKeyDown={(event) => menuKeyDown(event, close)}>{items.map((item) => <button key={item.label} disabled={item.disabled} role="menuitem" onClick={() => { item.onClick?.(); setMenu(null) }}>{item.label}</button>)}</div></>}</div>
}

export function SplitView({ pane, children }: { pane: ReactNode; children: ReactNode }) {
  return <div className="split-view"><aside>{pane}</aside><section>{children}</section></div>
}

export function MasterDetailsView({ items, value, onChange, renderDetail }: { items: ListItem[]; value: string; onChange: (key: string) => void; renderDetail: (item: ListItem) => ReactNode }) {
  const current = items.find((item) => item.key === value) ?? items.find((item) => !item.disabled) ?? items[0]
  return <div className="master-details"><aside>{items.map((item) => <RadioButton key={item.key} name="master-details" value={item.key} disabled={item.disabled} checked={current?.key === item.key} onChange={() => onChange(item.key)} label={<span className="master-label"><strong>{item.title}</strong>{item.detail && <small>{item.detail}</small>}</span>} />)}</aside><section>{current && renderDetail(current)}</section></div>
}

export function SemanticZoom({ zoomedOut, onChange, overview, detail }: { zoomedOut: boolean; onChange: (value: boolean) => void; overview: ReactNode; detail: ReactNode }) {
  return <div className="semantic-zoom"><div className="semantic-toolbar"><button className="zoom-button" onClick={() => onChange(!zoomedOut)} aria-label={zoomedOut ? '放大查看磁贴' : '缩小查看分组'}>{zoomedOut ? '+' : '−'}</button></div>{zoomedOut ? overview : detail}</div>
}

export function RevealSurface({ children }: { children: ReactNode }) {
  return <div className="reveal-surface" onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const dx = event.clientX - (rect.left + rect.width / 2); const dy = event.clientY - (rect.top + rect.height / 2); event.currentTarget.style.setProperty('--reveal-angle', `${Math.atan2(dy, dx) * 180 / Math.PI + 90}deg`) }}>{children}</div>
}

export function AcrylicPane({ children }: { children: ReactNode }) {
  return <div className="acrylic-pane">{children}</div>
}

export function TeachingTip({ open, title, children, anchor, onClose }: { open: boolean; title: string; children: ReactNode; anchor: ReactNode; onClose: () => void }) {
  return <span className="teaching-anchor">{anchor}{open && <div className="teaching-tip" role="status"><button className="teaching-close" aria-label="关闭提示" onClick={onClose}>×</button><strong>{title}</strong><div>{children}</div></div>}</span>
}

export function CharmBar({ open, onOpen, onClose, onSelect }: { open: boolean; onOpen: () => void; onClose: () => void; onSelect: (command: string) => void }) {
  const commands = [{ key: 'search', glyph: '⌕', label: '搜索' }, { key: 'share', glyph: '↗', label: '共享' }, { key: 'start', glyph: '⊞', label: '开始' }, { key: 'devices', glyph: '▣', label: '设备' }, { key: 'settings', glyph: '⚙', label: '设置' }]
  return <><button className="edge-gesture" aria-label="打开超级按钮" onPointerEnter={onOpen} onClick={onOpen} /><aside className={`charm-bar${open ? ' open' : ''}`} aria-hidden={!open} onPointerLeave={onClose} onKeyDown={(event) => menuKeyDown(event, onClose)}>{commands.map((command, index) => <button key={command.key} tabIndex={open && index === 0 ? 0 : -1} onClick={() => onSelect(command.key)}><span aria-hidden="true">{command.glyph}</span><b>{command.label}</b></button>)}</aside></>
}

export function SnapView({ snapped, onChange }: { snapped: boolean; onChange: (value: boolean) => void }) {
  return <div className={`snap-demo${snapped ? ' snapped' : ''}`}><div className="snap-main"><h3>主视图</h3><p>宽屏时使用完整内容区域；Snap 后保留核心阅读与操作。</p></div><aside><button className="button" onClick={() => onChange(!snapped)}>{snapped ? '恢复完整视图' : '模拟 Snap View'}</button><p>{snapped ? '320px 级窄栏状态' : '拖到屏幕边缘时切换布局状态'}</p></aside></div>
}

export function Tile({ title, meta, glyph, wide, tone = 'blue', disabled = false }: { title: string; meta: string; glyph: string; wide?: boolean; tone?: 'blue' | 'green' | 'orange' | 'purple' | 'gray'; disabled?: boolean }) {
  return <button disabled={disabled} className={`tile tile--${tone}${wide ? ' tile--wide' : ''}`}><span className="tile__glyph" aria-hidden="true">{glyph}</span><span className="tile__copy"><strong>{title}</strong><small>{meta}</small></span></button>
}
