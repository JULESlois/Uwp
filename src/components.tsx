import { useState, type ReactNode } from 'react'

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

export function ToggleSwitch({ checked, onChange, label, detail }: { checked: boolean; onChange: (value: boolean) => void; label: string; detail?: string }) {
  return <label className="setting-row"><span><strong>{label}</strong>{detail && <small>{detail}</small>}</span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><i className="switch" aria-hidden="true"><b /></i></label>
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
  return <div className="list-view" role="listbox" aria-multiselectable="true">{items.map((item) => <button key={item.key} role="option" aria-selected={selected.includes(item.key)} className={selected.includes(item.key) ? 'selected' : ''} onClick={() => toggle(item.key)}><i aria-hidden="true">{selected.includes(item.key) ? '✓' : ''}</i>{item.glyph && <span className="list-glyph" aria-hidden="true">{item.glyph}</span>}<span><strong>{item.title}</strong>{item.detail && <small>{item.detail}</small>}</span></button>)}</div>
}

export function SplitView({ pane, children }: { pane: ReactNode; children: ReactNode }) {
  return <div className="split-view"><aside>{pane}</aside><section>{children}</section></div>
}

export function SemanticZoom({ zoomedOut, onChange, overview, detail }: { zoomedOut: boolean; onChange: (value: boolean) => void; overview: ReactNode; detail: ReactNode }) {
  return <div className="semantic-zoom"><div className="semantic-toolbar"><button className="zoom-button" onClick={() => onChange(!zoomedOut)} aria-label={zoomedOut ? '放大查看磁贴' : '缩小查看分组'}>{zoomedOut ? '+' : '−'}</button></div>{zoomedOut ? overview : detail}</div>
}

export function RevealSurface({ children }: { children: ReactNode }) {
  return <div className="reveal-surface" onPointerMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty('--reveal-x', `${event.clientX - rect.left}px`); event.currentTarget.style.setProperty('--reveal-y', `${event.clientY - rect.top}px`) }}>{children}</div>
}

export function AcrylicPane({ children }: { children: ReactNode }) {
  return <div className="acrylic-pane">{children}</div>
}

export function Tile({ title, meta, glyph, wide, tone = 'blue' }: { title: string; meta: string; glyph: string; wide?: boolean; tone?: 'blue' | 'green' | 'orange' | 'purple' | 'gray' }) {
  return <button className={`tile tile--${tone}${wide ? ' tile--wide' : ''}`}><span className="tile__glyph" aria-hidden="true">{glyph}</span><span className="tile__copy"><strong>{title}</strong><small>{meta}</small></span></button>
}
