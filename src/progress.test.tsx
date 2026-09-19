import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProgressBar, ProgressRing } from './progress'

describe('progress accessibility contract', () => {
  it('preserves a native aria-label over the convenience label prop', () => {
    const ring = renderToStaticMarkup(<ProgressRing label="旧标签" aria-label="同步状态" />)
    const bar = renderToStaticMarkup(<ProgressBar label="旧标签" aria-label="上传进度" value={42} />)

    expect(ring).toContain('aria-label="同步状态"')
    expect(bar).toContain('aria-label="上传进度"')
    expect(bar).toContain('aria-valuenow="42"')
  })

  it('keeps the existing localized fallback labels', () => {
    expect(renderToStaticMarkup(<ProgressRing />)).toContain('aria-label="正在处理"')
    expect(renderToStaticMarkup(<ProgressBar />)).toContain('aria-label="进度"')
  })

  it('reports active and paused ring state without stale busy semantics', () => {
    const active = renderToStaticMarkup(<ProgressRing size="large" />)
    const paused = renderToStaticMarkup(<ProgressRing active={false} />)

    expect(active).toContain('progress-ring--large')
    expect(active).toContain('aria-live="polite"')
    expect(active).toContain('aria-busy="true"')
    expect(paused).toContain('progress-ring--paused')
    expect(paused).toContain('aria-live="off"')
    expect(paused).not.toContain('aria-busy=')
  })

  it('clamps determinate values and normalizes an invalid maximum', () => {
    const clamped = renderToStaticMarkup(<ProgressBar value={140} max={120} />)
    const normalized = renderToStaticMarkup(<ProgressBar value={Number.NaN} max={0} />)

    expect(clamped).toContain('aria-valuemax="120"')
    expect(clamped).toContain('aria-valuenow="120"')
    expect(clamped).toContain('--progress-value:100%')
    expect(normalized).toContain('aria-valuemax="100"')
    expect(normalized).toContain('aria-valuenow="0"')
    expect(normalized).toContain('--progress-value:0%')
  })

  it('omits determinate value semantics for an indeterminate bar', () => {
    const markup = renderToStaticMarkup(<ProgressBar indeterminate aria-valuetext="等待服务器" />)

    expect(markup).not.toContain('aria-valuenow=')
    expect(markup).not.toContain('aria-valuemax=')
    expect(markup).toContain('aria-valuetext="等待服务器"')
    expect(markup).toContain('aria-busy="true"')
    expect(markup).toContain('progress-bar--indeterminate')
  })
})
