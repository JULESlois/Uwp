import { createRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button contract', () => {
  it('defaults to a non-submitting standard button', () => {
    const markup = renderToStaticMarkup(<Button>Save</Button>)

    expect(markup).toContain('type="button"')
    expect(markup).toContain('class="button"')
    expect(markup).not.toContain('accent')
    expect(markup).not.toContain('quiet')
  })

  it('composes variants and consumer classes without hiding native attributes', () => {
    const markup = renderToStaticMarkup(
      <Button variant="accent" className="save-command" disabled aria-label="Save changes">
        Save
      </Button>,
    )

    expect(markup).toContain('class="button accent save-command"')
    expect(markup).toContain('disabled=""')
    expect(markup).toContain('aria-label="Save changes"')
  })

  it('preserves an explicit submit type', () => {
    const markup = renderToStaticMarkup(<Button type="submit">Submit</Button>)
    expect(markup).toContain('type="submit"')
  })

  it('accepts a forwarded button ref as part of the public API', () => {
    const ref = createRef<HTMLButtonElement>()
    expect(() => renderToStaticMarkup(<Button ref={ref}>Open</Button>)).not.toThrow()
  })
})
