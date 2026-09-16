// @vitest-environment jsdom
import { createRef } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { RadioGroup } from './selectors'

afterEach(cleanup)

describe('RadioGroup root contract', () => {
  it('forwards its ref and native fieldset attributes to the semantic root', () => {
    const ref = createRef<HTMLFieldSetElement>()
    const { getByRole } = render(<RadioGroup
      ref={ref}
      value="one"
      onChange={() => undefined}
      options={[{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }] as const}
      legend="Choice"
      aria-describedby="group-help"
      data-testid="radio-group"
    />)

    const group = getByRole('group', { name: 'Choice' })
    expect(ref.current).toBe(group)
    expect(group.getAttribute('aria-describedby')).toBe('group-help')
    expect(group.getAttribute('data-testid')).toBe('radio-group')
  })
})
