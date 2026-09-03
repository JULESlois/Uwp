const noneModeItemSelector = '.collection-view[data-selection-mode="none"] .collection-item'

function suppressRepeatedInvoke(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target.closest(noneModeItemSelector) : null
  if (!target) return

  // In SelectionMode=None the first click is the invoke gesture. A browser
  // double-click sequence then emits a second click (detail=2) and dblclick;
  // both must be stopped before React sees them or the same item is invoked
  // repeatedly.
  if (event.type === 'click' && event.detail <= 1) return
  event.preventDefault()
  event.stopPropagation()
}

document.addEventListener('click', suppressRepeatedInvoke, true)
document.addEventListener('dblclick', suppressRepeatedInvoke, true)
