import { useState, type KeyboardEvent, type ReactNode } from 'react'

export type NavItem<T extends string> = { key: T; glyph: string; label: string }

export function NavigationView<T extends string>({ items, value, onChange }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void }) {
  return <aside className="nav" aria-label="主导航"><div className="nav__brand"><span aria-hidden="true">▦</span><strong>UWP LAB</strong></div><nav>{items.map((item) => <button key={item.key} className={value === item.key ? 'active' : ''} aria-current={value === item.key ? 'page' : undefined} onClick={() => onChange(item.key)}><span aria-hidden="true">{item.glyph}</span><b>{item.label}</b></button>)}</nav></aside>
}

export type Command = { label: string; glyph: string; onClick?: () => void; primary?: boolean }
export function CommandBar({ commands }: { commands: Command[] }) {
  return <div className="commandbar" role="toolbar" aria-label="命令栏">{commands.map((command) => <button key={command.label} className={command.primary ? 'primary' : ''} onClick={command.onClick}><span aria-hidden="true">{command.glyph}</span><b>{command.label}</b></button>)}</div>
}

export function AppBar({ commands }: { commands: Command[] }) {
  return <div className="appbar" role="toolbar" aria-label="应用栏">{commands.map((command) => <button key={command.label} onClick={command.onClick}><span aria-hidden="true">{command.glyph}</span><b>{command.label}</b></button>)}</div>
}

export function Pivot<T extends string>({ tabs, value, onChange }: { tabs: Array<{ key: T; label: string }>; value: T; onChange: (value: T) => void }) {
  return <div className="pivot" role="tablist">{tabs.map((tab) => <button key={tab.key} role="tab" aria-selected={value === tab.key} className={value === tab.key ? 'active' : ''} onClick={() => onChange(tab.key)}>{tab.label}</button>)}</div>
}

export function CheckBox({ checked, onChange, label, ariaLabel, stopPropagation = false }: { checked: boolean; onChange: (value: boolean) => void; label?: ReactNode; ariaLabel?: string; stopPropagation?: boolean }) {
  return <label className="selector checkbox-selector" onClick={(event) => stopPropagation && event.stopPropagation()}><input type="checkbox" checked={checked} aria-label={ariaLabel} onChange={(event) => onChange(event.target.checked)} /><span className="selector-mark" aria-hidden="true">✓</span>{label && <span className="selector-label">{label}</span>}</label>
}

export function RadioButton({ checked, onChange, label, name, value, stopPropagation = false }: { checked: boolean; onChange: () => void; label?: ReactNode; name?: string; value?: string; stopPropagation?: boolean }) {
  return <label className="selector radio-selector" onClick={(event) => stopPropagation && event.stopPropagation()}><input type="radio" checked={checked} name={name} value={value} onChange={onChange} /><span className="selector-mark" aria-hidden="true" />{label && <span className="selector-label">{label}</span>}</label>
}

export function ComboBox({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="field-label">{label}<span className="select-shell"><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><i aria-hidden="true">⌄</i></span></label>
}

export function ToggleSwitch({ checked, onChange, label, detail }: { checked: boolean; onChange: (value: boolean) => void; label: string; detail?: string }) {
  return <label className="setting-row"><span><strong>{label}</strong>{detail && <small>{detail}</small>}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><i className="switch" aria-hidden="true"><b /></i></label>
}

export function AutoSuggestBox({ value, onChange, suggestions, placeholder = '搜索' }: { value: string; onChange: (value: string) => void; suggestions: string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const matches = suggestions.filter((item) => item.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
  return <div className="autosuggest"><span className="autosuggest-input"><span aria-hidden="true">⌕</span><input value={value} placeholder={placeholder} onFocus={() => setOpen(true)} onChange={(event) => { onChange(event.target.value); setOpen(true) }} /></span>{open && value && matches.length > 0 && <div className="autosuggest-menu" role="listbox">{matches.map((item) => <button key={item} role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(item); setOpen(false) }}>{item}</button>)}</div>}</div>
}

export function Flyout({ open, onClose, anchor, children }: { open: boolean; onClose: () => void; anchor: ReactNode; children: ReactNode }) {
  return <span className="flyout-anchor">{anchor}{open && <><button className="flyout-scrim" aria-label="关闭弹出菜单" onClick={onClose} /><div className="flyout" role="menu">{children}</div></>}</span>
}

export function ContentDialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null
  return <div className="dialog-layer" role="presentation"><button className="dialog-scrim" aria-label="关闭对话框" onClick={onClose} /><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">{title}</h2><div>{children}</div><footer><button className="button accent" onClick={onClose}>确定</button><button className="button" onClick={onClose}>取消</button></footer></section></div>
}

export function SettingsPane({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return <div className="settings-layer"><button className="settings-scrim" aria-label="关闭设置面板" onClick={onClose} /><aside className="settings-pane" aria-label={title}><header><button onClick={onClose} aria-label="返回">←</button><h2>{title}</h2></header>{children}</aside></div>
}

export function ContextMenu({ children, items }: { children: ReactNode; items: Array<{ label: string; onClick?: () => void }> }) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  return <div className="context-host" onContextMenu={(event) => { event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY }) }}>{children}{menu && <><button className="context-scrim" aria-label="关闭上下文菜单" onClick={() => setMenu(null)} /><div className="context-menu" role="menu" style={{ left: menu.x, top: menu.y }}>{items.map((item) => <button key={item.label} role="menuitem" onClick={() => { item.onClick?.(); setMenu(null) }}>{item.label}</button>)}</div></>}</div>
}

export type ListItem = { key: string; title: string; detail?: string; glyph?: string }
export function ListView({ items, selected, onSelectionChange }: { items: ListItem[]; selected: string[]; onSelectionChange: (keys: string[]) => void }) {
  const toggle = (key: string) => onSelectionChange(selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key])
  const onKey = (event: KeyboardEvent<HTMLDivElement>, key: string) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(key) } }
  return <div className="list-view" role="listbox" aria-multiselectable="true">{items.map((item) => { const active = selected.includes(item.key); return <div key={item.key} role="option" tabIndex={0} aria-selected={active} className={`list-row${active ? ' selected' : ''}`} onClick={() => toggle(item.key)} onKeyDown={(event) => onKey(event, item.key)}><CheckBox checked={active} onChange={() => toggle(item.key)} ariaLabel={`选择 ${item.title}`} stopPropagation />{item.glyph && <span className="list-glyph" aria-hidden="true">{item.glyph}</span>}<span className="list-copy"><strong>{item.title}</strong>{item.detail && <small>{item.detail}</small>}</span></div> })}</div>
}

export function GridView({ items, selected, onSelectionChange }: { items: ListItem[]; selected: string[]; onSelectionChange: (keys: string[]) => void }) {
  const toggle = (key: string) => onSelectionChange(selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key])
  return <div className="grid-view" role="listbox" aria-multiselectable="true">{items.map((item) => { const active = selected.includes(item.key); return <div className={`grid-item${active ? ' selected' : ''}`} key={item.key} role="option" aria-selected={active} tabIndex={0} onClick={() => toggle(item.key)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(item.key) } }}><CheckBox checked={active} onChange={() => toggle(item.key)} ariaLabel={`选择 ${item.title}`} stopPropagation /><span className="grid-glyph" aria-hidden="true">{item.glyph ?? '□'}</span><strong>{item.title}</strong><small>{item.detail}</small></div> })}</div>
}

export function SplitView({ pane, children }: { pane: ReactNode; children: ReactNode }) {
  return <div className="split-view"><aside>{pane}</aside><section>{children}</section></div>
}

export function MasterDetailsView({ items, value, onChange, renderDetail }: { items: ListItem[]; value: string; onChange: (key: string) => void; renderDetail: (item: ListItem) => ReactNode }) {
  const current = items.find((item) => item.key === value) ?? items[0]
  return <div className="master-details"><aside>{items.map((item) => <RadioButton key={item.key} name="master-details" value={item.key} checked={current?.key === item.key} onChange={() => onChange(item.key)} label={<span className="master-label"><strong>{item.title}</strong>{item.detail && <small>{item.detail}</small>}</span>} />)}</aside><section>{current && renderDetail(current)}</section></div>
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
  return <><button className="edge-gesture" aria-label="打开超级按钮" onPointerEnter={onOpen} onClick={onOpen} /><aside className={`charm-bar${open ? ' open' : ''}`} aria-hidden={!open} onPointerLeave={onClose}>{commands.map((command) => <button key={command.key} onClick={() => onSelect(command.key)}><span aria-hidden="true">{command.glyph}</span><b>{command.label}</b></button>)}</aside></>
}

export function SnapView({ snapped, onChange }: { snapped: boolean; onChange: (value: boolean) => void }) {
  return <div className={`snap-demo${snapped ? ' snapped' : ''}`}><div className="snap-main"><h3>主视图</h3><p>宽屏时使用完整内容区域；Snap 后保留核心阅读与操作。</p></div><aside><button className="button" onClick={() => onChange(!snapped)}>{snapped ? '恢复完整视图' : '模拟 Snap View'}</button><p>{snapped ? '320px 级窄栏状态' : '拖到屏幕边缘时切换布局状态'}</p></aside></div>
}

export function Tile({ title, meta, glyph, wide, tone = 'blue' }: { title: string; meta: string; glyph: string; wide?: boolean; tone?: 'blue' | 'green' | 'orange' | 'purple' | 'gray' }) {
  return <button className={`tile tile--${tone}${wide ? ' tile--wide' : ''}`}><span className="tile__glyph" aria-hidden="true">{glyph}</span><span className="tile__copy"><strong>{title}</strong><small>{meta}</small></span></button>
}
