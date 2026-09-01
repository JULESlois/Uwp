import { useEffect, useRef, useState, type DragEvent as ReactDragEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { RadioButton, type ListItem } from './components'
import { CheckBox } from './selectors'

export type SelectionMode = 'none' | 'single' | 'multiple' | 'extended'

type CollectionProps = {
  items: ListItem[]
  selected: string[]
  onSelectionChange: (keys: string[]) => void
  selectionMode?: SelectionMode
  onItemInvoked?: (item: ListItem) => void
  reorderable?: boolean
  onReorder?: (items: ListItem[]) => void
  layout?: 'list' | 'grid'
}

type Marquee = { left: number; top: number; width: number; height: number }
type DropTarget = { key: string; after: boolean }

function firstEnabled(items: ListItem[]) {
  return items.find((item) => !item.disabled)?.key ?? ''
}

function rangeKeys(items: ListItem[], fromKey: string, toKey: string) {
  const from = items.findIndex((item) => item.key === fromKey)
  const to = items.findIndex((item) => item.key === toKey)
  if (from < 0 || to < 0) return [toKey]
  const start = Math.min(from, to)
  const end = Math.max(from, to)
  return items.slice(start, end + 1).filter((item) => !item.disabled).map((item) => item.key)
}

function nextEnabledIndex(items: ListItem[], start: number, delta: number) {
  let index = start + delta
  while (index >= 0 && index < items.length) {
    if (!items[index]?.disabled) return index
    index += Math.sign(delta)
  }
  return start
}

function adjacentOutsideIndex(items: ListItem[], keys: string[], direction: -1 | 1) {
  const indices = keys.map((key) => items.findIndex((item) => item.key === key)).filter((index) => index >= 0)
  if (!indices.length) return -1
  let index = direction < 0 ? Math.min(...indices) - 1 : Math.max(...indices) + 1
  while (index >= 0 && index < items.length) {
    const item = items[index]
    if (item && !item.disabled && !keys.includes(item.key)) return index
    index += direction
  }
  return -1
}

export function CollectionView({ items, selected, onSelectionChange, selectionMode = 'extended', onItemInvoked, reorderable = false, onReorder, layout = 'list' }: CollectionProps) {
  const root = useRef<HTMLDivElement>(null)
  const anchor = useRef<string>(selected[0] ?? firstEnabled(items))
  const marqueeStart = useRef<{ x: number; y: number; rootLeft: number; rootTop: number } | null>(null)
  const marqueeBase = useRef<string[]>([])
  const swipeStart = useRef<{ key: string; x: number; y: number } | null>(null)
  const suppressClickKey = useRef<string | null>(null)
  const [focusKey, setFocusKey] = useState(selected.find((key) => items.some((item) => item.key === key && !item.disabled)) ?? firstEnabled(items))
  const [draggedKeys, setDraggedKeys] = useState<string[]>([])
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [marquee, setMarquee] = useState<Marquee | null>(null)
  const [swipedKey, setSwipedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!items.some((item) => item.key === focusKey && !item.disabled)) setFocusKey(firstEnabled(items))
  }, [items, focusKey])

  const focusIndex = (index: number) => {
    const item = items[index]
    if (!item || item.disabled) return
    setFocusKey(item.key)
    requestAnimationFrame(() => root.current?.querySelectorAll<HTMLElement>('.collection-item')[index]?.focus())
  }

  const selectItem = (item: ListItem, modifiers?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }) => {
    if (item.disabled || selectionMode === 'none') return
    const additive = Boolean(modifiers?.ctrlKey || modifiers?.metaKey)
    if (selectionMode === 'single') {
      anchor.current = item.key
      onSelectionChange([item.key])
      return
    }
    if (selectionMode === 'multiple') {
      anchor.current = item.key
      onSelectionChange(selected.includes(item.key) ? selected.filter((key) => key !== item.key) : [...selected, item.key])
      return
    }
    if (modifiers?.shiftKey) {
      const range = rangeKeys(items, anchor.current || item.key, item.key)
      onSelectionChange(additive ? Array.from(new Set([...selected, ...range])) : range)
      return
    }
    anchor.current = item.key
    if (additive) onSelectionChange(selected.includes(item.key) ? selected.filter((key) => key !== item.key) : [...selected, item.key])
    else onSelectionChange([item.key])
  }

  const moveItems = (keys: string[], toKey: string, after = false) => {
    if (!reorderable || !keys.length || keys.includes(toKey)) return
    const moving = items.filter((item) => keys.includes(item.key))
    if (!moving.length) return
    const remaining = items.filter((item) => !keys.includes(item.key))
    const target = remaining.findIndex((item) => item.key === toKey)
    if (target < 0) return
    const insertAt = target + (after ? 1 : 0)
    const next = [...remaining]
    next.splice(insertAt, 0, ...moving)
    onReorder?.(next)
    anchor.current = moving[0]?.key ?? anchor.current
    setFocusKey(moving[0]?.key ?? focusKey)
  }

  const dragKeysFor = (item: ListItem) => {
    const multiMode = selectionMode === 'multiple' || selectionMode === 'extended'
    if (multiMode && selected.includes(item.key) && selected.length > 1) {
      return items.filter((candidate) => selected.includes(candidate.key) && !candidate.disabled).map((candidate) => candidate.key)
    }
    return [item.key]
  }

  const dragStart = (event: ReactDragEvent<HTMLDivElement>, item: ListItem) => {
    if (!reorderable || item.disabled) return
    const keys = dragKeysFor(item)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', JSON.stringify(keys))
    setDraggedKeys(keys)
  }

  const beginMarquee = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.target !== event.currentTarget || (selectionMode !== 'multiple' && selectionMode !== 'extended')) return
    const rect = event.currentTarget.getBoundingClientRect()
    marqueeStart.current = { x: event.clientX, y: event.clientY, rootLeft: rect.left, rootTop: rect.top }
    marqueeBase.current = event.ctrlKey || event.metaKey ? selected : []
    if (!(event.ctrlKey || event.metaKey)) onSelectionChange([])
    setSwipedKey(null)
    setMarquee({ left: event.clientX - rect.left, top: event.clientY - rect.top, width: 0, height: 0 })
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveMarquee = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = marqueeStart.current
    const host = root.current
    if (!start || !host) return
    const leftClient = Math.min(start.x, event.clientX)
    const rightClient = Math.max(start.x, event.clientX)
    const topClient = Math.min(start.y, event.clientY)
    const bottomClient = Math.max(start.y, event.clientY)
    setMarquee({ left: leftClient - start.rootLeft, top: topClient - start.rootTop, width: rightClient - leftClient, height: bottomClient - topClient })
    const hits = Array.from(host.querySelectorAll<HTMLElement>('.collection-item')).flatMap((element, index) => {
      const item = items[index]
      if (!item || item.disabled) return []
      const rect = element.getBoundingClientRect()
      const intersects = rect.left < rightClient && rect.right > leftClient && rect.top < bottomClient && rect.bottom > topClient
      return intersects ? [item.key] : []
    })
    onSelectionChange(Array.from(new Set([...marqueeBase.current, ...hits])))
  }

  const endMarquee = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!marqueeStart.current) return
    marqueeStart.current = null
    setMarquee(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const beginSwipe = (event: ReactPointerEvent<HTMLDivElement>, item: ListItem) => {
    const target = event.target as HTMLElement
    if (layout !== 'list' || event.pointerType === 'mouse' || target.closest?.('.collection-selector,.reorder-grip,.swipe-action')) return
    swipeStart.current = { key: item.key, x: event.clientX, y: event.clientY }
  }

  const moveSwipe = (event: ReactPointerEvent<HTMLDivElement>, item: ListItem) => {
    const start = swipeStart.current
    if (!start || start.key !== item.key) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < Math.abs(dy) + 10) return
    if (dx < -44) { setSwipedKey(item.key); suppressClickKey.current = item.key }
    if (dx > 24) { setSwipedKey(null); suppressClickKey.current = item.key }
  }

  const endSwipe = () => { swipeStart.current = null }

  const renderSelector = (item: ListItem, active: boolean) => {
    if (selectionMode === 'none') return null
    if (selectionMode === 'single') return <span className="collection-selector"><RadioButton checked={active} disabled={item.disabled} onChange={() => selectItem(item)} name={`collection-${layout}`} value={item.key} stopPropagation /></span>
    return <span className="collection-selector"><CheckBox checked={active} disabled={item.disabled} onChange={() => selectItem(item, { ctrlKey: true })} ariaLabel={`选择 ${item.title}`} stopPropagation /></span>
  }

  return <div ref={root} className={`collection-view collection-${layout}`} data-selection-mode={selectionMode} role="listbox" aria-multiselectable={selectionMode === 'multiple' || selectionMode === 'extended' ? true : undefined} onPointerDown={beginMarquee} onPointerMove={moveMarquee} onPointerUp={endMarquee} onPointerCancel={endMarquee}>{items.map((item, index) => {
    const active = selected.includes(item.key)
    const dragging = draggedKeys.includes(item.key)
    const rowClass = `collection-item${active ? ' selected' : ''}${item.disabled ? ' disabled' : ''}${dragging ? ' dragging' : ''}${swipedKey === item.key ? ' swiped' : ''}${dropTarget?.key === item.key ? (dropTarget.after ? ' drop-after' : ' drop-before') : ''}`
    const itemContent = <div className="collection-item-content"><span className="reorder-grip" aria-hidden="true" data-enabled={reorderable && !item.disabled} />{renderSelector(item, active)}{item.glyph && <span className="collection-glyph" aria-hidden="true">{item.glyph}</span>}<span className="collection-copy"><strong>{item.title}</strong>{item.detail && <small>{item.detail}</small>}</span>{dragging && draggedKeys.length > 1 && <span className="drag-count" aria-hidden="true">{draggedKeys.length}</span>}</div>
    return <div key={item.key} className={rowClass} role="option" aria-selected={selectionMode === 'none' ? undefined : active} aria-disabled={item.disabled || undefined} tabIndex={!item.disabled && focusKey === item.key ? 0 : -1} draggable={reorderable && !item.disabled} onFocus={() => !item.disabled && setFocusKey(item.key)} onClick={(event: ReactMouseEvent<HTMLDivElement>) => {
      if (suppressClickKey.current === item.key) { suppressClickKey.current = null; return }
      if (swipedKey === item.key) { setSwipedKey(null); return }
      if (selectionMode === 'none') onItemInvoked?.(item)
      else selectItem(item, event)
    }} onDoubleClick={() => !item.disabled && onItemInvoked?.(item)} onPointerDown={(event) => beginSwipe(event, item)} onPointerMove={(event) => moveSwipe(event, item)} onPointerUp={endSwipe} onPointerCancel={endSwipe} onDragStart={(event) => dragStart(event, item)} onDragEnd={() => { setDraggedKeys([]); setDropTarget(null) }} onDragOver={(event) => {
      if (!reorderable || item.disabled || draggedKeys.includes(item.key)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      const rect = event.currentTarget.getBoundingClientRect()
      setDropTarget({ key: item.key, after: event.clientY > rect.top + rect.height / 2 })
    }} onDrop={(event) => {
      event.preventDefault()
      let keys = draggedKeys
      if (!keys.length) {
        try { keys = JSON.parse(event.dataTransfer.getData('text/plain')) as string[] } catch { keys = [] }
      }
      if (keys.length) moveItems(keys, item.key, dropTarget?.key === item.key ? dropTarget.after : false)
      setDraggedKeys([])
      setDropTarget(null)
    }} onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
      const columns = layout === 'grid' ? Math.max(1, getComputedStyle(root.current ?? event.currentTarget).gridTemplateColumns.split(' ').filter(Boolean).length) : 1
      const movingKeys = selected.includes(item.key) && selected.length > 1 && (selectionMode === 'multiple' || selectionMode === 'extended') ? items.filter((candidate) => selected.includes(candidate.key) && !candidate.disabled).map((candidate) => candidate.key) : [item.key]
      if (event.altKey && reorderable && (event.key === 'ArrowUp' || event.key === 'ArrowLeft')) { event.preventDefault(); const target = adjacentOutsideIndex(items, movingKeys, -1); if (target >= 0) moveItems(movingKeys, items[target]!.key, false); return }
      if (event.altKey && reorderable && (event.key === 'ArrowDown' || event.key === 'ArrowRight')) { event.preventDefault(); const target = adjacentOutsideIndex(items, movingKeys, 1); if (target >= 0) moveItems(movingKeys, items[target]!.key, true); return }
      if (event.key === 'Enter') { event.preventDefault(); if (!item.disabled) onItemInvoked?.(item); return }
      if (event.key === ' ') { event.preventDefault(); selectItem(item, event); return }
      if (event.key === 'Escape' && swipedKey) { event.preventDefault(); setSwipedKey(null); return }
      if (event.key === 'ArrowRight' && layout === 'grid') { event.preventDefault(); focusIndex(nextEnabledIndex(items, index, 1)) }
      if (event.key === 'ArrowLeft' && layout === 'grid') { event.preventDefault(); focusIndex(nextEnabledIndex(items, index, -1)) }
      if (event.key === 'ArrowDown') { event.preventDefault(); focusIndex(nextEnabledIndex(items, index, columns)) }
      if (event.key === 'ArrowUp') { event.preventDefault(); focusIndex(nextEnabledIndex(items, index, -columns)) }
      if (event.key === 'Home') { event.preventDefault(); const first = items.findIndex((candidate) => !candidate.disabled); if (first >= 0) focusIndex(first) }
      if (event.key === 'End') { event.preventDefault(); const rev = [...items].reverse().findIndex((candidate) => !candidate.disabled); if (rev >= 0) focusIndex(items.length - 1 - rev) }
    }}>{layout === 'list' && <div className="swipe-actions" aria-hidden={swipedKey !== item.key}><button className="swipe-action" tabIndex={swipedKey === item.key ? 0 : -1} onClick={(event) => { event.stopPropagation(); onItemInvoked?.(item); setSwipedKey(null) }}>打开</button>{selectionMode !== 'none' && <button className="swipe-action" tabIndex={swipedKey === item.key ? 0 : -1} onClick={(event) => { event.stopPropagation(); selectItem(item, { ctrlKey: true }); setSwipedKey(null) }}>{active ? '取消' : '选择'}</button>}</div>}{itemContent}</div>
  })}{marquee && <div className="selection-marquee" style={marquee} aria-hidden="true" />}</div>
}

export function SelectionListView(props: Omit<CollectionProps, 'layout'>) {
  return <CollectionView {...props} layout="list" />
}

export function SelectionGridView(props: Omit<CollectionProps, 'layout'>) {
  return <CollectionView {...props} layout="grid" />
}
