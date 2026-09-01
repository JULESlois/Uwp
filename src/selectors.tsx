import type { ReactNode } from 'react'

export function CheckBox({ checked, onChange, label, ariaLabel, stopPropagation = false, disabled = false }: { checked: boolean; onChange: (value: boolean) => void; label?: ReactNode; ariaLabel?: string; stopPropagation?: boolean; disabled?: boolean }) {
  return <label className={`selector checkbox-selector${disabled ? ' disabled' : ''}`} onClick={(event) => stopPropagation && event.stopPropagation()}><input type="checkbox" checked={checked} disabled={disabled} aria-label={ariaLabel} onChange={(event) => onChange(event.target.checked)} /><span className="selector-mark" aria-hidden="true" />{label && <span className="selector-label">{label}</span>}</label>
}
