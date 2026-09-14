import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CommandBar } from './components'

describe('CommandBar accessibility', () => {
  it('keeps exactly one enabled command in the toolbar tab sequence', () => {
    const markup = renderToStaticMarkup(<CommandBar commands={[
      { label: 'Disabled', disabled: true },
      { label: 'Save' },
      { label: 'Share' },
    ]} />)

    expect(markup.match(/tabindex="0"/g)).toHaveLength(1)
    expect(markup.match(/tabindex="-1"/g)).toHaveLength(2)
    expect(markup).toContain('aria-label="命令栏"')
  })

  it('allows callers to override the toolbar accessible name', () => {
    const markup = renderToStaticMarkup(<CommandBar ariaLabel="Document commands" commands={[{ label: 'Save' }]} />)
    expect(markup).toContain('aria-label="Document commands"')
  })
})
