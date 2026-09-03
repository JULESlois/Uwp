export {}

type Rect = { left: number; top: number; width: number; height: number }
type SurfaceKind = 'semantic' | 'detail' | 'continuity'

const rects = new WeakMap<HTMLElement, Rect>()
const signatures = new WeakMap<HTMLElement, string>()
const activeAnimations = new WeakMap<HTMLElement, Animation>()
const tracked = new Set<HTMLElement>()
const resizeObservers = new WeakMap<HTMLElement, ResizeObserver>()

const DETAIL_MS = 160
const LAYOUT_MS = 220
const EASE = 'cubic-bezier(.1,.9,.2,1)'
const NAV_CONTINUITY_SELECTOR = '.shell > .topbar,.shell > .priority-command-shell,.shell > .page-transition-stage'
const SURFACE_SELECTOR = [
  '.semantic-zoom',
  '.semantic-zoom + .rules',
  '.master-details > section',
  '.split-view > section',
  NAV_CONTINUITY_SELECTOR,
].join(',')

function box(element: HTMLElement): Rect {
  const rect = element.getBoundingClientRect()
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}

function motionDisabled(element: HTMLElement) {
  return Boolean(element.closest('.no-motion')) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function kindFor(element: HTMLElement): SurfaceKind {
  if (element.classList.contains('semantic-zoom')) return 'semantic'
  if (element.matches('.master-details > section,.split-view > section')) return 'detail'
  return 'continuity'
}

function signature(element: HTMLElement, kind: SurfaceKind) {
  if (kind === 'semantic') return element.querySelector('.start-overview') ? 'overview' : 'detail'
  if (kind === 'detail') {
    const title = element.querySelector('h1,h2,h3,strong')?.textContent?.trim() ?? ''
    const copy = element.querySelector('p,small')?.textContent?.trim() ?? ''
    return `${title}\u241f${copy}`
  }
  return ''
}

function currentSemanticSurface(host: HTMLElement) {
  const children = Array.from(host.children)
  for (let index = children.length - 1; index >= 0; index -= 1) {
    const child = children[index]
    if (child instanceof HTMLElement && !child.classList.contains('semantic-toolbar')) return child
  }
  return undefined
}

function play(element: HTMLElement, keyframes: Keyframe[], duration: number) {
  activeAnimations.get(element)?.cancel()
  const animation = element.animate(keyframes, { duration, easing: EASE, fill: 'both' })
  activeAnimations.set(element, animation)
  animation.finished.catch(() => undefined).finally(() => {
    if (activeAnimations.get(element) === animation) activeAnimations.delete(element)
  })
}

function animateContinuity(element: HTMLElement, before: Rect, after: Rect) {
  const dx = before.left - after.left
  const dy = before.top - after.top
  const distance = Math.hypot(dx, dy)
  if (distance < 0.75 || distance > 360) return
  play(element, [
    { transform: `translate3d(${dx}px, ${dy}px, 0)` },
    { transform: 'translate3d(0, 0, 0)' },
  ], LAYOUT_MS)
}

function animateSurface(element: HTMLElement) {
  if (!element.isConnected) return
  const kind = kindFor(element)
  const before = rects.get(element)
  const after = box(element)
  const beforeSignature = signatures.get(element)
  const afterSignature = signature(element, kind)
  rects.set(element, after)
  signatures.set(element, afterSignature)

  if (motionDisabled(element)) return

  if (kind === 'semantic' && beforeSignature !== undefined && beforeSignature !== afterSignature) {
    const surface = currentSemanticSurface(element)
    if (surface) {
      const zoomedOut = afterSignature === 'overview'
      play(surface, [
        { transform: `scale(${zoomedOut ? '.972' : '1.012'})`, opacity: .72 },
        { transform: 'scale(1)', opacity: 1 },
      ], LAYOUT_MS)
    }
  } else if (kind === 'detail' && beforeSignature !== undefined && beforeSignature !== afterSignature) {
    play(element, [
      { transform: 'translate3d(0, 7px, 0)', opacity: .72 },
      { transform: 'translate3d(0, 0, 0)', opacity: 1 },
    ], DETAIL_MS)
  }

  if (before) animateContinuity(element, before, after)
}

function register(element: HTMLElement) {
  if (tracked.has(element)) return
  tracked.add(element)
  rects.set(element, box(element))
  signatures.set(element, signature(element, kindFor(element)))
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => {
      if (!element.isConnected) return
      const previous = rects.get(element)
      const next = box(element)
      rects.set(element, next)
      if (!previous || motionDisabled(element)) return
      animateContinuity(element, previous, next)
    })
    observer.observe(element)
    resizeObservers.set(element, observer)
  }
}

function unregister(element: HTMLElement) {
  tracked.delete(element)
  resizeObservers.get(element)?.disconnect()
  resizeObservers.delete(element)
}

function schedule(elements: Iterable<HTMLElement>) {
  const pending = Array.from(new Set(elements)).filter((element) => element.isConnected)
  if (!pending.length) return
  requestAnimationFrame(() => pending.forEach(animateSurface))
}

function navigationSignature(className: string, resolvedNav = '') {
  const classes = className.split(/\s+/).filter((token) => token === 'win8' || token === 'win10' || token.startsWith('nav-')).join(' ')
  return `${classes}|${resolvedNav}`
}

function animateNavigationLayout(app: HTMLElement, previousSignature: string) {
  const currentSignature = navigationSignature(app.className, app.dataset.resolvedNav ?? '')
  if (previousSignature === currentSignature) return
  const surfaces = Array.from(app.querySelectorAll<HTMLElement>(NAV_CONTINUITY_SELECTOR))
  surfaces.forEach(register)
  // MutationObserver runs before ResizeObserver delivery. Measure the new layout
  // immediately so the old snapshot cannot be overwritten before FLIP begins.
  surfaces.forEach(animateSurface)
}

function relatedSurfaces(node: Node) {
  const result = new Set<HTMLElement>()
  if (!(node instanceof Element)) return result
  const self = node.matches(SURFACE_SELECTOR) ? node as HTMLElement : null
  if (self) result.add(self)
  const closest = node.closest<HTMLElement>(SURFACE_SELECTOR)
  if (closest) result.add(closest)
  node.querySelectorAll?.<HTMLElement>(SURFACE_SELECTOR).forEach((element) => result.add(element))
  const semantic = node.closest<HTMLElement>('.semantic-zoom')
  const rules = semantic?.nextElementSibling
  if (rules instanceof HTMLElement && rules.classList.contains('rules')) result.add(rules)
  return result
}

function install() {
  document.querySelectorAll<HTMLElement>(SURFACE_SELECTOR).forEach(register)

  const observer = new MutationObserver((records) => {
    const changed = new Set<HTMLElement>()
    for (const record of records) {
      if (record.type === 'attributes') {
        const target = record.target
        if (target instanceof HTMLElement && target.classList.contains('app')) {
          if (record.attributeName === 'class') {
            animateNavigationLayout(target, navigationSignature(record.oldValue ?? '', target.dataset.resolvedNav ?? ''))
          } else if (record.attributeName === 'data-resolved-nav') {
            animateNavigationLayout(target, navigationSignature(target.className, record.oldValue ?? ''))
          }
        }
        continue
      }

      relatedSurfaces(record.target).forEach((element) => changed.add(element))
      record.addedNodes.forEach((node) => relatedSurfaces(node).forEach((element) => {
        register(element)
        changed.add(element)
      }))
      record.removedNodes.forEach((node) => relatedSurfaces(node).forEach(unregister))
    }
    schedule(changed)
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['class', 'data-resolved-nav'],
  })
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true })
else install()