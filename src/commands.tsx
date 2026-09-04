import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Command } from './components'
import { CommandIcon, commandIconFromGlyph, type CommandIconName } from './command-icons'
import { useStableElementWidth } from './measurement'

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
  const host = useRef<HTMLDivElement>(null)
  const overflowTrigger = useRef<HTMLButtonElement>(null)
  const overflowMenu = useRef<HTMLDivElement>(null)
  const [visibleIndices, setVisibleIndices] = useState<number[]>(() => commands.map((_, index) => index))
  const [overflowOpen, setOverflowOpen] = useState(false)
  const signature = commands.map((command) => `${command.label}:${command.disabled ? 1 : 0}:${command.priority ?? 'primary'}:${command.icon ?? ''}:${command.glyph ?? ''}`).join('|')
  const stableWidth = useStableElementWidth(host, { hysteresis: 8, settleDelay: 120 })

  useEffect(() => {
    const root = host.current
    if (!root) return
    const widths = Array.from(root.querySelectorAll<HTMLElement>('[data-command-measure]')).map((item) => item.offsetWidth)
    const allIndices = commands.map((_, index) => index)
    const total = widths.reduce((sum, width) => sum + width, 0)
    const available = stableWidth || root.clientWidth
    if (!widths.length || total <= available) {
      setVisibleIndices(allIndices)
      return
    }

    const overflowReserve = 52
    const budget = Math.max(0, available - overflowReserve)
    const visible = new Set(allIndices)
    let used = total

    const removeUntilFit = (indices: number[]) => {
      for (const index of indices) {
        if (used <= budget || visible.size <= 1) break
        if (!visible.has(index)) continue
        visible.delete(index)
        used -= widths[index] ?? 0
      }
    }

    removeUntilFit(allIndices.filter((index) => commands[index]?.priority === 'secondary').reverse())
    removeUntilFit(allIndices.filter((index) => visible.has(index)).reverse())
    setVisibleIndices(allIndices.filter((index) => visible.has(index)))
  }, [commands.length, signature, stableWidth])

  useEffect(() => {
    if (!overflowOpen) return
    requestAnimationFrame(() => overflowMenu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus())
  }, [overflowOpen])

  const visibleSet = useMemo(() => new Set(visibleIndices), [visibleIndices])
  const shown = commands.map((command, index) => ({ command, index })).filter(({ index }) => visibleSet.has(index))
  const overflow = commands.map((command, index) => ({ command, index })).filter(({ index }) => !visibleSet.has(index))

  useEffect(() => {
    if (!overflow.length) setOverflowOpen(false)
  }, [overflow.length])

  const closeOverflow = () => {
    setOverflowOpen(false)
    requestAnimationFrame(() => overflowTrigger.current?.focus())
  }

  return <div ref={host} className="priority-command-shell">
    <div className="priority-commandbar" role="toolbar" aria-label="命令栏" onKeyDown={focusToolbar}>
      {shown.map(({ command, index }) => <button data-roving="true" key={`${command.label}-${index}`} className={`priority-command-action ${command.priority === 'secondary' ? 'secondary' : 'primary'}`} disabled={command.disabled} onClick={command.onClick}><CommandGlyph command={command} /><b>{command.label}</b></button>)}
      {overflow.length > 0 && <span className="priority-command-overflow-host">
        <button ref={overflowTrigger} data-roving="true" className="priority-command-more" aria-label="更多命令" aria-haspopup="menu" aria-expanded={overflowOpen} onClick={() => setOverflowOpen((value) => !value)}><span className="priority-command-icon" aria-hidden="true"><CommandIcon name="more" /></span></button>
        {overflowOpen && <><button className="priority-command-scrim" aria-label="关闭更多命令" onClick={closeOverflow} /><div ref={overflowMenu} className="priority-command-overflow" role="menu" onKeyDown={(event) => focusOverflow(event, closeOverflow)}>{overflow.map(({ command, index }) => <button key={`${command.label}-${index}`} role="menuitem" disabled={command.disabled} onClick={() => { command.onClick?.(); setOverflowOpen(false) }}><CommandGlyph command={command} /><b>{command.label}</b></button>)}</div></>}
      </span>}
    </div>
    <div className="priority-command-measure" aria-hidden="true">{commands.map((command, index) => <span key={`${command.label}-${index}`} data-command-measure><CommandGlyph command={command} /><b>{command.label}</b></span>)}</div>
  </div>
}
