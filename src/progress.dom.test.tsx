// @vitest-environment jsdom
import { createRef, type CSSProperties } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ProgressBar, ProgressRing } from './progress'

afterEach(cleanup)

describe('Progress DOM semantics', () => {
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

  it('forwards ProgressBar refs and native root attributes', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ProgressBar ref={ref} value={25} label="Download" data-testid="bar" aria-describedby="progress-help" />)

    const progress = screen.getByTestId('bar')
    expect(ref.current).toBe(progress)
    expect(progress.getAttribute('role')).toBe('progressbar')
    expect(progress.getAttribute('aria-describedby')).toBe('progress-help')
  })

  it('forwards ProgressRing refs and reports active state on its semantic root', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ProgressRing ref={ref} label="Sync" data-testid="ring" />)

    const status = screen.getByTestId('ring')
    expect(ref.current).toBe(status)
    expect(status.getAttribute('role')).toBe('status')
    expect(status.getAttribute('aria-busy')).toBe('true')
    expect(status.getAttribute('aria-label')).toBe('Sync')
  })
})
