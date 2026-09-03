import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export type InternalSlideDirection = 'forward' | 'backward'

type ViewTransitionHandle = {
  finished: Promise<void>
  skipTransition?: () => void
}

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionHandle
}

let activeTransition: ViewTransitionHandle | null = null

function motionDisabled(host: HTMLElement | null) {
  if (typeof window === 'undefined') return true
  if (host?.closest('.no-motion')) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function fallbackSlide(host: HTMLElement, direction: InternalSlideDirection, update: () => void) {
  flushSync(update)
  requestAnimationFrame(() => {
    if (typeof host.animate !== 'function') return
    const offset = direction === 'forward' ? 26 : -26
    host.getAnimations().forEach((animation) => animation.cancel())
    host.animate([
      { transform: `translate3d(${offset}px,0,0)`, opacity: 0.86 },
      { transform: 'translate3d(0,0,0)', opacity: 1 },
    ], {
      duration: 180,
      easing: 'cubic-bezier(.1,.9,.2,1)',
      fill: 'both',
    })
  })
}

export function runInternalSlide(host: HTMLElement | null, name: string, direction: InternalSlideDirection, update: () => void) {
  if (!host || motionDisabled(host)) {
    update()
    return
  }

  const doc = document as TransitionDocument
  if (!doc.startViewTransition) {
    fallbackSlide(host, direction, update)
    return
  }

  activeTransition?.skipTransition?.()
  host.style.setProperty('view-transition-name', name)
  document.documentElement.dataset.internalMotionDirection = direction

  let transition: ViewTransitionHandle
  try {
    transition = doc.startViewTransition(() => flushSync(update))
  } catch {
    host.style.removeProperty('view-transition-name')
    delete document.documentElement.dataset.internalMotionDirection
    fallbackSlide(host, direction, update)
    return
  }

  activeTransition = transition
  transition.finished.finally(() => {
    if (activeTransition !== transition) return
    activeTransition = null
    host.style.removeProperty('view-transition-name')
    delete document.documentElement.dataset.internalMotionDirection
  })
}

export function useLayerPresence(open: boolean) {
  const [mounted, setMounted] = useState(open)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    let firstFrame = 0
    let secondFrame = 0

    if (open) {
      setMounted(true)
      setEntered(false)
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => setEntered(true))
      })
    } else {
      setEntered(false)
    }

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
    }
  }, [open])

  const finishExit = () => {
    if (!open) setMounted(false)
  }

  return { mounted, entered, finishExit }
}
