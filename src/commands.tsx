import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Command } from './components'
import { CommandIcon, commandIconFromGlyph, type CommandIconName } from './command-icons'

export type PriorityCommand = Omit<Command, 'glyph'> & {
  glyph?: string
  icon?: CommandIconName
  priority?: 'primary' | 'secondary'
}

function iconFor(command: PriorityCommand) {
  return command.icon ?? commandIconFromGlyph(command.glyph)
}

function focusToolbar(event: ReactKeyboardEvent<HTMLDivElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-roving="true"]:not(:disabled)'))
  if (!buttons.length) return
  event.preventDefault()
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
  if (event.key === 'Home') buttons[0]?.focus()
  else if (event.key === 'End') buttons[buttons.length - 1]?.focus()
  else {
    const delta = event.key === 'ArrowRight' ? 1 : -1
    buttons[(Math.max(0, current) + delta + buttons.length) % buttons.length]?.focus()
  }
}

function focusOverflow(event: ReactKeyboardEvent<HTMLDivElement>, onEscape: () => void) {
  if (event.key === 'Escape') {
    event.preventDefault()
    onEscape()
    return
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'))
  if (!buttons.length) return
  event.preventDefault()
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
  if (event.key === 'Home') buttons[0]?.focus()
  else if (event.key === 'End') buttons[buttons.length - 1]?.focus()
  else {
    const delta = event.key === 'ArrowDown' ? 1 : -1
    buttons[(Math.max(0, current) + delta + buttons.length) % buttons.length]?.focus()
  }
}

function CommandGlyph({ command }: { command: PriorityCommand }) {
  const icon = iconFor(command)
  return <span className="priority-command-icon" aria-hidden="true">{icon ? <CommandIcon name={icon} /> : <span className="priority-command-fallback">{command.glyph}</span>}</span>
}

export function PriorityCommandBar({ commands }: { commands: PriorityCommand[] }) {
  const ranked = [...commands.filter((command) => command.priority !== 'secondary'), ...commands.filter((command) => command.priority === 'secondary')]
  const host = useRef<HTMLDivElement>(null)
  const overflowTrigger = useRef<HTMLButtonElement>(null)
  const overflowMenu = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(ranked.length)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const signature = ranked.map((command) => `${command.label}:${command.disabled ? 1 : 0}`).join('|')

  useEffect(() => {
    const root = host.current
    if (!root) return
    const measure = () => {
      const widths = Array.from(root.querySelectorAll<HTMLElement>('[data-command-measure]')).map((item) => item.offsetWidth)
      const total = widths.reduce((sum, width) => sum + width, 0)
      const available = root.clientWidth
      if (!widths.length || total <= available) {
        setVisibleCount(ranked.length)
        return
      }
      const overflowReserve = 52
      let used = 0
      let count = 0
      for (const width of widths) {
        if (used + width > Math.max(0, available - overflowReserve)) break
        used += width
        count += 1
      }
      setVisibleCount(Math.max(1, count))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [ranked.length, signature])

  useEffect(() => {
    if (!overflowOpen) return
    requestAnimationFrame(() => overflowMenu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus())
  }, [overflowOpen])

  useEffect(() => {
    if (visibleCount >= ranked.length) setOverflowOpen(false)
  }, [visibleCount, ranked.length])

  const shown = ranked.slice(0, visibleCount)
  const overflow = ranked.slice(visibleCount)
  const closeOverflow = () => {
    setOverflowOpen(false)
    requestAnimationFrame(() => overflowTrigger.current?.focus())
  }

  return <div ref={host} className="priority-command-shell">
    <div className="priority-commandbar" role="toolbar" aria-label="命令栏" onKeyDown={focusToolbar}>
      {shown.map((command) => <button data-roving="true" key={command.label} className="priority-command-action" disabled={command.disabled} onClick={command.onClick}><CommandGlyph command={command} /><b>{command.label}</b></button>)}
      {overflow.length > 0 && <span className="priority-command-overflow-host">
        <button ref={overflowTrigger} data-roving="true" className="priority-command-more" aria-label="更多命令" aria-haspopup="menu" aria-expanded={overflowOpen} onClick={() => setOverflowOpen((value) => !value}><span className="priority-command-icon" aria-hidden="true"><CommandIcon name="more" /></span></button>
        {overflowOpen && <><button className="priority-command-scrim" aria-label="关闭更多命令" onClick={closeOverflow} /><div ref={overflowMenu} className="priority-command-overflow" role="menu" onKeyDown={(event) => focusOverflow(event, closeOverflow)}>{overflow.map((command) => <button key={command.label} role="menuitem" disabled={command.disabled} onClick={() => { command.onClick?.(); setOverflowOpen(false) }}><CommandGlyph command={command} /><b>{command.label}</b></button>)}</div></>}
      </span>}
    </div>
    <div className="priority-command-measure" aria-hidden="true">{ranked.map((command) => <span key={command.label} data-command-measure><CommandGlyph command={command} /><b>{command.label}</b></span>)}</div>
  </div>
}
