export {}

type Rect = { left: number; top: number; width: number; height: number }
type Snapshot = Map<string, Rect>
type ActiveDrag = { sourceId: string; keys: string[]; rects: Map<string, Rect>; adopted: Set<string>; expiresAt: number }

const snapshots = new WeakMap<HTMLElement, Snapshot>()
const activeAnimations = new WeakMap<HTMLElement, Animation>()
const resizeObservers = new WeakMap<HTMLElement, ResizeObserver>()
const runtimeKeys = new WeakMap<HTMLElement, string>()
const trackedViews = new Set<HTMLElement>()
let runtimeSequence = 0
let activeDrag: ActiveDrag | null = null

const COLLECTION_MIME = 'application/x-uwp-collection'
const SETTLE_MS = 180
const DIRECT_MS = 130
const CONNECTED_MS = 220
const EASE = 'cubic-bezier(.1,.9,.2,1)'

function directItems(view: HTMLElement) {
  return Array.from(view.children).filter((child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains('collection-item'))
}

function explicitIdentity(item: HTMLElement) {
  const key = item.dataset.collectionKey?.trim()
  return key ? `item:${key}` : null
}

function identity(item: HTMLElement) {
  const explicit = explicitIdentity(item)
  if (explicit) return explicit
  const existing = runtimeKeys.get(item)
  if (existing) return existing
  const generated = `node:${++runtimeSequence}`
  runtimeKeys.set(item, generated)
  return generated
}

function assignItemIdentity(item: HTMLElement, key: string) {
  const identityKey = `item:${key}`
  runtimeKeys.set(item, identityKey)
  return identityKey
}

function parseTransfer(dataTransfer: DataTransfer) {
  const raw = dataTransfer.getData(COLLECTION_MIME) || dataTransfer.getData('text/plain')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { sourceId?: unknown; keys?: unknown }
    if (!parsed || typeof parsed.sourceId !== 'string' || !Array.isArray(parsed.keys)) return null
    const keys = parsed.keys.filter((key): key is string => typeof key === 'string' && key.length > 0)
    return keys.length ? { sourceId: parsed.sourceId, keys } : null
  } catch {
    return null
  }
}

function relativeRect(view: HTMLElement, item: HTMLElement): Rect {
  const host = view.getBoundingClientRect()
  const rect = item.getBoundingClientRect()
  return {
    left: rect.left - host.left + view.scrollLeft,
    top: rect.top - host.top + view.scrollTop,
    width: rect.width,
    height: rect.height,
  }
}

function viewportRect(item: HTMLElement): Rect {
  const rect = item.getBoundingClientRect()
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}

function measure(view: HTMLElement): Snapshot {
  const result = new Map<string, Rect>()
  for (const item of directItems(view)) result.set(identity(item), relativeRect(view, item))
  return result
}

function motionDisabled(view: HTMLElement) {
  return Boolean(view.closest('.no-motion')) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function play(item: HTMLElement, keyframes: Keyframe[], duration: number) {
  activeAnimations.get(item)?.cancel()
  const animation = item.animate(keyframes, {
    duration,
    easing: EASE,
    fill: 'both',
  })
  activeAnimations.set(item, animation)
  animation.finished.catch(() => undefined).finally(() => {
    if (activeAnimations.get(item) === animation) activeAnimations.delete(item)
  })
}

function animateView(view: HTMLElement) {
  if (!view.isConnected) return

  for (const item of directItems(view)) activeAnimations.get(item)?.cancel()

  const before = snapshots.get(view)
  const after = measure(view)
  snapshots.set(view, after)
  if (!before || motionDisabled(view)) return

  const now = performance.now()
  if (activeDrag && activeDrag.expiresAt <= now) activeDrag = null
  const drag = activeDrag
  const sourceId = view.dataset.collectionId ?? ''
  const duringDirectManipulation = view.classList.contains('drag-active')

  for (const item of directItems(view)) {
    const key = identity(item)
    const current = after.get(key)
    if (!current) continue

    const previous = before.get(key)
    if (previous) {
      // The native drag ghost already represents the dragged surface. Moving that
      // same DOM node again after drop creates a bounce, so only its neighbours FLIP.
      if (drag?.sourceId === sourceId && drag.rects.has(key)) continue
      const dx = previous.left - current.left
      const dy = previous.top - current.top
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue
      play(item, [
        { transform: `translate3d(${dx}px, ${dy}px, 0)` },
        { transform: 'translate3d(0, 0, 0)' },
      ], duringDirectManipulation ? DIRECT_MS : SETTLE_MS)
      continue
    }

    const origin = drag?.sourceId !== sourceId ? drag?.rects.get(key) : undefined
    if (!origin) continue
    const target = viewportRect(item)
    const dx = origin.left - target.left
    const dy = origin.top - target.top
    const distance = Math.hypot(dx, dy)
    if (distance <= 720) {
      play(item, [
        { transform: `translate3d(${dx}px, ${dy}px, 0)`, opacity: 0.72 },
        { transform: 'translate3d(0, 0, 0)', opacity: 1 },
      ], CONNECTED_MS)
    } else {
      play(item, [
        { transform: 'translate3d(0, 10px, 0)', opacity: 0 },
        { transform: 'translate3d(0, 0, 0)', opacity: 1 },
      ], SETTLE_MS)
    }
  }
}

function register(view: HTMLElement) {
  if (trackedViews.has(view)) return
  trackedViews.add(view)
  snapshots.set(view, measure(view))

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => {
      if (!view.isConnected || view.classList.contains('drag-active')) return
      snapshots.set(view, measure(view))
    })
    observer.observe(view)
    resizeObservers.set(view, observer)
  }
}

function unregister(view: HTMLElement) {
  trackedViews.delete(view)
  resizeObservers.get(view)?.disconnect()
  resizeObservers.delete(view)
}

function collectionForNode(node: Node) {
  if (!(node instanceof Element)) return null
  return (node.matches('.collection-view') ? node : node.closest('.collection-view')) as HTMLElement | null
}

function directAddedItems(node: Node, view: HTMLElement) {
  if (!(node instanceof HTMLElement)) return [] as HTMLElement[]
  const result: HTMLElement[] = []
  if (node.parentElement === view && node.classList.contains('collection-item')) result.push(node)
  node.querySelectorAll<HTMLElement>('.collection-item').forEach((item) => {
    if (item.parentElement === view) result.push(item)
  })
  return result
}

function adoptCrossViewItems(view: HTMLElement, nodes: NodeList) {
  const drag = activeDrag
  const sourceId = view.dataset.collectionId ?? ''
  if (!drag || !sourceId || sourceId === drag.sourceId) return

  const added: HTMLElement[] = []
  nodes.forEach((node) => added.push(...directAddedItems(node, view)))
  if (!added.length) return

  const pending = drag.keys.filter((key) => !drag.adopted.has(key))
  for (let index = 0; index < added.length && index < pending.length; index += 1) {
    const key = pending[index]
    const item = added[index]
    if (!key || !item) continue
    assignItemIdentity(item, key)
    drag.adopted.add(key)
  }
}

function install() {
  document.querySelectorAll<HTMLElement>('.collection-view').forEach(register)

  const observer = new MutationObserver((records) => {
    const changed = new Set<HTMLElement>()

    for (const record of records) {
      const host = collectionForNode(record.target)
      if (host) {
        adoptCrossViewItems(host, record.addedNodes)
        changed.add(host)
      }

      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return
        if (node.matches('.collection-view')) register(node as HTMLElement)
        node.querySelectorAll?.<HTMLElement>('.collection-view').forEach(register)
      })

      record.removedNodes.forEach((node) => {
        if (!(node instanceof Element)) return
        if (node.matches('.collection-view')) unregister(node as HTMLElement)
        node.querySelectorAll?.<HTMLElement>('.collection-view').forEach(unregister)
      })
    }

    changed.forEach((view) => {
      register(view)
      animateView(view)
    })
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })

  document.addEventListener('dragstart', (event) => {
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>('.collection-item') : null
    const view = target?.closest<HTMLElement>('.collection-view')
    if (!target || !view || !event.dataTransfer) return

    const payload = parseTransfer(event.dataTransfer)
    const candidates = target.classList.contains('selected')
      ? directItems(view).filter((item) => item.classList.contains('selected') && !item.classList.contains('disabled'))
      : [target]
    const payloadKeys = payload?.sourceId === (view.dataset.collectionId ?? '') ? payload.keys : []
    const rects = new Map<string, Rect>()
    const keys: string[] = []

    candidates.forEach((item, index) => {
      const itemKey = payloadKeys[index]
      const key = itemKey ? assignItemIdentity(item, itemKey) : identity(item)
      rects.set(key, viewportRect(item))
      if (itemKey) keys.push(itemKey)
    })

    activeDrag = {
      sourceId: view.dataset.collectionId ?? '',
      keys,
      rects,
      adopted: new Set<string>(),
      expiresAt: performance.now() + 1600,
    }
  }, true)

  const retireDrag = () => {
    const drag = activeDrag
    if (!drag) return
    window.setTimeout(() => {
      if (activeDrag === drag) activeDrag = null
    }, CONNECTED_MS + 120)
  }
  document.addEventListener('drop', retireDrag, true)
  document.addEventListener('dragend', retireDrag, true)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true })
else install()
