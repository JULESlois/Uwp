import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'

export type NavItem<T extends string> = { key: T; glyph: string; label: string }
export type PaneMode = 'auto' | 'compact' | 'expanded'

type FocusableElement = HTMLButtonElement | HTMLDivElement

function enabledElements(root: HTMLElement | null, selector: string) {
  if (!root) return [] as HTMLElement[]
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-disabled') !== 'true')
}

function focusRelative(root: HTMLElement | null, selector: string, current: HTMLElement, delta: number) {
  const items = enabledElements(root, selector)
  if (!items.length) return
  const currentIndex = Math.max(0, items.indexOf(current))
  const nextIndex = (currentIndex + delta + items.length) % items.length
  items[nextIndex]?.focus()
}

function focusEdge(root: HTMLElement | null, selector: string, edge: 'start' | 'end') {
  const items = enabledElements(root, selector)
  const target = edge === 'start' ? items[0] : items[items.length - 1]
  target?.focus()
}

function menuKeyDown(event: ReactKeyboardEvent<HTMLElement>, onEscape?: () => void) {
  const root = event.currentTarget
  const selector = '[role="menuitem"]:not(:disabled),[role="option"]:not(:disabled),button:not(:disabled)'
  if (event.key === 'ArrowDown') { event.preventDefault(); focusRelative(root, selector, event.target as HTMLElement, 1) }
  if (event.key === 'ArrowUp') { event.preventDefault(); focusRelative(root, selector, event.target as HTMLElement, -1) }
  if (event.key === 'Home') { event.preventDefault(); focusEdge(root, selector, 'start') }
  if (event.key === 'End') { event.preventDefault(); focusEdge(root, selector, 'end') }
  if (event.key === 'Escape') { event.preventDefault(); onEscape?.() }
}

function toolbarKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
  const selector = '[data-roving="true"]:not(:disabled)'
  if (event.key === 'ArrowRight') { event.preventDefault(); focusRelative(event.currentTarget, selector, event.target as HTMLElement, 1) }
  if (event.key === 'ArrowLeft') { event.preventDefault(); focusRelative(event.currentTarget, selector, event.target as HTMLElement, -1) }
  if (event.key === 'Home') { event.preventDefault(); focusEdge(event.currentTarget, selector, 'start') }
  if (event.key === 'End') { event.preventDefault(); focusEdge(event.currentTarget, selector, 'end') }
}

export function NavigationView<T extends string>({ items, value, onChange, mode = 'auto' }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void; mode?: PaneMode }) {
  const navRef = useRef<HTMLElement>(null)
  const [focusKey, setFocusKey] = useState<T>(value)
  useEffect(() => setFocusKey(value), [value])
  const move = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number, delta: number) => {
    event.preventDefault()
    const nextIndex = Math.max(0, Math.min(items.length - 1, index + delta))
    const next = items[nextIndex]
    if (!next) return
    setFocusKey(next.key)
    requestAnimationFrame(() => navRef.current?.querySelectorAll<HTMLButtonElement>('nav button')[nextIndex]?.focus())
  }
  const edge = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    event.preventDefault()
    const next = items[index]
    if (!next) return
    setFocusKey(next.key)
    requestAnimationFrame(() => navRef.current?.querySelectorAll<HTMLButtonElement>('nav button')[index]?.focus())
  }
  return <aside ref={navRef} className={`nav nav--${mode}`} data-mode={mode} aria-label="主导航"><div className="nav__brand"><span aria-hidden="true">▦</span><strong>UWP LAB</strong></div><nav>{items.map((item, index) => <button key={item.key} tabIndex={focusKey === item.key ? 0 : -1} className={value === item.key ? 'active' : ''} aria-current={value === item.key ? 'page' : undefined} onFocus={() => setFocusKey(item.key)} onClick={() => { setFocusKey(item.key); onChange(item.key) }} onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowRight') move(event, index, 1); if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') move(event, index, -1); if (event.key === 'Home') edge(event, 0); if (event.key === 'End') edge(event, items.length - 1) }}><span aria-hidden="true">{item.glyph}</span><b>{item.label}</b></button>)}</nav></aside>
}

export type Command = { label: string; glyph: string; onClick?: () => void; primary?: boolean; disabled?: boolean }

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
    if (!overflowOpen) return
    requestAnimationFrame(() => overflowMenu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus())
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

export function CheckBox({ checked, onChange, label, ariaLabel, stopPropagation = false, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; label?: ReactNode; ariaLabel?: string; stopPropagation?: boolean; disabled?: boolean }) {
  return <label className={`selector checkbox-selector${disabled ? ' disabled' : ''}`} onClick={(event) => stopPropagation && event.stopPropagation()}><input type="checkbox" checked={checked} disabled={disabled} aria-label={ariaLabel} onChange={(event) => onChange(event.target.checked)} /><span className="selector-mark" aria-hidden="true">✓</span>{label && <span className="selector-label">{label}</span>}</label>
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
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const matches = suggestions.filter((item) => item.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
  const choose = (item: string) => { onChange(item); setOpen(false); setActiveIndex(0) }
  return <div className={`autosuggest${disabled ? ' disabled' : ''}`}><span className="autosuggest-input"><span aria-hidden="true">⌕</span><input value={value} disabled={disabled} placeholder={placeholder} aria-autocomplete="list" aria-expanded={!disabled && open && matches.length > 0} aria-controls="autosuggest-options" aria-activedescendant={!disabled && open && matches[activeIndex] ? `autosuggest-${activeIndex}` : undefined} onFocus={() => setOpen(true)} onChange={(event) => { onChange(event.target.value); setOpen(true); setActiveIndex(0) }} onKeyDown={(event) => { if (event.key === 'ArrowDown' && matches.length) { event.preventDefault(); setOpen(true); setActiveIndex((index) => (index + 1) % matches.length) } if (event.key === 'ArrowUp' && matches.length) { event.preventDefault(); setOpen(true); setActiveIndex((index) => (index - 1 + matches.length) % matches.length) } if (event.key === 'Enter' && open && matches[activeIndex]) { event.preventDefault(); choose(matches[activeIndex]) } if (event.key === 'Escape') { setOpen(false); setActiveIndex(0) } }} /></span>{!disabled && open && value && matches.length > 0 && <div id="autosuggest-options" className="autosuggest-menu" role="listbox">{matches.map((item, index) => <button id={`autosuggest-${index}`} className={index === activeIndex ? 'active' : ''} key={item} role="option" aria-selected={index === activeIndex} tabIndex={-1} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(item)}>{item}</button>)}</div>}</div>
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
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  return <div className="dialog-layer" role="presentation"><button className="dialog-scrim" aria-label="关闭对话框" onClick={close} /><section ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onKeyDown={trap}><h2 id="dialog-title">{title}</h2><div>{children}</div><footer><button className="button accent" onClick={close}>确定</button><button className="button" onClick={close}>取消</button></footer></section></div>
}

export function SettingsPane({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return <div className="settings-layer"><button className="settings-scrim" aria-label="关闭设置面板" onClick={onClose} /><aside className="settings-pane" aria-label={title}><header><button onClick={onClose} aria-label="返回">←</button><h2>{title}</h2></header>{children}</aside></div>
}

export function ContextMenu({ children, items }: { children: ReactNode; items: Array<{ label: string; onClick?: () => void; disabled?: boolean }> }) {
  const menuRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => { if (menu) requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()) }, [menu])
  const close = () => { setMenu(null); requestAnimationFrame(() => hostRef.current?.focus()) }
  const openFromKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    setMenu({ x: rect.left + 28, y: rect.top + 28 })
  }
  return <div ref={hostRef} className="context-host" tabIndex={0} onKeyDown={openFromKeyboard} onContextMenu={(event) => { event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY }) }}>{children}{menu && <><button className="context-scrim" aria-label="关闭上下文菜单" onClick={close} /><div ref={menuRef} className="context-menu" role="menu" style={{ left: menu.x, top: menu.y }} onKeyDown={(event) => menuKeyDown(event, close)}>{items.map((item) => <button key={item.label} disabled={item.disabled} role="menuitem" onClick={() => { item.onClick?.(); setMenu(null) }}>{item.label}</button>)}</div></>}</div>
}

export type ListItem = { key: string; title: string; detail?: string; glyph?: string; disabled?: boolean }

function initialFocusableKey(items: ListItem[], preferred: string[]) {
  return preferred.find((key) => items.some((item) => item.key === key && !item.disabled)) ?? items.find((item) => !item.disabled)?.key ?? ''
}

function nextEnabledIndex(items: ListItem[], start: number, delta: number) {
  let index = start + delta
  while (index >= 0 && index < items.length) {
    if (!items[index]?.disabled) return index
    index += delta
  }
  return start
}

export function ListView({ items, selected, onSelectionChange }: { items: ListItem[]; selected: string[]; onSelectionChange: (keys: string[]) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const [focusKey, setFocusKey] = useState(() => initialFocusableKey(items, selected))
  useEffect(() => { if (!items.some((item) => item.key === focusKey && !item.disabled)) setFocusKey(initialFocusableKey(items, selected)) }, [items, selected, focusKey])
  const toggle = (item: ListItem) => { if (item.disabled) return; onSelectionChange(selected.includes(item.key) ? selected.filter((key) => key !== item.key) : [...selected, item.key]) }
  const focusIndex = (index: number) => {
    const item = items[index]
    if (!item || item.disabled) return
    setFocusKey(item.key)
    requestAnimationFrame(() => root.current?.querySelectorAll<HTMLElement>('.list-row')[index]?.focus())
  }
  return <div ref={root} className="list-view" role="listbox" aria-multiselectable="true">{items.map((item, index) => { const active = selected.includes(item.key); return <div key={item.key} role="option" tabIndex={!item.disabled && focusKey === item.key ? 0 : -1} aria-disabled={item.disabled || undefined} aria-selected={active} className={`list-row${active ? ' selected' : ''}${item.disabled ? ' disabled' : ''}`} onFocus={() => !item.disabled && setFocusKey(item.key)} onClick={() => toggle(item)} onKeyDown={(event) => { if (!item.disabled && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); toggle(item) } if (event.key === 'ArrowDown') { event.preventDefault(); focusIndex(nextEnabledIndex(items, index, 1)) } if (event.key === 'ArrowUp') { event.preventDefault(); focusIndex(nextEnabledIndex(items, index, -1)) } if (event.key === 'Home') { event.preventDefault(); focusIndex(items.findIndex((candidate) => !candidate.disabled)) } if (event.key === 'End') { event.preventDefault(); const reversed = [...items].reverse().findIndex((candidate) => !candidate.disabled); if (reversed >= 0) focusIndex(items.length - 1 - reversed) } }}><CheckBox checked={active} disabled={item.disabled} onChange={() => toggle(item)} ariaLabel={`选择 ${item.title}`} stopPropagation />{item.glyph && <span className="list-glyph" aria-hidden="true">{item.glyph}</span>}<span className="list-copy"><strong>{item.title}</strong>{item.detail && <small>{item.detail}</small>}</span></div> })}</div>
}

export function GridView({ items, selected, onSelectionChange }: { items: ListItem[]; selected: string[]; onSelectionChange: (keys: string[]) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const [focusKey, setFocusKey] = useState(() => initialFocusableKey(items, selected))
  useEffect(() => { if (!items.some((item) => item.key === focusKey && !item.disabled)) setFocusKey(initialFocusableKey(items, selected)) }, [items, selected, focusKey])
  const toggle = (item: ListItem) => { if (item.disabled) return; onSelectionChange(selected.includes(item.key) ? selected.filter((key) => key !== item.key) : [...selected, item.key]) }
  const focusIndex = (index: number) => {
    const item = items[index]
    if (!item || item.disabled) return
    setFocusKey(item.key)
    requestAnimationFrame(() => root.current?.querySelectorAll<HTMLElement>('.grid-item')[index]?.focus())
  }
  const gridMove = (index: number, delta: number) => {
    let next = index + delta
    while (next >= 0 && next < items.length && items[next]?.disabled) next += Math.sign(delta)
    if (next >= 0 && next < items.length) focusIndex(next)
  }
  return <div ref={root} className="grid-view" role="listbox" aria-multiselectable="true">{items.map((item, index) => { const active = selected.includes(item.key); return <div className={`grid-item${active ? ' selected' : ''}${item.disabled ? ' disabled' : ''}`} key={item.key} role="option" aria-disabled={item.disabled || undefined} aria-selected={active} tabIndex={!item.disabled && focusKey === item.key ? 0 : -1} onFocus={() => !item.disabled && setFocusKey(item.key)} onClick={() => toggle(item)} onKeyDown={(event) => { const columns = Math.max(1, getComputedStyle(root.current ?? event.currentTarget).gridTemplateColumns.split(' ').filter(Boolean).length); if (!item.disabled && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); toggle(item) } if (event.key === 'ArrowRight') { event.preventDefault(); gridMove(index, 1) } if (event.key === 'ArrowLeft') { event.preventDefault(); gridMove(index, -1) } if (event.key === 'ArrowDown') { event.preventDefault(); gridMove(index, columns) } if (event.key === 'ArrowUp') { event.preventDefault(); gridMove(index, -columns) } if (event.key === 'Home') { event.preventDefault(); const first = items.findIndex((candidate) => !candidate.disabled); if (first >= 0) focusIndex(first) } if (event.key === 'End') { event.preventDefault(); const reversed = [...items].reverse().findIndex((candidate) => !candidate.disabled); if (reversed >= 0) focusIndex(items.length - 1 - reversed) } }}><CheckBox checked={active} disabled={item.disabled} onChange={() => toggle(item)} ariaLabel={`选择 ${item.title}`} stopPropagation /><span className="grid-glyph" aria-hidden="true">{item.glyph ?? '□'}</span><strong>{item.title}</strong><small>{item.detail}</small></div> })}</div>
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
  return <div className="reveal-surface" onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const dx = event.clientX - (rect.left + rect.width / 2); const dy = event.clientY - (rect.top + rect.height / 2); const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90; event.currentTarget.style.setProperty('--reveal-angle', `${angle}deg`) }}>{children}</div>
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
