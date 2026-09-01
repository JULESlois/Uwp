import { useEffect, useRef, useState, type DragEvent as ReactDragEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from 'react'
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

export function CollectionView({ items, selected, onSelectionChange, selectionMode = 'extended', onItemInvoked, reorderable = false, onReorder, layout = 'list' }: CollectionProps) {
  const root = useRef<HTMLDivElement>(null)
  const anchor = useRef<string>(selected[0] ?? firstEnabled(items))
  const [focusKey, setFocusKey] = useState(selected.find((key) => items.some((item) => item.key === key && !item.disabled)) ?? firstEnabled(items))
  const [dragged, setDragged] = useState<string | null>(null)
  const [dropKey, setDropKey] = useState<string | null>(null)

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

  const moveItem = (fromKey: string, toKey: string) => {
    if (!reorderable || fromKey === toKey) return
    const from = items.findIndex((item) => item.key === fromKey)
    const to = items.findIndex((item) => item.key === toKey)
    if (from < 0 || to < 0) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    if (!moved) return
    next.splice(to, 0, moved)
    onReorder?.(next)
    anchor.current = moved.key
    setFocusKey(moved.key)
  }

  const dragStart = (event: ReactDragEvent<HTMLDivElement>, item: ListItem) => {
    if (!reorderable || item.disabled) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.key)
    setDragged(item.key)
  }

  const renderSelector = (item: ListItem, active: boolean) => {
    if (selectionMode === 'none') return null
    if (selectionMode === 'single') return <RadioButton checked={active} disabled={item.disabled} onChange={() => selectItem(item)} name={`collection-${layout}`} value={item.key} stopPropagation />
    return <CheckBox checked={active} disabled={item.disabled} onChange={() => selectItem(item, { ctrlKey: true })} ariaLabel={`选择 ${item.title}`} stopPropagation />
  }

  return <div ref={root} className={`collection-view collection-${layout}`} data-selection-mode={selectionMode} role="listbox" aria-multiselectable={selectionMode === 'multiple' || selectionMode === 'extended' ? true : undefined}>{items.map((item, index) => {
    const active = selected.includes(item.key)
    const rowClass = `collection-item${active ? ' selected' : ''}${item.disabled ? ' disabled' : ''}${dragged === item.key ? ' dragging' : ''}${dropKey === item.key && dragged !== item.key ? ' drop-target' : ''}`
    return <div key={item.key} className={rowClass} role="option" aria-selected={selectionMode === 'none' ? undefined : active} aria-disabled={item.disabled || undefined} tabIndex={!item.disabled && focusKey === item.key ? 0 : -1} draggable={reorderable && !item.disabled} onFocus={() => !item.disabled && setFocusKey(item.key)} onClick={(event: ReactMouseEvent<HTMLDivElement>) => { if (selectionMode === 'none') onItemInvoked?.(item); else selectItem(item, event) }} onDoubleClick={() => !item.disabled && onItemInvoked?.(item)} onDragStart={(event) => dragStart(event, item)} onDragEnd={() => { setDragged(null); setDropKey(null) }} onDragOver={(event) => { if (!reorderable || item.disabled) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropKey(item.key) }} onDrop={(event) => { event.preventDefault(); const key = dragged ?? event.dataTransfer.getData('text/plain'); if (key) moveItem(key, item.key); setDragged(null); setDropKey(null) }} onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
      const columns = layout === 'grid' ? Math.max(1, getComputedStyle(root.current ?? event.currentTarget).gridTemplateColumns.split(' ').filter(Boolean).length) : 1
      if (event.altKey && reorderable && (event.key === 'ArrowUp' || event.key === 'ArrowLeft')) { event.preventDefault(); const target = nextEnabledIndex(items, index, -1); if (target !== index) moveItem(item.key, items[target]!.key); return }
      if (event.altKey && reorderable && (event.key === 'ArrowDown' || event.key === 'ArrowRight')) { event.preventDefault(); const target = nextEnabledIndex(items, index, 1); if (target !== index) moveItem(item.key, items[target]!.key); return }
      if (event.key === 'Enter') { event.preventDefault(); if (!item.disabled) onItemInvoked?.(item); return }
      if (event.key === ' ') { event.preventDefault(); selectItem(item, event); return }
      if (event.key === 'ArrowRight' && layout === 'grid') { event.preventDefault(); focusIndex(nextEnabledIndex(items, index, 1)) }
      if (event.key === 'ArrowLeft' && layout === 'grid') { event.preventDefault(); focusIndex(nextEnabledIndex(items, index, -1)) }
      if (event.key === 'ArrowDown') { event.preventDefault(); focusIndex(nextEnabledIndex(items, index, columns)) }
      if (event.key === 'ArrowUp') { event.preventDefault(); focusIndex(nextEnabledIndex(items, index, -columns)) }
      if (event.key === 'Home') { event.preventDefault(); const first = items.findIndex((candidate) => !candidate.disabled); if (first >= 0) focusIndex(first) }
      if (event.key === 'End') { event.preventDefault(); const rev = [...items].reverse().findIndex((candidate) => !candidate.disabled); if (rev >= 0) focusIndex(items.length - 1 - rev) }
    }}><span className="reorder-grip" aria-hidden="true" data-enabled={reorderable && !item.disabled} />{renderSelector(item, active)}{item.glyph && <span className="collection-glyph" aria-hidden="true">{item.glyph}</span>}<span className="collection-copy"><strong>{item.title}</strong>{item.detail && <small>{item.detail}</small>}</span></div>
  })}</div>
}

export function SelectionListView(props: Omit<CollectionProps, 'layout'>) {
  return <CollectionView {...props} layout="list" />
}

export function SelectionGridView(props: Omit<CollectionProps, 'layout'>) {
  return <CollectionView {...props} layout="grid" />
}
