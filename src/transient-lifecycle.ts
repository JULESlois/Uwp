const transientSelector = [
  '.command-overflow-menu',
  '.top-nav-overflow',
  '.autosuggest-menu',
  '.context-menu',
].join(',')

function eachTransient(node: Node, visit: (element: HTMLElement) => void) {
  if (!(node instanceof HTMLElement)) return
  if (node.matches(transientSelector)) visit(node)
  node.querySelectorAll<HTMLElement>(transientSelector).forEach(visit)
}

function returnTarget(surface: HTMLElement, parent: HTMLElement) {
  if (surface.classList.contains('command-overflow-menu')) {
    return parent.querySelector<HTMLElement>('.command-overflow-trigger')
  }
  if (surface.classList.contains('top-nav-overflow')) {
    return document.querySelector<HTMLElement>('.top-nav-more')
  }
  if (surface.classList.contains('autosuggest-menu')) {
    return parent.querySelector<HTMLElement>('input')
  }
  if (surface.classList.contains('context-menu')) {
    return parent.closest<HTMLElement>('.context-host')
  }
  return null
}

function stripIds(root: HTMLElement) {
  root.removeAttribute('id')
  root.querySelectorAll<HTMLElement>('[id]').forEach((element) => element.removeAttribute('id'))
}

function bridgeExit(surface: HTMLElement, parent: HTMLElement, before: Node | null) {
  if (surface.dataset.transientExit === 'true') return

  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const ownedFocus = Boolean(active && surface.contains(active))
  const focusTarget = returnTarget(surface, parent)
  const clone = surface.cloneNode(true) as HTMLElement

  stripIds(clone)
  clone.dataset.transientExit = 'true'
  clone.setAttribute('aria-hidden', 'true')
  clone.setAttribute('inert', '')
  clone.classList.add('transient-exit')
  clone.querySelectorAll<HTMLElement>('button,input,select,textarea,a,[tabindex]').forEach((element) => {
    element.tabIndex = -1
  })

  parent.insertBefore(clone, before)
  const remove = () => clone.remove()
  clone.addEventListener('animationend', remove, { once: true })
  window.setTimeout(remove, 240)
  requestAnimationFrame(() => clone.classList.add('transient-exit-active'))

  if (ownedFocus && focusTarget) {
    requestAnimationFrame(() => {
      const current = document.activeElement
      if (current === document.body || current === null || current === active) focusTarget.focus()
    })
  }
}

function clearExitClone(live: HTMLElement) {
  const parent = live.parentElement
  if (!parent) return
  const token = live.classList.contains('context-menu') ? 'context-menu'
    : live.classList.contains('autosuggest-menu') ? 'autosuggest-menu'
      : live.classList.contains('top-nav-overflow') ? 'top-nav-overflow'
        : 'command-overflow-menu'

  parent.querySelectorAll<HTMLElement>(`.${token}[data-transient-exit="true"]`).forEach((clone) => {
    const animations = clone.getAnimations()
    if (!animations.length) clone.remove()
    else window.setTimeout(() => clone.remove(), 80)
  })
}

function startTransientLifecycle() {
  if (!document.body) return

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (!(record.target instanceof HTMLElement)) continue
      record.addedNodes.forEach((node) => eachTransient(node, (surface) => {
        if (surface.dataset.transientExit !== 'true') clearExitClone(surface)
      }))
      record.removedNodes.forEach((node) => eachTransient(node, (surface) => {
        bridgeExit(surface, record.target as HTMLElement, record.nextSibling)
      }))
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startTransientLifecycle, { once: true })
} else {
  startTransientLifecycle()
}
