import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Slider } from './slider'

describe('Slider accessibility', () => {
  it('binds the range to the static visible label instead of the changing output', () => {
    const markup = renderToStaticMarkup(<Slider id="volume" label="Volume" value={42} />)

    expect(markup).toContain('id="volume-label"')
    expect(markup).toContain('aria-labelledby="volume-label"')
    expect(markup).toContain('<output for="volume">42</output>')
  })

  it('respects an explicit aria-label without adding a competing labelledby', () => {
    const markup = renderToStaticMarkup(<Slider id="zoom" label="Zoom level" aria-label="Canvas zoom" value={80} />)

    expect(markup).toContain('aria-label="Canvas zoom"')
    expect(markup).not.toContain('aria-labelledby=')
  })

  it('preserves an explicit aria-labelledby override', () => {
    const markup = renderToStaticMarkup(<Slider id="brightness" label="Brightness" aria-labelledby="external-label" value={60} />)

    expect(markup).toContain('aria-labelledby="external-label"')
  })
})
