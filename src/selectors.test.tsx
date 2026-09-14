import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CheckBox, RadioButton, ToggleSwitch } from './selectors'

describe('selector primitives', () => {
  it('exposes mixed checkbox state accessibly', () => {
    const markup = renderToStaticMarkup(<CheckBox checked={false} indeterminate onChange={() => undefined} label="Partial" />)
    expect(markup).toContain('aria-checked="mixed"')
  })

  it('preserves radio grouping metadata', () => {
    const markup = renderToStaticMarkup(<RadioButton checked={false} onChange={() => undefined} name="density" value="compact" label="Compact" />)
    expect(markup).toContain('type="radio"')
    expect(markup).toContain('name="density"')
    expect(markup).toContain('value="compact"')
  })

  it('uses switch semantics for toggles', () => {
    const markup = renderToStaticMarkup(<ToggleSwitch checked onChange={() => undefined} label="Sync" />)
    expect(markup).toContain('role="switch"')
    expect(markup).toContain('checked=""')
  })
})
