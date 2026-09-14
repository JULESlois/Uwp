import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import './combobox.css'

export type ComboBoxOption<T extends string = string> = {
  value: T
  label: ReactNode
  textValue?: string
  disabled?: boolean
}

export type ComboBoxProps<T extends string = string> = {
  label: ReactNode
  value: T
  onChange: (value: T) => void
  options: readonly ComboBoxOption<T>[]
  disabled?: boolean
  placeholder?: string
  className?: string
}

function optionText(option: ComboBoxOption) {
  if (option.textValue) return option.textValue
  return typeof option.label === 'string' || typeof option.label === 'number' ? String(option.label) : option.value
}

type PopupPlacement = 'above' | 'below'

export function ComboBox<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = '请选择',
  className = '',
}: ComboBoxProps<T>) {
  const listId = useId()
  const labelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const typeaheadRef = useRef('')
  const typeaheadTimer = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [popupPlacement, setPopupPlacement] = useState<PopupPlacement>('below')
  const [popupMaxHeight, setPopupMaxHeight] = useState<number>()
  const selectedIndex = options.findIndex((option) => option.value === value)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, selectedIndex))

  const enabledIndices = useMemo(
    () => options.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0),
    [options],
  )

  useEffect(() => {
    if (!open || disabled) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [disabled, open])

  useEffect(() => () => {
    if (typeaheadTimer.current !== null) window.clearTimeout(typeaheadTimer.current)
  }, [])

  useEffect(() => {
    if (!open) return
    const selected = selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : enabledIndices[0] ?? 0
    setActiveIndex(selected)
  }, [enabledIndices, open, options, selectedIndex])

  useLayoutEffect(() => {
    if (!open) return
    const updatePlacement = () => {
      const root = rootRef.current
      if (!root) return
      const rect = root.getBoundingClientRect()
      const viewportPadding = 8
      const gap = 4
      const below = Math.max(0, window.innerHeight - rect.bottom - viewportPadding - gap)
      const above = Math.max(0, rect.top - viewportPadding - gap)
      const preferredHeight = Math.min(300, Math.max(152, popupRef.current?.scrollHeight ?? 0))
      const nextPlacement: PopupPlacement = below < preferredHeight && above > below ? 'above' : 'below'
      const available = nextPlacement === 'above' ? above : below
      setPopupPlacement(nextPlacement)
      setPopupMaxHeight(Math.max(96, Math.min(300, available)))
    }

    updatePlacement()
    window.addEventListener('resize', updatePlacement)
    window.addEventListener('scroll', updatePlacement, true)
    return () => {
      window.removeEventListener('resize', updatePlacement)
      window.removeEventListener('scroll', updatePlacement, true)
    }
  }, [open, options.length])

  useEffect(() => {
    if (!open) return
    popupRef.current?.querySelector<HTMLElement>(`[data-combo-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const optionId = (index: number) => `${listId}-option-${index}`

  const move = (delta: number) => {
    if (!enabledIndices.length) return
    const position = enabledIndices.indexOf(activeIndex)
    const origin = position >= 0 ? position : 0
    setActiveIndex(enabledIndices[(origin + delta + enabledIndices.length) % enabledIndices.length]!)
  }

  const choose = (index: number) => {
    const option = options[index]
    if (!option || option.disabled) return
    onChange(option.value)
    setActiveIndex(index)
    setOpen(false)
  }

  const runTypeahead = (key: string) => {
    if (typeaheadTimer.current !== null) window.clearTimeout(typeaheadTimer.current)
    typeaheadRef.current += key.toLocaleLowerCase()
    const query = typeaheadRef.current
    typeaheadTimer.current = window.setTimeout(() => { typeaheadRef.current = '' }, 650)

    const start = Math.max(0, activeIndex + 1)
    const ordered = [...options.slice(start), ...options.slice(0, start)]
    const match = ordered.find((option) => !option.disabled && optionText(option).toLocaleLowerCase().startsWith(query))
    if (!match) return
    const index = options.indexOf(match)
    if (index >= 0) {
      setActiveIndex(index)
      setOpen(true)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) setOpen(true)
      else move(1)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) setOpen(true)
      else move(-1)
      return
    }
    if (event.key === 'Home' && open) {
      event.preventDefault()
      setActiveIndex(enabledIndices[0] ?? 0)
      return
    }
    if (event.key === 'End' && open) {
      event.preventDefault()
      setActiveIndex(enabledIndices[enabledIndices.length - 1] ?? 0)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) choose(activeIndex)
      else setOpen(true)
      return
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      return
    }
    if (event.key === 'Tab') {
      setOpen(false)
      return
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) runTypeahead(event.key)
  }

  const selected = options[selectedIndex]
  const popupStyle: CSSProperties | undefined = popupMaxHeight ? { maxHeight: popupMaxHeight } : undefined

  return <div ref={rootRef} className={`combo-field${disabled ? ' disabled' : ''} ${className}`.trim()}>
    <span id={labelId} className="combo-label">{label}</span>
    <button
      type="button"
      className="combo-trigger"
      role="combobox"
      aria-labelledby={labelId}
      aria-controls={listId}
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-activedescendant={open && options[activeIndex] ? optionId(activeIndex) : undefined}
      disabled={disabled}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={onKeyDown}
    >
      <span className={selected ? '' : 'combo-placeholder'}>{selected?.label ?? placeholder}</span>
      <span className="combo-chevron" aria-hidden="true">⌄</span>
    </button>
    {open && !disabled && <div
      ref={popupRef}
      id={listId}
      className={`combo-popup combo-popup--${popupPlacement}`}
      role="listbox"
      aria-labelledby={labelId}
      style={popupStyle}
    >
      {options.map((option, index) => <button
        id={optionId(index)}
        data-combo-index={index}
        key={option.value}
        type="button"
        role="option"
        tabIndex={-1}
        className={`combo-option${index === activeIndex ? ' active' : ''}`}
        aria-selected={option.value === value}
        aria-disabled={option.disabled || undefined}
        disabled={option.disabled}
        onPointerDown={(event) => event.preventDefault()}
        onPointerEnter={() => { if (!option.disabled) setActiveIndex(index) }}
        onClick={() => choose(index)}
      >
        <span>{option.label}</span>
        {option.value === value && <span className="combo-selected-mark" aria-hidden="true" />}
      </button>)}
    </div>}
  </div>
}
