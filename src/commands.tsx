import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Command } from './components'
import { CommandIcon, commandIconFromGlyph, type CommandIconName } from './command-icons'
import { allocatePriorityIndices, useMeasuredItemWidths } from './measurement'

export type PriorityCommand = Omit<Command, 'glyph'> & {
  glyph?: string
  icon?: CommandIconName
  priority?: 'primary' | 'secondary'
}

type CommandFocusKey = number | '__more__'

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
  const measureRef = useRef<HTMLDivElement>(null)
  const overflowTrigger = useRef<HTMLButtonElement>(null)
  const overflowMenu = useRef<HTMLDivElement>(null)
  const firstEnabledIndex = Math.max(0, commands.findIndex((command) => !command.disabled))
  const [focusKey, setFocusKey] = useState<CommandFocusKey>(firstEnabledIndex)
  const [overflowOpen, setOverflowOpen] = useState(false)
  const signature = commands.map((command) => `${command.label}:${command.disabled ? 1 : 0}:${command.priority ?? 'primary'}:${command.icon ?? ''}:${command.glyph ?? ''}`).join('|')
  const priorities = useMemo(() => commands.map((command) => command.priority ?? 'primary'), [signature])
  const { widths, availableWidth } = useMeasuredItemWidths(host, measureRef, {
    selector: '[data-command-measure]',
    signature,
    hysteresis: 8,
    settleDelay: 120,
  })

  const visibleIndices = useMemo(() => {
    if (widths.length !== commands.length) return commands.map((_, index) => index)
    return allocatePriorityIndices(widths, availableWidth, priorities, { overflowReserve: 52, minVisible: 1 })
  }, [availableWidth, commands.length, priorities, widths])
  const visibleSet = useMemo(() => new Set(visibleIndices), [visibleIndices])
  const shown = commands.map((command, index) => ({ command, index })).filter(({ index }) => visibleSet.has(index))
  const overflow = commands.map((command, index) => ({ command, index })).filter(({ index }) => !visibleSet.has(index))
  const firstEnabledShown = shown.find(({ command }) => !command.disabled)
  const focusIsVisible = typeof focusKey === 'number' && visibleSet.has(focusKey) && !commands[focusKey]?.disabled
  const rovingKey: CommandFocusKey | null = focusIsVisible
    ? focusKey
    : focusKey === '__more__' && overflow.length > 0
      ? '__more__'
      : firstEnabledShown?.index ?? (overflow.length > 0 ? '__more__' : null)
  const visibleSignature = visibleIndices.join(',')

  useEffect(() => {
    if (!overflowOpen) return
    requestAnimationFrame(() => overflowMenu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus())
  }, [overflowOpen])

  useEffect(() => {
    if (overflow.length) return
    setOverflowOpen(false)
  }, [overflow.length])

  useEffect(() => {
    const root = host.current
    const toolbar = root?.querySelector<HTMLElement>('.priority-commandbar')
    const active = document.activeElement
    if (!root || !toolbar || !(active instanceof HTMLElement) || !toolbar.contains(active)) return

    if (typeof focusKey === 'number' && !visibleSet.has(focusKey)) {
      if (overflow.length > 0 && overflowTrigger.current) {
        setFocusKey('__more__')
        requestAnimationFrame(() => overflowTrigger.current?.focus())
        return
      }
      if (firstEnabledShown) {
        setFocusKey(firstEnabledShown.index)
        requestAnimationFrame(() => root.querySelector<HTMLButtonElement>(`[data-command-index="${firstEnabledShown.index}"]`)?.focus())
      }
      return
    }

    if (focusKey === '__more__' && overflow.length === 0 && firstEnabledShown) {
      setFocusKey(firstEnabledShown.index)
      requestAnimationFrame(() => root.querySelector<HTMLButtonElement>(`[data-command-index="${firstEnabledShown.index}"]`)?.focus())
    }
  }, [firstEnabledShown, focusKey, overflow.length, visibleSet, visibleSignature])

  const restoreToolbarFocus = () => {
    requestAnimationFrame(() => {
      if (overflowTrigger.current && overflow.length > 0) {
        setFocusKey('__more__')
        overflowTrigger.current.focus()
        return
      }
      if (!firstEnabledShown) return
      setFocusKey(firstEnabledShown.index)
      host.current?.querySelector<HTMLButtonElement>(`[data-command-index="${firstEnabledShown.index}"]`)?.focus()
    })
  }

  const closeOverflow = () => {
    setOverflowOpen(false)
    restoreToolbarFocus()
  }

  return <div ref={host} className="priority-command-shell">
    <div className="priority-commandbar" role="toolbar" aria-label="命令栏" aria-orientation="horizontal" onKeyDown={focusToolbar}>
      {shown.map(({ command, index }) => <button data-roving="true" data-command-index={index} key={`${command.label}-${index}`} className={`priority-command-action ${command.priority === 'secondary' ? 'secondary' : 'primary'}`} disabled={command.disabled} tabIndex={rovingKey === index ? 0 : -1} onFocus={() => setFocusKey(index)} onClick={command.onClick}><CommandGlyph command={command} /><b>{command.label}</b></button>)}
      {overflow.length > 0 && <span className="priority-command-overflow-host">
        <button ref={overflowTrigger} data-roving="true" className="priority-command-more" aria-label="更多命令" aria-haspopup="menu" aria-expanded={overflowOpen} tabIndex={rovingKey === '__more__' ? 0 : -1} onFocus={() => setFocusKey('__more__')} onClick={() => setOverflowOpen((value) => !value)}><span className="priority-command-icon" aria-hidden="true"><CommandIcon name="more" /></span></button>
        {overflowOpen && <><button className="priority-command-scrim" aria-label="关闭更多命令" onClick={closeOverflow} /><div ref={overflowMenu} className="priority-command-overflow" role="menu" onKeyDown={(event) => focusOverflow(event, closeOverflow)}>{overflow.map(({ command, index }) => <button key={`${command.label}-${index}`} role="menuitem" disabled={command.disabled} onClick={() => {
          command.onClick?.()
          const shouldRestore = overflowMenu.current?.contains(document.activeElement) ?? false
          setOverflowOpen(false)
          if (shouldRestore) restoreToolbarFocus()
        }}><CommandGlyph command={command} /><b>{command.label}</b></button>)}</div></>}
      </span>}
    </div>
    <div ref={measureRef} className="priority-command-measure" aria-hidden="true">{commands.map((command, index) => <span key={`${command.label}-${index}`} data-command-measure><CommandGlyph command={command} /><b>{command.label}</b></span>)}</div>
  </div>
}
