import type { CSSProperties, HTMLAttributes } from 'react'
import './progress.css'

export type ProgressSize = 'small' | 'medium' | 'large'

export interface ProgressRingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  active?: boolean
  size?: ProgressSize
  label?: string
}

export interface ProgressBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value?: number
  max?: number
  indeterminate?: boolean
  label?: string
}

function classNames(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function ProgressRing({ active = true, size = 'medium', label = '正在处理', className, ...props }: ProgressRingProps) {
  return (
    <div
      {...props}
      className={classNames('progress-ring', `progress-ring--${size}`, !active && 'progress-ring--paused', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
      aria-busy={active || undefined}
    >
      <span className="progress-ring__visual" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => <i key={index} style={{ '--progress-dot': index } as CSSProperties} />)}
      </span>
    </div>
  )
}

export function ProgressBar({ value = 0, max = 100, indeterminate = false, label = '进度', className, ...props }: ProgressBarProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), safeMax) : 0
  const percent = (safeValue / safeMax) * 100
  const progressStyle = { '--progress-value': `${percent}%` } as CSSProperties

  return (
    <div
      {...props}
      className={classNames('progress-bar', indeterminate && 'progress-bar--indeterminate', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : safeMax}
      aria-valuenow={indeterminate ? undefined : safeValue}
      aria-busy={indeterminate || undefined}
      style={{ ...props.style, ...progressStyle }}
    >
      <span className="progress-bar__track" aria-hidden="true">
        <i className="progress-bar__indicator" />
      </span>
    </div>
  )
}
