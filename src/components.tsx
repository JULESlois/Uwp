import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { CommandIcon, commandIconFromGlyph, type CommandIconName } from './command-icons'
import { runInternalSlide, runLayoutFlip, useLayerPresence } from './internal-motion'
import { menuKeyDown, toolbarKeyDown } from './focus-utils'
import { trapModalFocus, useFocusReturn } from './focus-lifecycle'
import { Button } from './button'
import { RadioButton } from './selectors'
import { getPivotNavigationTarget } from './pivot-navigation'
export { Flyout, TeachingTip } from './anchored-surfaces'
export { ComboBox, type ComboBoxOption, type ComboBoxProps } from './combobox'
export { RadioButton, ToggleSwitch, type RadioButtonProps, type ToggleSwitchProps } from './selectors'

export type NavItem<T extends string> = { key: T; glyph: string; label: string }
export type PaneMode = 'auto' | 'compact' | 'expanded'
export type Command = { label: string; glyph?: string; icon?: CommandIconName; onClick?: () => void; primary?: boolean; disabled?: boolean }
export type ListItem = { key: string; title: string; detail?: string; glyph?: string; disabled?: boolean }

function CommandVisual({ command, className = 'command-icon-slot' }: { command: Pick<Command, 'glyph' | 'icon'>; className?: string }) {
  const icon = command.icon ?? commandIconFromGlyph(command.glyph)
  return <span className={className} aria-hidden="true">{icon ? <CommandIcon name={icon} /> : <span className="command-icon-fallback">{command.glyph}</span>}</span>
}

export type CommandBarProps = {
  commands: Command[]
  ariaLabel?: string
  overflowLabel?: string
  overflowCloseLabel?: string
}

export function CommandBar({
  commands,
  ariaLabel = '命令栏',
  overflowLabel = '更多命令',
  overflowCloseLabel = '关闭更多命令',
}: CommandBarProps) {
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
  const firstEnabledIndex = shown.findIndex((command) => !command.disabled)
  const overflowIsTabStop = firstEnabledIndex < 0 && overflow.length > 0
  const closeOverflow = () => { setOverflowOpen(false); requestAnimationFrame(() => overflowTrigger.current?.focus()) }

  return <div ref={host} className="commandbar" role="toolbar" aria-label={ariaLabel} onKeyDown={toolbarKeyDown}>
    {shown.map((command, index) => <button data-roving="true" tabIndex={index === firstEnabledIndex ? 0 : -1} key={command.label} disabled={command.disabled} className={command.primary ? 'primary' : ''} onClick={command.onClick}><CommandVisual command={command} /><b>{command.label}</b></button>)}
    {overflow.length > 0 && <span className="command-overflow-host">
      <button ref={overflowTrigger} data-roving="true" tabIndex={overflowIsTabStop ? 0 : -1} className="command-overflow-trigger" aria-haspopup="menu" aria-expanded={overflowOpen} aria-label={overflowLabel} onClick={() => setOverflowOpen((value) => !value)}><span className="command-icon-slot" aria-hidden="true"><CommandIcon name="more" /></span><b>更多</b></button>
      {overflowOpen && <><button className="command-overflow-scrim" aria-label={overflowCloseLabel} onClick={() => setOverflowOpen(false)} /><div ref={overflowMenu} className="command-overflow-menu" role="menu" onKeyDown={(event) => menuKeyDown(event, closeOverflow)}>{overflow.map((command) => <button key={command.label} role="menuitem" disabled={command.disabled} onClick={() => { command.onClick?.(); setOverflowOpen(false) }}><CommandVisual command={command} /><b>{command.label}</b></button>)}</div></>}
    </span>}
  </div>
}

export type AppBarProps = {
  commands: Command[]
  className?: string
  ariaLabel?: string
}

export function AppBar({ commands, className = '', ariaLabel = '应用栏' }: AppBarProps) {
  const firstEnabledIndex = commands.findIndex((command) => !command.disabled)
  return <div className={`appbar ${className}`.trim()} role="toolbar" aria-label={ariaLabel} onKeyDown={toolbarKeyDown}>{commands.map((command, index) => <button data-roving="true" tabIndex={index === firstEnabledIndex ? 0 : -1} key={command.label} disabled={command.disabled} onClick={command.onClick}><CommandVisual command={command} className="appbar-icon" /><b>{command.label}</b></button>)}</div>
}

export function EdgeAppBar({ open, onOpen, onClose, commands }: { open: boolean; onOpen: () => void; onClose: () => void; commands: Command[] }) {
  return <><button className="edge-appbar-hit" aria-label="打开底部应用栏" onPointerEnter={onOpen} onClick={onOpen} /><div className={`edge-appbar${open ? ' open' : ''}`} aria-hidden={!open} onPointerLeave={onClose}><AppBar commands={commands} /></div></>
}

export function Pivot<T extends string>({ tabs, value, onChange }: { tabs: Array<{ key: T; label: string }>; value: T; onChange: (value: T) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const rootElement = root.current
    const indicator = indicatorRef.current
    if (!rootElement || !indicator) return

    const updateIndicator = () => {
      const active = rootElement.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')
      if (!active) {
        indicator.style.opacity = '0'
        return
      }
      const rootRect = rootElement.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      indicator.style.width = `${activeRect.width}px`
      indicator.style.transform = `translate3d(${activeRect.left - rootRect.left}px,0,0)`
      indicator.style.opacity = '1'
      if (!indicator.dataset.ready) requestAnimationFrame(() => { indicator.dataset.ready = 'true' })
    }

    updateIndicator()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateIndicator)
    observer.observe(rootElement)
    return () => observer.disconnect()
  }, [tabs.length, value])

  const change = (index: number, directionHint?: 'forward' | 'backward') => {
    const tab = tabs[index]
    if (!tab || tab.key === value) return
    const currentIndex = Math.max(0, tabs.findIndex((candidate) => candidate.key === value))
    const direction = directionHint ?? (index > currentIndex ? 'forward' : 'backward')
    const sibling = root.current?.nextElementSibling
    const panel = sibling instanceof HTMLElement ? sibling : null
    runInternalSlide(panel, 'pivot-content', direction, () => onChange(tab.key))
  }

  const activate = (index: number, direction: 'forward' | 'backward') => {
    change(index, direction)
    requestAnimationFrame(() => root.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus())
  }

  return <div ref={root} className="pivot" role="tablist">
    {tabs.map((tab, index) => <button key={tab.key} role="tab" tabIndex={value === tab.key ? 0 : -1} aria-selected={value === tab.key} className={value === tab.key ? 'active' : ''} onClick={() => change(index)} onKeyDown={(event) => {
      const target = getPivotNavigationTarget(index, tabs.length, event.key)
      if (!target) return
      event.preventDefault()
      activate(target.index, target.direction)
    }}>{tab.label}</button>)}
    <span ref={indicatorRef} className="pivot-indicator" aria-hidden="true" />
  </div>
}

export function AutoSuggestBox({ value, onChange, suggestions, placeholder = '搜索', disabled = false }: { value: string; onChange: (value: string) => void; suggestions: string[]; placeholder?: string; disabled?: boolean }) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const matches = suggestions.filter((item) => item.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
  const choose = (item: string) => { onChange(item); setOpen(false); setActiveIndex(0) }
  const optionId = (index: number) => `${listId}-option-${index}`

  return <div className={`autosuggest${disabled ? ' disabled' : ''}`}><span className="autosuggest-input"><span className="autosuggest-command-icon" aria-hidden="true"><CommandIcon name="search" /></span><input value={value} disabled={disabled} placeholder={placeholder} aria-autocomplete="list" aria-expanded={!disabled && open && matches.length > 0} aria-controls={listId} aria-activedescendant={!disabled && open && matches[activeIndex] ? optionId(activeIndex) : undefined} onFocus={() => setOpen(true)} onChange={(event) => { onChange(event.target.value); setOpen(true); setActiveIndex(0) }} onKeyDown={(event) => {
    if (event.key === 'ArrowDown' && matches.length) { event.preventDefault(); setOpen(true); setActiveIndex((index) => (index + 1) % matches.length) }
    if (event.key === 'ArrowUp' && matches.length) { event.preventDefault(); setOpen(true); setActiveIndex((index) => (index - 1 + matches.length) % matches.length) }
    if (event.key === 'Enter' && open && matches[activeIndex]) { event.preventDefault(); choose(matches[activeIndex]!) }
    if (event.key === 'Escape') { setOpen(false); setActiveIndex(0) }
  }} /></span>{!disabled && open && value && matches.length > 0 && <div id={listId} className="autosuggest-menu" role="listbox">{matches.map((item, index) => <button id={optionId(index)} className={index === activeIndex ? 'active' : ''} key={item} role="option" aria-selected={index === activeIndex} tabIndex={-1} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(item)}>{item}</button>)}</div>}</div>
}

export type ContentDialogProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  primaryButtonText?: ReactNode
  secondaryButtonText?: ReactNode
  primaryButtonDisabled?: boolean
  secondaryButtonDisabled?: boolean
  onPrimaryButtonClick?: () => void
  onSecondaryButtonClick?: () => void
}

export function ContentDialog({
  open,
  title,
  children,
  onClose,
  primaryButtonText = '确定',
  secondaryButtonText = '取消',
  primaryButtonDisabled = false,
  secondaryButtonDisabled = false,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
}: ContentDialogProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const presence = useLayerPresence(open)
  useFocusReturn(open, dialogRef)

  if (!presence.mounted) return null
  const close = () => onClose()
  const runAction = (action?: () => void) => {
    action?.()
    close()
  }
  const trap = (event: ReactKeyboardEvent<HTMLElement>) => { if (open) trapModalFocus(event, dialogRef.current, close) }

  return <div className={`dialog-layer internal-layer${open ? ' active' : ''}${presence.entered ? ' entered' : ''}`} role="presentation" aria-hidden={!open}><button className="dialog-scrim" aria-label="关闭对话框" tabIndex={open ? 0 : -1} onClick={close} /><section ref={dialogRef} className="dialog" role="dialog" aria-modal={open || undefined} aria-labelledby={titleId} onKeyDown={trap} onTransitionEnd={(event) => { if (event.target !== dialogRef.current || event.propertyName !== 'transform' || open) return; presence.finishExit() }}><h2 id={titleId}>{title}</h2><div>{children}</div><footer>{primaryButtonText != null && <Button variant="accent" tabIndex={open ? 0 : -1} disabled={primaryButtonDisabled} onClick={() => runAction(onPrimaryButtonClick)}>{primaryButtonText}</Button>}{secondaryButtonText != null && <Button tabIndex={open ? 0 : -1} disabled={secondaryButtonDisabled} onClick={() => runAction(onSecondaryButtonClick)}>{secondaryButtonText}</Button>}</footer></section></div>
}

export function SettingsPane({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const paneRef = useRef<HTMLElement>(null)
  const presence = useLayerPresence(open)
  useFocusReturn(open, paneRef)

  if (!presence.mounted) return null
  const trap = (event: ReactKeyboardEvent<HTMLElement>) => { if (open) trapModalFocus(event, paneRef.current, onClose) }

  return <div className={`settings-layer internal-layer${open ? ' active' : ''}${presence.entered ? ' entered' : ''}`} aria-hidden={!open}><button className="settings-scrim" aria-label="关闭设置面板" tabIndex={open ? 0 : -1} onClick={onClose} /><aside ref={paneRef} className="settings-pane" aria-label={title} onKeyDown={trap} onTransitionEnd={(event) => { if (event.target !== paneRef.current || event.propertyName !== 'transform' || open) return; presence.finishExit() }}><header><button className="settings-pane-back" tabIndex={open ? 0 : -1} onClick={onClose} aria-label="返回"><span className="settings-back-icon" aria-hidden="true"><CommandIcon name="back" /></span></button><h2>{title}</h2></header>{children}</aside></div>
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
  const detailRef = useRef<HTMLElement>(null)
  const current = items.find((item) => item.key === value) ?? items.find((item) => !item.disabled) ?? items[0]

  const select = (item: ListItem) => {
    if (item.disabled || item.key === current?.key) return
    const currentIndex = Math.max(0, items.findIndex((candidate) => candidate.key === current?.key))
    const nextIndex = items.findIndex((candidate) => candidate.key === item.key)
    const direction = nextIndex > currentIndex ? 'forward' : 'backward'
    runInternalSlide(detailRef.current, 'master-detail', direction, () => onChange(item.key))
  }

  return <div className="master-details"><aside>{items.map((item) => <RadioButton key={item.key} name="master-details" value={item.key} disabled={item.disabled} checked={current?.key === item.key} onChange={() => select(item)} label={<span className="master-label"><strong>{item.title}</strong>{item.detail && <small>{item.detail}</small>}</span>} />)}</aside><section ref={detailRef}>{current && renderDetail(current)}</section></div>
}

export function SemanticZoom({ zoomedOut, onChange, overview, detail }: { zoomedOut: boolean; onChange: (value: boolean) => void; overview: ReactNode; detail: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null)
  const toggle = () => {
    const next = !zoomedOut
    runInternalSlide(contentRef.current, 'semantic-zoom-content', zoomedOut ? 'forward' : 'backward', () => onChange(next))
  }

  return <div className="semantic-zoom"><div className="semantic-toolbar"><button className="zoom-button" onClick={toggle} aria-label={zoomedOut ? '放大查看磁贴' : '缩小查看分组'}>{zoomedOut ? '+' : '−'}</button></div><div ref={contentRef} className="semantic-zoom-content">{zoomedOut ? overview : detail}</div></div>
}

export function RevealSurface({ children }: { children: ReactNode }) {
  return <div className="reveal-surface" onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); const dx = event.clientX - (rect.left + rect.width / 2); const dy = event.clientY - (rect.top + rect.height / 2); event.currentTarget.style.setProperty('--reveal-angle', `${Math.atan2(dy, dx) * 180 / Math.PI + 90}deg`) }}>{children}</div>
}

export function AcrylicPane({ children }: { children: ReactNode }) {
  return <div className="acrylic-pane">{children}</div>
}

export function CharmBar({ open, onOpen, onClose, onSelect }: { open: boolean; onOpen: () => void; onClose: () => void; onSelect: (command: string) => void }) {
  const commands: Array<{ key: string; icon: CommandIconName; label: string }> = [{ key: 'search', icon: 'search', label: '搜索' }, { key: 'share', icon: 'share', label: '共享' }, { key: 'start', icon: 'start', label: '开始' }, { key: 'devices', icon: 'devices', label: '设备' }, { key: 'settings', icon: 'settings', label: '设置' }]
  return <><button className="edge-gesture" aria-label="打开超级按钮" onPointerEnter={onOpen} onClick={onOpen} /><aside className={`charm-bar${open ? ' open' : ''}`} aria-hidden={!open} onPointerLeave={onClose} onKeyDown={(event) => menuKeyDown(event, onClose)}>{commands.map((command, index) => <button key={command.key} tabIndex={open && index === 0 ? 0 : -1} onClick={() => onSelect(command.key)}><span className="charm-icon" aria-hidden="true"><CommandIcon name={command.icon} /></span><b>{command.label}</b></button>)}</aside></>
}

export function SnapView({ snapped, onChange }: { snapped: boolean; onChange: (value: boolean) => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const toggle = () => runLayoutFlip(rootRef.current, () => onChange(!snapped))
  return <div ref={rootRef} className={`snap-demo${snapped ? ' snapped' : ''}`}><div className="snap-main" data-flip-key="main"><h3>主视图</h3><p>宽屏时使用完整内容区域；Snap 后保留核心阅读与操作。</p></div><aside data-flip-key="aside"><Button onClick={toggle}>{snapped ? '恢复完整视图' : '模拟 Snap View'}</Button><p>{snapped ? '320px 级窄栏状态' : '拖到屏幕边缘时切换布局状态'}</p></aside></div>
}

export function Tile({ title, meta, glyph, wide, tone = 'blue', disabled = false }: { title: string; meta: string; glyph: string; wide?: boolean; tone?: 'blue' | 'green' | 'orange' | 'purple' | 'gray'; disabled?: boolean }) {
  return <button disabled={disabled} className={`tile tile--${tone}${wide ? ' tile--wide' : ''}`}><span className="tile__glyph" aria-hidden="true">{glyph}</span><span className="tile__copy"><strong>{title}</strong><small>{meta}</small></span></button>
}
