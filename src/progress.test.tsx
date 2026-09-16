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

  it('omits determinate value semantics for an indeterminate bar', () => {
    const markup = renderToStaticMarkup(<ProgressBar indeterminate aria-valuetext="等待服务器" />)

    expect(markup).not.toContain('aria-valuenow=')
    expect(markup).not.toContain('aria-valuemax=')
    expect(markup).toContain('aria-valuetext="等待服务器"')
    expect(markup).toContain('aria-busy="true"')
  })
})
