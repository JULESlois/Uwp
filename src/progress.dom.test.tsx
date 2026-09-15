// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { CSSProperties } from 'react'
import { ProgressBar } from './progress'

afterEach(cleanup)

describe('ProgressBar DOM semantics', () => {
  it('keeps the visual fill synchronized with the clamped accessible value', () => {
    render(<ProgressBar value={140} max={120} label="Transfer" style={{ width: 240, '--progress-value': '1%' } as CSSProperties} />)

    const progress = screen.getByRole('progressbar', { name: 'Transfer' })
    expect(progress.getAttribute('aria-valuemin')).toBe('0')
    expect(progress.getAttribute('aria-valuemax')).toBe('120')
    expect(progress.getAttribute('aria-valuenow')).toBe('120')
    expect(progress.style.getPropertyValue('--progress-value')).toBe('100%')
    expect(progress.style.width).toBe('240px')
  })

  it('omits determinate value semantics for indeterminate progress', () => {
    render(<ProgressBar indeterminate value={40} label="Preparing" />)

    const progress = screen.getByRole('progressbar', { name: 'Preparing' })
    expect(progress.getAttribute('aria-valuemin')).toBeNull()
    expect(progress.getAttribute('aria-valuemax')).toBeNull()
    expect(progress.getAttribute('aria-valuenow')).toBeNull()
    expect(progress.getAttribute('aria-busy')).toBe('true')
  })
})
