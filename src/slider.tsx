import { forwardRef, useId, useState, type CSSProperties, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import './slider.css'

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue'> {
  label: ReactNode
  value?: number
  defaultValue?: number
  showValue?: boolean
  formatValue?: (value: number) => ReactNode
  onValueChange?: (value: number) => void
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider({
  label,
  id,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  showValue = true,
  formatValue = (current) => current,
  disabled = false,
  className = '',
  onChange,
  onValueChange,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}, ref) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const labelId = `${inputId}-label`
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? Number(min))
  const currentValue = value ?? uncontrolledValue
  const resolvedDefaultValue = defaultValue ?? Number(min)
  const minValue = Number(min)
  const maxValue = Number(max)
  const span = maxValue - minValue
  const progress = span > 0 ? Math.min(100, Math.max(0, ((currentValue - minValue) / span) * 100)) : 0
  const inputStyle = { ...style, '--slider-position': `${progress}%` } as CSSProperties
  const resolvedAriaLabelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : labelId)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.valueAsNumber
    if (value === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
    onChange?.(event)
  }

  return <label className={`slider-control${disabled ? ' disabled' : ''}`} htmlFor={inputId}>
    <span className="slider-header">
      <span id={labelId}>{label}</span>
      {showValue && <output htmlFor={inputId}>{formatValue(currentValue)}</output>}
    </span>
    <input
      {...props}
      ref={ref}
      id={inputId}
      className={className}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      defaultValue={value === undefined ? resolvedDefaultValue : undefined}
      disabled={disabled}
      style={inputStyle}
      aria-label={ariaLabel}
      aria-labelledby={resolvedAriaLabelledBy}
      onChange={handleChange}
    />
  </label>
})
