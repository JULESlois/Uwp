import { forwardRef, useEffect, useId, useRef, type FieldsetHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import './selectors.css'

type SelectorInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'defaultChecked' | 'onChange' | 'children'>

export interface CheckBoxProps extends SelectorInputProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: ReactNode
  /** @deprecated Prefer the native `aria-label` prop. */
  ariaLabel?: string
  stopPropagation?: boolean
  indeterminate?: boolean
}

export const CheckBox = forwardRef<HTMLInputElement, CheckBoxProps>(function CheckBox({
  checked,
  onChange,
  label,
  ariaLabel,
  stopPropagation = false,
  disabled = false,
  indeterminate = false,
  className = '',
  'aria-label': nativeAriaLabel,
  ...inputProps
}, forwardedRef) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const setRef = (node: HTMLInputElement | null) => {
    inputRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate
  }, [indeterminate])

  return <label className={`selector checkbox-selector${disabled ? ' disabled' : ''}${className ? ` ${className}` : ''}`} onClick={(event) => stopPropagation && event.stopPropagation()}>
    <input {...inputProps} ref={setRef} type="checkbox" checked={checked} disabled={disabled} aria-label={nativeAriaLabel ?? ariaLabel} aria-checked={indeterminate ? 'mixed' : undefined} onChange={(event) => onChange(event.currentTarget.checked)} />
    <span className="selector-mark" aria-hidden="true" />
    {label != null && <span className="selector-label">{label}</span>}
  </label>
})

export interface RadioButtonProps extends SelectorInputProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  /** @deprecated Prefer the native `aria-label` prop. */
  ariaLabel?: string
  stopPropagation?: boolean
}

export const RadioButton = forwardRef<HTMLInputElement, RadioButtonProps>(function RadioButton({
  checked,
  onChange,
  label,
  ariaLabel,
  stopPropagation = false,
  disabled = false,
  className = '',
  'aria-label': nativeAriaLabel,
  ...inputProps
}, ref) {
  return <label className={`selector radio-selector${disabled ? ' disabled' : ''}${className ? ` ${className}` : ''}`} onClick={(event) => stopPropagation && event.stopPropagation()}>
    <input {...inputProps} ref={ref} type="radio" checked={checked} disabled={disabled} aria-label={nativeAriaLabel ?? ariaLabel} onChange={(event) => onChange(event.currentTarget.checked)} />
    <span className="selector-mark" aria-hidden="true" />
    {label != null && <span className="selector-label">{label}</span>}
  </label>
})

export type RadioGroupOption<T extends string> = {
  value: T
  label: ReactNode
  disabled?: boolean
}

export interface RadioGroupProps<T extends string> extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'onChange'> {
  value: T
  onChange: (value: T) => void
  options: readonly RadioGroupOption<T>[]
  legend?: ReactNode
  name?: string
  orientation?: 'horizontal' | 'vertical'
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  legend,
  name,
  orientation = 'vertical',
  disabled = false,
  className = '',
  ...fieldsetProps
}: RadioGroupProps<T>) {
  const generatedName = useId()
  const groupName = name ?? generatedName

  return <fieldset {...fieldsetProps} disabled={disabled} className={`radio-group ${orientation}${className ? ` ${className}` : ''}`}>
    {legend != null && <legend>{legend}</legend>}
    {options.map((option) => <RadioButton
      key={option.value}
      name={groupName}
      value={option.value}
      checked={option.value === value}
      disabled={option.disabled}
      onChange={(checked) => { if (checked) onChange(option.value) }}
      label={option.label}
    />)}
  </fieldset>
}

export interface ToggleSwitchProps extends SelectorInputProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  detail?: ReactNode
}

export const ToggleSwitch = forwardRef<HTMLInputElement, ToggleSwitchProps>(function ToggleSwitch({
  checked,
  onChange,
  label,
  detail,
  disabled = false,
  className = '',
  ...inputProps
}, ref) {
  return <label className={`setting-row${disabled ? ' disabled' : ''}${className ? ` ${className}` : ''}`}>
    <span><strong>{label}</strong>{detail != null && <small>{detail}</small>}</span>
    <input {...inputProps} ref={ref} type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(event) => onChange(event.currentTarget.checked)} />
    <i className="switch" aria-hidden="true"><b /></i>
  </label>
})