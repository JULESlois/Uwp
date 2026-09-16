import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CheckBox, RadioButton, RadioGroup, ToggleSwitch } from './selectors'

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

  it('renders a semantic typed radio group with a shared name', () => {
    const markup = renderToStaticMarkup(<RadioGroup
      value="standard"
      onChange={() => undefined}
      name="density"
      legend="Density"
      orientation="horizontal"
      options={[
        { value: 'standard', label: 'Standard' },
        { value: 'compact', label: 'Compact', disabled: true },
      ] as const}
    />)
    expect(markup).toContain('<fieldset class="radio-group horizontal">')
    expect(markup).toContain('<legend>Density</legend>')
    expect(markup.match(/name="density"/g)).toHaveLength(2)
    expect(markup).toMatch(/value="standard"[^>]*checked=""|checked=""[^>]*value="standard"/)
    expect(markup).toMatch(/value="compact"[^>]*disabled=""|disabled=""[^>]*value="compact"/)
  })

  it('uses switch semantics for toggles', () => {
    const markup = renderToStaticMarkup(<ToggleSwitch checked onChange={() => undefined} label="Sync" />)
    expect(markup).toContain('role="switch"')
    expect(markup).toContain('checked=""')
  })
})