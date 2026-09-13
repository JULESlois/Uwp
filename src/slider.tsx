import { useId, useState, type CSSProperties, type ChangeEvent, type InputHTMLAttributes, type ReactNode } from 'react'
import './slider.css'

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue'> {
  label: ReactNode
  value?: number
  defaultValue?: number
  showValue?: boolean
  formatValue?: (value: number) => ReactNode
  onValueChange?: (value: number) => void
}

export function Slider({
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
  ...props
}: SliderProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? Number(min))
  const currentValue = value ?? uncontrolledValue
  const minValue = Number(min)
  const maxValue = Number(max)
  const span = maxValue - minValue
  const progress = span > 0 ? Math.min(100, Math.max(0, ((currentValue - minValue) / span) * 100)) : 0
  const inputStyle = { ...style, '--slider-position': `${progress}%` } as CSSProperties

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.valueAsNumber
    if (value === undefined) setUncontrolledValue(nextValue)
    onValueChange?.(nextValue)
    onChange?.(event)
  }

  return <label className={`slider-control${disabled ? ' disabled' : ''}`} htmlFor={inputId}>
    <span className="slider-header">
      <span>{label}</span>
      {showValue && <output htmlFor={inputId}>{formatValue(currentValue)}</output>}
    </span>
    <input
      {...props}
      id={inputId}
      className={className}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      defaultValue={defaultValue}
      disabled={disabled}
      style={inputStyle}
      onChange={handleChange}
    />
  </label>
}
