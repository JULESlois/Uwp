const TOP_NAV_SELECTOR = '.top-navigation'
const WIDTH_HYSTERESIS = 12
const SETTLE_DELAY = 140

type PendingEntry = { entry: ResizeObserverEntry; timer: number }

function installScopedResizeObserverHysteresis() {
  if (typeof window === 'undefined' || !('ResizeObserver' in window)) return
  const marker = '__uwpTopNavigationResizeObserverPatched__'
  const scopedWindow = window as typeof window & Record<string, unknown>
  if (scopedWindow[marker]) return
  scopedWindow[marker] = true

  const NativeResizeObserver = window.ResizeObserver

  class StableResizeObserver implements ResizeObserver {
    private readonly native: ResizeObserver
    private readonly lastWidths = new WeakMap<Element, number>()
    private readonly pending = new Map<Element, PendingEntry>()

    constructor(callback: ResizeObserverCallback) {
      this.native = new NativeResizeObserver((entries, observer) => {
        const immediate: ResizeObserverEntry[] = []
        for (const entry of entries) {
          if (!(entry.target instanceof HTMLElement) || !entry.target.matches(TOP_NAV_SELECTOR)) {
            immediate.push(entry)
            continue
          }

          const width = entry.contentRect.width
          const previous = this.lastWidths.get(entry.target)
          if (previous === undefined || Math.abs(width - previous) >= WIDTH_HYSTERESIS) {
            this.lastWidths.set(entry.target, width)
            const existing = this.pending.get(entry.target)
            if (existing) window.clearTimeout(existing.timer)
            this.pending.delete(entry.target)
            immediate.push(entry)
            continue
          }

          const existing = this.pending.get(entry.target)
          if (existing) window.clearTimeout(existing.timer)
          const timer = window.setTimeout(() => {
            const latest = this.pending.get(entry.target)
            if (!latest) return
            this.pending.delete(entry.target)
            this.lastWidths.set(entry.target, latest.entry.contentRect.width)
            callback([latest.entry], observer)
          }, SETTLE_DELAY)
          this.pending.set(entry.target, { entry, timer })
        }
        if (immediate.length) callback(immediate, observer)
      })
    }

    observe(target: Element, options?: ResizeObserverOptions) { this.native.observe(target, options) }
    unobserve(target: Element) {
      const pending = this.pending.get(target)
      if (pending) window.clearTimeout(pending.timer)
      this.pending.delete(target)
      this.native.unobserve(target)
    }
    disconnect() {
      for (const pending of this.pending.values()) window.clearTimeout(pending.timer)
      this.pending.clear()
      this.native.disconnect()
    }
  }

  window.ResizeObserver = StableResizeObserver
}

function topNavigationButtons(nav: HTMLElement) {
  const primary = Array.from(nav.querySelectorAll<HTMLButtonElement>('.top-nav-action')).filter((button) => button.offsetParent !== null)
  const more = nav.querySelector<HTMLButtonElement>('.top-nav-more')
  return { primary, more: more?.offsetParent !== null ? more : null }
}

function currentPrimary(nav: HTMLElement) {
  return nav.querySelector<HTMLButtonElement>('.top-nav-action[aria-current="page"]')
}

function applyRovingOwner(nav: HTMLElement) {
  const { primary, more } = topNavigationButtons(nav)
  if (!primary.length && !more) return

  const remembered = nav.dataset.rovingNavKey
  const rememberedButton = remembered === '__more__'
    ? more
    : primary.find((button) => button.dataset.navKey === remembered)
  const current = currentPrimary(nav)
  const owner = rememberedButton ?? current ?? (more?.classList.contains('active') ? more : null) ?? primary[0] ?? more

  for (const button of primary) button.tabIndex = button === owner ? 0 : -1
  if (more) more.tabIndex = more === owner ? 0 : -1
}

function installTopNavigationRovingFocus() {
  if (typeof document === 'undefined') return

  const syncAll = () => document.querySelectorAll<HTMLElement>(TOP_NAV_SELECTOR).forEach(applyRovingOwner)

  document.addEventListener('focusin', (event) => {
    const target = event.target
    if (!(target instanceof HTMLButtonElement)) return
    const nav = target.closest<HTMLElement>(TOP_NAV_SELECTOR)
    if (!nav) return
    if (target.classList.contains('top-nav-action')) nav.dataset.rovingNavKey = target.dataset.navKey ?? ''
    else if (target.classList.contains('top-nav-more')) nav.dataset.rovingNavKey = '__more__'
    applyRovingOwner(nav)
  }, true)

  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const item = target.closest<HTMLButtonElement>('.top-nav-overflow [data-nav-key]')
    if (!item) return
    const nav = item.closest<HTMLElement>(TOP_NAV_SELECTOR)
    if (!nav) return
    const key = item.dataset.navKey
    if (!key) return
    nav.dataset.rovingNavKey = key
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const recovered = Array.from(nav.querySelectorAll<HTMLButtonElement>('.top-nav-action')).find((button) => button.dataset.navKey === key)
      const fallback = nav.querySelector<HTMLButtonElement>('.top-nav-more')
      ;(recovered ?? fallback)?.focus()
      applyRovingOwner(nav)
    }))
  }, true)

  const observer = new MutationObserver(syncAll)
  const start = () => {
    syncAll()
    if (document.body) observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'aria-current'] })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
  else start()
}

installScopedResizeObserverHysteresis()
installTopNavigationRovingFocus()
