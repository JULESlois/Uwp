import { useEffect, useRef, type ReactNode } from 'react'
import './selectors.css'

export type CheckBoxProps = {
  checked: boolean
  onChange: (value: boolean) => void
  label?: ReactNode
  ariaLabel?: string
  stopPropagation?: boolean
  disabled?: boolean
  indeterminate?: boolean
}

export function CheckBox({ checked, onChange, label, ariaLabel, stopPropagation = false, disabled = false, indeterminate = false }: CheckBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  return <label className={`selector checkbox-selector${disabled ? ' disabled' : ''}`} onClick={(event) => stopPropagation && event.stopPropagation()}><input ref={inputRef} type="checkbox" checked={checked} disabled={disabled} aria-label={ariaLabel} aria-checked={indeterminate ? 'mixed' : undefined} onChange={(event) => onChange(event.target.checked)} /><span className="selector-mark" aria-hidden="true" />{label && <span className="selector-label">{label}</span>}</label>
}

export type RadioButtonProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  ariaLabel?: string
  name?: string
  value?: string
  stopPropagation?: boolean
  disabled?: boolean
}

export function RadioButton({ checked, onChange, label, ariaLabel, name, value, stopPropagation = false, disabled = false }: RadioButtonProps) {
  return <label className={`selector radio-selector${disabled ? ' disabled' : ''}`} onClick={(event) => stopPropagation && event.stopPropagation()}><input type="radio" checked={checked} disabled={disabled} name={name} value={value} aria-label={ariaLabel} onChange={(event) => onChange(event.target.checked)} /><span className="selector-mark" aria-hidden="true" />{label && <span className="selector-label">{label}</span>}</label>
}

export type ToggleSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  detail?: ReactNode
  disabled?: boolean
  name?: string
  value?: string
}

export function ToggleSwitch({ checked, onChange, label, detail, disabled = false, name, value }: ToggleSwitchProps) {
  return <label className={`setting-row${disabled ? ' disabled' : ''}`}><span><strong>{label}</strong>{detail && <small>{detail}</small>}</span><input type="checkbox" role="switch" checked={checked} disabled={disabled} name={name} value={value} onChange={(event) => onChange(event.target.checked)} /><i className="switch" aria-hidden="true"><b /></i></label>
}
