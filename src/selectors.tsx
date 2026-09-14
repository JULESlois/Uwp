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
