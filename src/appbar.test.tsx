import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppBar } from './components'

describe('AppBar accessibility', () => {
  it('uses the first enabled command as the only toolbar tab stop', () => {
    const markup = renderToStaticMarkup(<AppBar commands={[
      { label: 'Disabled', disabled: true },
      { label: 'Open' },
      { label: 'Pin' },
    ]} />)

    expect(markup.match(/tabindex="0"/g)).toHaveLength(1)
    expect(markup.match(/tabindex="-1"/g)).toHaveLength(2)
    expect(markup).toContain('aria-label="应用栏"')
  })

  it('has no invalid tab stop when all commands are disabled', () => {
    const markup = renderToStaticMarkup(<AppBar commands={[
      { label: 'One', disabled: true },
      { label: 'Two', disabled: true },
    ]} />)

    expect(markup).not.toContain('tabindex="0"')
    expect(markup.match(/tabindex="-1"/g)).toHaveLength(2)
  })

  it('allows callers to override the toolbar accessible name', () => {
    const markup = renderToStaticMarkup(<AppBar ariaLabel="Editing commands" commands={[{ label: 'Open' }]} />)
    expect(markup).toContain('aria-label="Editing commands"')
  })
})
