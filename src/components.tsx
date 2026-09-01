import type { ReactNode } from 'react'

export type NavItem<T extends string> = { key: T; glyph: string; label: string }

export function NavigationView<T extends string>({ items, value, onChange }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void }) {
  return (
    <aside className="nav" aria-label="主导航">
      <div className="nav__brand"><span aria-hidden="true">▦</span><strong>UWP LAB</strong></div>
      <nav>{items.map((item) => <button key={item.key} className={value === item.key ? 'active' : ''} aria-current={value === item.key ? 'page' : undefined} onClick={() => onChange(item.key)}><span aria-hidden="true">{item.glyph}</span><b>{item.label}</b></button>)}</nav>
    </aside>
  )
}

export type Command = { label: string; glyph: string; onClick?: () => void; primary?: boolean }
export function CommandBar({ commands }: { commands: Command[] }) {
  return <div className="commandbar" role="toolbar" aria-label="命令栏">{commands.map((command, index) => <button key={command.label} className={command.primary ? 'primary' : ''} onClick={command.onClick}><span aria-hidden="true">{command.glyph}</span><b>{command.label}</b>{index === commands.length - 2 && <i aria-hidden="true" />}</button>)}</div>
}

export function Pivot<T extends string>({ tabs, value, onChange }: { tabs: Array<{ key: T; label: string }>; value: T; onChange: (value: T) => void }) {
  return <div className="pivot" role="tablist">{tabs.map((tab) => <button key={tab.key} role="tab" aria-selected={value === tab.key} className={value === tab.key ? 'active' : ''} onClick={() => onChange(tab.key)}>{tab.label}</button>)}</div>
}

export function ToggleSwitch({ checked, onChange, label, detail }: { checked: boolean; onChange: (value: boolean) => void; label: string; detail: string }) {
  return <label className="setting-row"><span><strong>{label}</strong><small>{detail}</small></span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><i className="switch" aria-hidden="true"><b /></i></label>
}

export function Flyout({ open, onClose, anchor, children }: { open: boolean; onClose: () => void; anchor: ReactNode; children: ReactNode }) {
  return <span className="flyout-anchor">{anchor}{open && <><button className="flyout-scrim" aria-label="关闭弹出菜单" onClick={onClose} /><div className="flyout" role="menu">{children}</div></>}</span>
}

export function ContentDialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null
  return <div className="dialog-layer" role="presentation"><button className="dialog-scrim" aria-label="关闭对话框" onClick={onClose} /><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h2 id="dialog-title">{title}</h2><div>{children}</div><footer><button className="button accent" onClick={onClose}>确定</button><button className="button" onClick={onClose}>取消</button></footer></section></div>
}

export function Tile({ title, meta, glyph, wide, tone = 'blue' }: { title: string; meta: string; glyph: string; wide?: boolean; tone?: 'blue' | 'green' | 'orange' | 'purple' | 'gray' }) {
  return <button className={`tile tile--${tone}${wide ? ' tile--wide' : ''}`}><span className="tile__glyph" aria-hidden="true">{glyph}</span><span className="tile__copy"><strong>{title}</strong><small>{meta}</small></span></button>
}
