import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { NavigationView, type NavItem, type PaneMode } from './components'

export type NavigationPaneMode = PaneMode | 'overlay'

export function AdaptiveNavigationView<T extends string>({ items, value, onChange, mode = 'auto' }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void; mode?: NavigationPaneMode }) {
  if (mode !== 'overlay') return <NavigationView items={items} value={value} onChange={onChange} mode={mode} />
  return <OverlayNavigationView items={items} value={value} onChange={onChange} />
}

function OverlayNavigationView<T extends string>({ items, value, onChange }: { items: NavItem<T>[]; value: T; onChange: (value: T) => void }) {
  const [open, setOpen] = useState(false)
  const paneRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => paneRef.current?.querySelector<HTMLButtonElement>('nav button[aria-current="page"],nav button')?.focus())
  }, [open])

  const move = (event: ReactKeyboardEvent<HTMLElement>, delta: number) => {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('nav button'))
    const current = document.activeElement as HTMLButtonElement
    const index = Math.max(0, buttons.indexOf(current))
    const next = buttons[(index + delta + buttons.length) % buttons.length]
    if (next) { event.preventDefault(); next.focus() }
  }

  const close = () => { setOpen(false); requestAnimationFrame(() => toggleRef.current?.focus()) }
  const paneKey = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); close() }
    if (event.key === 'ArrowDown') move(event, 1)
    if (event.key === 'ArrowUp') move(event, -1)
    if (event.key === 'Home') { event.preventDefault(); event.currentTarget.querySelector<HTMLButtonElement>('nav button')?.focus() }
    if (event.key === 'End') { event.preventDefault(); const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('nav button'); buttons[buttons.length - 1]?.focus() }
  }

  const choose = (key: T) => { onChange(key); setOpen(false) }

  return <div className="adaptive-overlay-nav"><aside className="overlay-rail" aria-label="主导航"><button ref={toggleRef} className="overlay-toggle" aria-label="打开导航窗格" aria-expanded={open} onClick={() => setOpen((value) => !value)}><span aria-hidden="true">☰</span></button><nav>{items.map((item) => <button key={item.key} className={value === item.key ? 'active' : ''} aria-current={value === item.key ? 'page' : undefined} aria-label={item.label} onClick={() => choose(item.key)}><span aria-hidden="true">{item.glyph}</span></button>)}</nav></aside>{open && <button className="overlay-nav-scrim" aria-label="关闭导航窗格" onClick={close} />}<aside ref={paneRef} className={`overlay-pane${open ? ' open' : ''}`} aria-hidden={!open} aria-label="展开导航" onKeyDown={paneKey}><header><button aria-label="收起导航窗格" onClick={close}>←</button><strong>UWP LAB</strong></header><nav>{items.map((item) => <button key={item.key} className={value === item.key ? 'active' : ''} aria-current={value === item.key ? 'page' : undefined} tabIndex={open ? 0 : -1} onClick={() => choose(item.key)}><span aria-hidden="true">{item.glyph}</span><b>{item.label}</b></button>)}</nav></aside></div>
}
