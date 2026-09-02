import { Fragment, useEffect, useRef, useState, type DragEvent as ReactDragEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { RadioButton, type ListItem } from './components'
import { CheckBox } from './selectors'

export type SelectionMode = 'none' | 'single' | 'multiple' | 'extended'
export type CollectionTransfer = { sourceId: string; keys: string[] }
type InputModality = 'mouse' | 'touch' | 'pen' | 'keyboard'

type CollectionProps = {
  items: ListItem[]
  selected: string[]
  onSelectionChange: (keys: string[]) => void
  selectionMode?: SelectionMode
  onSelectionModeRequest?: (mode: SelectionMode, item?: ListItem) => void
  onItemInvoked?: (item: ListItem) => void
  reorderable?: boolean
  onReorder?: (items: ListItem[]) => void
  collectionId?: string
  onCrossDrop?: (payload: CollectionTransfer, targetKey?: string, after?: boolean) => void
  layout?: 'list' | 'grid'
}

type Marquee = { left: number; top: number; width: number; height: number }
type DropTarget = { key: string; after: boolean }
type SwipeState = { key: string; offset: number; dragging: boolean }
type SwipeStart = { key: string; x: number; y: number; time: number; lastX: number; lastTime: number; lastDx: number; baseOffset: number; pointerId: number; axis: 'x' | 'y' | null }
type HoldStart = { key: string; x: number; y: number; pointerId: number }

const SWIPE_WIDTH = 120
const SWIPE_OPEN_THRESHOLD = 60
const COLLECTION_MIME = 'application/x-uwp-collection'
const LONG_PRESS_MS = 520

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
    index += delta
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

function pointerModality(pointerType: string): InputModality {
  if (pointerType === 'touch') return 'touch'
  if (pointerType === 'pen') return 'pen'
  return 'mouse'
}

function parseTransfer(dataTransfer: DataTransfer): CollectionTransfer | null {
  const raw = dataTransfer.getData(COLLECTION_MIME) || dataTransfer.getData('text/plain')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CollectionTransfer | string[]
    if (Array.isArray(parsed)) return { sourceId: '', keys: parsed.filter((key): key is string => typeof key === 'string') }
    if (parsed && typeof parsed.sourceId === 'string' && Array.isArray(parsed.keys)) return { sourceId: parsed.sourceId, keys: parsed.keys.filter((key): key is string => typeof key === 'string') }
  } catch {
    return null
  }
  return null
}

export function CollectionView({ items, selected, onSelectionChange, selectionMode = 'extended', onSelectionModeRequest, onItemInvoked, reorderable = false, onReorder, collectionId, onCrossDrop, layout = 'list' }: CollectionProps) {
  const root = useRef<HTMLDivElement>(null)
  const anchor = useRef<string>(selected[0] ?? firstEnabled(items))
  const marqueeStart = useRef<{ x: number; y: number } | null>(null)
  const marqueePointer = useRef<{ x: number; y: number } | null>(null)
  const marqueeBase = useRef<string[]>([])
  const marqueeFrame = useRef<number | null>(null)
  const dragPointer = useRef<{ x: number; y: number } | null>(null)
  const dragFrame = useRef<number | null>(null)
  const swipeStart = useRef<SwipeStart | null>(null)
  const holdStart = useRef<HoldStart | null>(null)
  const holdTimer = useRef<number | null>(null)
  const suppressClickKey = useRef<string | null>(null)
  const [focusKey, setFocusKey] = useState(selected.find((key) => items.some((item) => item.key === key && !item.disabled)) ?? firstEnabled(items))
  const [draggedKeys, setDraggedKeys] = useState<string[]>([])
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [marquee, setMarquee] = useState<Marquee | null>(null)
  const [swipe, setSwipe] = useState<SwipeState | null>(null)
  const [modality, setModality] = useState<InputModality>('mouse')
  const [holdingKey, setHoldingKey] = useState<string | null>(null)
  const sourceId = collectionId ?? `collection-${layout}`
  const canDrag = reorderable || Boolean(onCrossDrop)
  const canDrop = reorderable || Boolean(onCrossDrop)

  useEffect(() => {
    if (!items.some((item) => item.key === focusKey && !item.disabled)) setFocusKey(firstEnabled(items))
  }, [items, focusKey])

  useEffect(() => () => {
    if (marqueeFrame.current !== null) cancelAnimationFrame(marqueeFrame.current)
    if (dragFrame.current !== null) cancelAnimationFrame(dragFrame.current)
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
  }, [])

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
    const next = [...remaining]
    next.splice(target + (after ? 1 : 0), 0, ...moving)
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

  const createDragGhost = (event: ReactDragEvent<HTMLDivElement>, keys: string[]) => {
    const first = items.find((item) => item.key === keys[0])
    const ghost = document.createElement('div')
    ghost.className = 'collection-drag-ghost'
    const title = document.createElement('strong')
    title.textContent = first?.title ?? '项目'
    ghost.append(title)
    if (keys.length > 1) {
      const count = document.createElement('span')
      count.textContent = `${keys.length} 项`
      ghost.append(count)
    }
    document.body.append(ghost)
    event.dataTransfer.setDragImage(ghost, 22, 22)
    requestAnimationFrame(() => ghost.remove())
  }

  const stopDragAutoScroll = () => {
    dragPointer.current = null
    if (dragFrame.current !== null) {
      cancelAnimationFrame(dragFrame.current)
      dragFrame.current = null
    }
  }

  const dragAutoScrollStep = () => {
    const pointer = dragPointer.current
    const host = root.current
    if (!pointer || !host) {
      dragFrame.current = null
      return
    }
    const rect = host.getBoundingClientRect()
    const edge = 64
    let delta = 0
    if (pointer.y < Math.max(0, rect.top) + edge) delta = -14
    else if (pointer.y > Math.min(window.innerHeight, rect.bottom) - edge) delta = 14
    if (delta) {
      if (host.scrollHeight > host.clientHeight + 2 && pointer.y >= rect.top && pointer.y <= rect.bottom) host.scrollTop += delta
      else window.scrollBy({ top: delta, behavior: 'auto' })
    }
    dragFrame.current = requestAnimationFrame(dragAutoScrollStep)
  }

  const updateDragPointer = (event: ReactDragEvent<HTMLElement>) => {
    if (!canDrop) return
    dragPointer.current = { x: event.clientX, y: event.clientY }
    if (dragFrame.current === null) dragFrame.current = requestAnimationFrame(dragAutoScrollStep)
  }

  const dragStart = (event: ReactDragEvent<HTMLDivElement>, item: ListItem) => {
    if (!canDrag || item.disabled) return
    const keys = dragKeysFor(item)
    const payload: CollectionTransfer = { sourceId, keys }
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(COLLECTION_MIME, JSON.stringify(payload))
    event.dataTransfer.setData('text/plain', JSON.stringify(payload))
    createDragGhost(event, keys)
    setSwipe(null)
    setDraggedKeys(keys)
  }

  const updateMarquee = (clientX: number, clientY: number) => {
    const start = marqueeStart.current
    const host = root.current
    if (!start || !host) return
    const hostRect = host.getBoundingClientRect()
    const currentX = clientX - hostRect.left + host.scrollLeft
    const currentY = clientY - hostRect.top + host.scrollTop
    const left = Math.min(start.x, currentX)
    const right = Math.max(start.x, currentX)
    const top = Math.min(start.y, currentY)
    const bottom = Math.max(start.y, currentY)
    setMarquee({ left, top, width: right - left, height: bottom - top })
    const hits = Array.from(host.querySelectorAll<HTMLElement>('.collection-item')).flatMap((element, index) => {
      const item = items[index]
      if (!item || item.disabled) return []
      const rect = element.getBoundingClientRect()
      const itemLeft = rect.left - hostRect.left + host.scrollLeft
      const itemRight = rect.right - hostRect.left + host.scrollLeft
      const itemTop = rect.top - hostRect.top + host.scrollTop
      const itemBottom = rect.bottom - hostRect.top + host.scrollTop
      const intersects = itemLeft < right && itemRight > left && itemTop < bottom && itemBottom > top
      return intersects ? [item.key] : []
    })
    onSelectionChange(Array.from(new Set([...marqueeBase.current, ...hits])))
  }

  const autoScrollStep = () => {
    const pointer = marqueePointer.current
    const host = root.current
    if (!marqueeStart.current || !pointer || !host) {
      marqueeFrame.current = null
      return
    }
    const rect = host.getBoundingClientRect()
    const edge = 54
    let delta = 0
    if (pointer.y < Math.max(0, rect.top) + edge) delta = -12
    else if (pointer.y > Math.min(window.innerHeight, rect.bottom) - edge) delta = 12
    if (delta) {
      if (host.scrollHeight > host.clientHeight + 2 && pointer.y >= rect.top && pointer.y <= rect.bottom) host.scrollTop += delta
      else window.scrollBy({ top: delta, behavior: 'auto' })
      updateMarquee(pointer.x, pointer.y)
    }
    marqueeFrame.current = requestAnimationFrame(autoScrollStep)
  }

  const beginMarquee = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch' || event.button !== 0 || event.target !== event.currentTarget || (selectionMode !== 'multiple' && selectionMode !== 'extended')) return
    const rect = event.currentTarget.getBoundingClientRect()
    marqueeStart.current = { x: event.clientX - rect.left + event.currentTarget.scrollLeft, y: event.clientY - rect.top + event.currentTarget.scrollTop }
    marqueePointer.current = { x: event.clientX, y: event.clientY }
    marqueeBase.current = event.ctrlKey || event.metaKey ? selected : []
    if (!(event.ctrlKey || event.metaKey)) onSelectionChange([])
    setSwipe(null)
    setMarquee({ left: marqueeStart.current.x, top: marqueeStart.current.y, width: 0, height: 0 })
    event.currentTarget.setPointerCapture(event.pointerId)
    if (marqueeFrame.current === null) marqueeFrame.current = requestAnimationFrame(autoScrollStep)
  }

  const moveMarquee = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!marqueeStart.current) return
    marqueePointer.current = { x: event.clientX, y: event.clientY }
    updateMarquee(event.clientX, event.clientY)
  }

  const endMarquee = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!marqueeStart.current) return
    marqueeStart.current = null
    marqueePointer.current = null
    setMarquee(null)
    if (marqueeFrame.current !== null) {
      cancelAnimationFrame(marqueeFrame.current)
      marqueeFrame.current = null
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const cancelHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
    holdStart.current = null
    setHoldingKey(null)
  }

  const beginHold = (event: ReactPointerEvent<HTMLDivElement>, item: ListItem) => {
    if ((event.pointerType !== 'touch' && event.pointerType !== 'pen') || selectionMode !== 'none' || !onSelectionModeRequest || item.disabled) return
    cancelHold()
    holdStart.current = { key: item.key, x: event.clientX, y: event.clientY, pointerId: event.pointerId }
    setHoldingKey(item.key)
    holdTimer.current = window.setTimeout(() => {
      const current = holdStart.current
      if (!current || current.key !== item.key) return
      holdTimer.current = null
      holdStart.current = null
      setHoldingKey(null)
      setSwipe(null)
      swipeStart.current = null
      suppressClickKey.current = item.key
      anchor.current = item.key
      onSelectionModeRequest('multiple', item)
      onSelectionChange([item.key])
    }, LONG_PRESS_MS)
  }

  const beginSwipe = (event: ReactPointerEvent<HTMLDivElement>, item: ListItem) => {
    const target = event.target as HTMLElement
    beginHold(event, item)
    if (layout !== 'list' || event.pointerType === 'mouse' || target.closest?.('.collection-selector,.reorder-grip,.swipe-action')) return
    const baseOffset = swipe?.key === item.key ? swipe.offset : 0
    if (swipe && swipe.key !== item.key) setSwipe(null)
    swipeStart.current = { key: item.key, x: event.clientX, y: event.clientY, time: performance.now(), lastX: event.clientX, lastTime: performance.now(), lastDx: 0, baseOffset, pointerId: event.pointerId, axis: null }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveSwipe = (event: ReactPointerEvent<HTMLDivElement>, item: ListItem) => {
    const hold = holdStart.current
    if (hold?.key === item.key && Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > 10) cancelHold()
    const start = swipeStart.current
    if (!start || start.key !== item.key) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) start.axis = Math.abs(dx) > Math.abs(dy) + 4 ? 'x' : 'y'
    if (start.axis === 'y') { cancelHold(); return }
    if (start.axis !== 'x') return
    cancelHold()
    event.preventDefault()
    const now = performance.now()
    start.lastDx = (event.clientX - start.lastX) / Math.max(1, now - start.lastTime)
    start.lastX = event.clientX
    start.lastTime = now
    const offset = Math.max(-SWIPE_WIDTH, Math.min(16, start.baseOffset + dx))
    if (Math.abs(dx) > 10) suppressClickKey.current = item.key
    setSwipe({ key: item.key, offset, dragging: true })
  }

  const endSwipe = (event: ReactPointerEvent<HTMLDivElement>, item: ListItem) => {
    cancelHold()
    const start = swipeStart.current
    if (!start || start.key !== item.key) return
    const currentOffset = Math.max(-SWIPE_WIDTH, Math.min(16, start.baseOffset + (start.lastX - start.x)))
    const open = start.axis === 'x' && (currentOffset <= -SWIPE_OPEN_THRESHOLD || start.lastDx < -0.55)
    const close = start.axis === 'x' && start.lastDx > 0.55
    const targetOffset = open && !close ? -SWIPE_WIDTH : 0
    setSwipe({ key: item.key, offset: targetOffset, dragging: false })
    swipeStart.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (!targetOffset) window.setTimeout(() => setSwipe((current) => current?.key === item.key && current.offset === 0 ? null : current), 160)
  }

  const renderSelector = (item: ListItem, active: boolean) => {
    if (selectionMode === 'none') return null
    if (selectionMode === 'single') return <span className="collection-selector"><RadioButton checked={active} disabled={item.disabled} onChange={() => selectItem(item)} name={`collection-${sourceId}`} value={item.key} stopPropagation /></span>
    return <span className="collection-selector"><CheckBox checked={active} disabled={item.disabled} onChange={() => selectItem(item, { ctrlKey: true })} ariaLabel={`选择 ${item.title}`} stopPropagation /></span>
  }

  const openedSwipeKey = swipe && swipe.offset <= -SWIPE_OPEN_THRESHOLD ? swipe.key : null

  const dropPayload = (event: ReactDragEvent<HTMLElement>, targetKey?: string, after = true) => {
    const payload = parseTransfer(event.dataTransfer)
    if (!payload?.keys.length) return
    if (payload.sourceId && payload.sourceId !== sourceId) onCrossDrop?.(payload, targetKey, after)
    else if (targetKey) moveItems(payload.keys, targetKey, after)
  }

  return <div ref={root} className={`collection-view collection-${layout}${marquee ? ' marquee-active' : ''}${draggedKeys.length ? ' drag-active' : ''}`} data-selection-mode={selectionMode} data-modality={modality} data-collection-id={sourceId} role="listbox" aria-multiselectable={selectionMode === 'multiple' || selectionMode === 'extended' ? true : undefined} onPointerDownCapture={(event) => setModality(pointerModality(event.pointerType))} onKeyDownCapture={() => setModality('keyboard')} onPointerDown={beginMarquee} onPointerMove={moveMarquee} onPointerUp={endMarquee} onPointerCancel={endMarquee} onDragOver={(event) => { if (!canDrop) return; event.preventDefault(); updateDragPointer(event) }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) stopDragAutoScroll() }} onDrop={(event) => { if (event.target !== event.currentTarget || !canDrop) return; event.preventDefault(); dropPayload(event); setDraggedKeys([]); setDropTarget(null); stopDragAutoScroll() }}>{items.map((item, index) => {
    const active = selected.includes(item.key)
    const dragging = draggedKeys.includes(item.key)
    const itemSwipe = swipe?.key === item.key ? swipe : null
    const swiped = openedSwipeKey === item.key
    const placeholder = dropTarget?.key === item.key ? <div className={`collection-drop-placeholder collection-drop-${layout}`} aria-hidden="true" /> : null
    const rowClass = `collection-item${active ? ' selected' : ''}${item.disabled ? ' disabled' : ''}${dragging ? ' dragging' : ''}${swiped ? ' swiped' : ''}${itemSwipe?.dragging ? ' swipe-dragging' : ''}${holdingKey === item.key ? ' holding' : ''}`
    const itemContent = <div className="collection-item-content" style={itemSwipe ? { transform: `translateX(${itemSwipe.offset}px)` } : undefined}><span className="reorder-grip" aria-hidden="true" data-enabled={canDrag && !item.disabled} />{renderSelector(item, active)}{item.glyph && <span className="collection-glyph" aria-hidden="true">{item.glyph}</span>}<span className="collection-copy"><strong>{item.title}</strong>{item.detail && <small>{item.detail}</small>}</span>{dragging && draggedKeys.length > 1 && <span className="drag-count" aria-hidden="true">{draggedKeys.length}</span>}</div>
    const row = <div className={rowClass} role="option" aria-selected={selectionMode === 'none' ? undefined : active} aria-disabled={item.disabled || undefined} tabIndex={!item.disabled && focusKey === item.key ? 0 : -1} draggable={canDrag && !item.disabled} onFocus={() => !item.disabled && setFocusKey(item.key)} onClick={(event: ReactMouseEvent<HTMLDivElement>) => {
      if (suppressClickKey.current === item.key) { suppressClickKey.current = null; return }
      if (itemSwipe && itemSwipe.offset < 0) { setSwipe({ key: item.key, offset: 0, dragging: false }); return }
      if (selectionMode === 'none') onItemInvoked?.(item)
      else selectItem(item, event)
    }} onDoubleClick={() => !item.disabled && onItemInvoked?.(item)} onPointerDown={(event) => beginSwipe(event, item)} onPointerMove={(event) => moveSwipe(event, item)} onPointerUp={(event) => endSwipe(event, item)} onPointerCancel={(event) => endSwipe(event, item)} onDragStart={(event) => dragStart(event, item)} onDragEnd={() => { setDraggedKeys([]); setDropTarget(null); stopDragAutoScroll() }} onDragOver={(event) => {
      if (!canDrop || draggedKeys.includes(item.key)) return
      event.preventDefault()
      updateDragPointer(event)
      event.dataTransfer.dropEffect = 'move'
      const rect = event.currentTarget.getBoundingClientRect()
      setDropTarget({ key: item.key, after: layout === 'grid' ? event.clientX > rect.left + rect.width / 2 : event.clientY > rect.top + rect.height / 2 })
    }} onDrop={(event) => {
      if (!canDrop) return
      event.preventDefault()
      event.stopPropagation()
      dropPayload(event, item.key, dropTarget?.key === item.key ? dropTarget.after : false)
      setDraggedKeys([])
      setDropTarget(null)
      stopDragAutoScroll()
    }} onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
      const columns = layout === 'grid' ? Math.max(1, getComputedStyle(root.current ?? event.currentTarget).gridTemplateColumns.split(' ').filter(Boolean).length) : 1
      const movingKeys = selected.includes(item.key) && selected.length > 1 && (selectionMode === 'multiple' || selectionMode === 'extended') ? items.filter((candidate) => selected.includes(candidate.key) && !candidate.disabled).map((candidate) => candidate.key) : [item.key]
      const moveFocus = (targetIndex: number) => {
        const target = items[targetIndex]
        if (!target || target.disabled) return
        focusIndex(targetIndex)
        if (selectionMode === 'extended' && event.shiftKey) {
          if (!selected.length) anchor.current = item.key
          const range = rangeKeys(items, anchor.current || item.key, target.key)
          const additive = event.ctrlKey || event.metaKey
          onSelectionChange(additive ? Array.from(new Set([...selected, ...range])) : range)
        }
      }
      if (event.altKey && reorderable && (event.key === 'ArrowUp' || event.key === 'ArrowLeft')) { event.preventDefault(); const target = adjacentOutsideIndex(items, movingKeys, -1); if (target >= 0) moveItems(movingKeys, items[target]!.key, false); return }
      if (event.altKey && reorderable && (event.key === 'ArrowDown' || event.key === 'ArrowRight')) { event.preventDefault(); const target = adjacentOutsideIndex(items, movingKeys, 1); if (target >= 0) moveItems(movingKeys, items[target]!.key, true); return }
      if (event.key === 'Enter') { event.preventDefault(); if (!item.disabled) onItemInvoked?.(item); return }
      if (event.key === ' ') { event.preventDefault(); selectItem(item, event); return }
      if (event.key === 'Escape' && swipe) { event.preventDefault(); setSwipe(null); return }
      if (event.key === 'ArrowRight' && layout === 'grid') { event.preventDefault(); moveFocus(nextEnabledIndex(items, index, 1)); return }
      if (event.key === 'ArrowLeft' && layout === 'grid') { event.preventDefault(); moveFocus(nextEnabledIndex(items, index, -1)); return }
      if (event.key === 'ArrowDown') { event.preventDefault(); moveFocus(nextEnabledIndex(items, index, columns)); return }
      if (event.key === 'ArrowUp') { event.preventDefault(); moveFocus(nextEnabledIndex(items, index, -columns)); return }
      if (event.key === 'Home') { event.preventDefault(); const first = items.findIndex((candidate) => !candidate.disabled); if (first >= 0) moveFocus(first) }
      if (event.key === 'End') { event.preventDefault(); const rev = [...items].reverse().findIndex((candidate) => !candidate.disabled); if (rev >= 0) moveFocus(items.length - 1 - rev) }
    }}>{layout === 'list' && <div className="swipe-actions" aria-hidden={openedSwipeKey !== item.key}><button className="swipe-action" tabIndex={openedSwipeKey === item.key ? 0 : -1} onClick={(event) => { event.stopPropagation(); onItemInvoked?.(item); setSwipe(null) }}>打开</button>{selectionMode !== 'none' && <button className="swipe-action" tabIndex={openedSwipeKey === item.key ? 0 : -1} onClick={(event) => { event.stopPropagation(); selectItem(item, { ctrlKey: true }); setSwipe(null) }}>{active ? '取消' : '选择'}</button>}</div>}{itemContent}</div>
    return <Fragment key={item.key}>{placeholder && !dropTarget?.after ? placeholder : null}{row}{placeholder && dropTarget?.after ? placeholder : null}</Fragment>
  })}{marquee && <div className="selection-marquee" style={marquee} aria-hidden="true" />}</div>
}

export function SelectionListView(props: Omit<CollectionProps, 'layout'>) {
  return <CollectionView {...props} layout="list" />
}

export function SelectionGridView(props: Omit<CollectionProps, 'layout'>) {
  return <CollectionView {...props} layout="grid" />
}
