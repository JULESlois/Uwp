import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import './calendar.css'
import { addDays, addMonths, clampDate, daysInMonth, moveMonthPreservingDay, sameDay, sameMonth, startOfDay } from './calendar-utils'

export type CalendarProps = {
  value?: Date
  defaultValue?: Date
  onValueChange?: (value: Date) => void
  min?: Date
  max?: Date
  locale?: string
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  disabled?: boolean
  label?: string
  previousMonthLabel?: string
  nextMonthLabel?: string
}

export function Calendar({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  locale = 'zh-CN',
  firstDayOfWeek = 1,
  disabled = false,
  label = '选择日期',
  previousMonthLabel = '上个月',
  nextMonthLabel = '下个月',
}: CalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), [])
  const initial = clampDate(value ?? defaultValue ?? today, min, max)
  const [internalValue, setInternalValue] = useState(initial)
  const selected = clampDate(value ?? internalValue, min, max)
  const [viewMonth, setViewMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
  const [focusedDate, setFocusedDate] = useState(selected)
  const gridRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const controlled = value !== undefined

  useEffect(() => {
    const next = clampDate(value ?? internalValue, min, max)
    if (!sameDay(next, internalValue)) setInternalValue(next)
    setFocusedDate(next)
    setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1))
  }, [value, min, max])

  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }), [locale])
  const dayFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'short' }), [locale])
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }), [locale])

  const weekdays = useMemo(() => {
    const sunday = new Date(2024, 0, 7)
    return Array.from({ length: 7 }, (_, index) => dayFormatter.format(addDays(sunday, (firstDayOfWeek + index) % 7)))
  }, [dayFormatter, firstDayOfWeek])

  const days = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
    const offset = (first.getDay() - firstDayOfWeek + 7) % 7
    const start = addDays(first, -offset)
    return Array.from({ length: 42 }, (_, index) => addDays(start, index))
  }, [firstDayOfWeek, viewMonth])
  const weeks = useMemo(() => Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7)), [days])

  const isDisabled = (date: Date) => disabled
    || Boolean(min && startOfDay(date) < startOfDay(min))
    || Boolean(max && startOfDay(date) > startOfDay(max))

  const commit = (date: Date) => {
    if (isDisabled(date)) return
    const next = startOfDay(date)
    if (!controlled) setInternalValue(next)
    setFocusedDate(next)
    setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1))
    onValueChange?.(next)
  }

  const moveFocus = (next: Date) => {
    const clamped = clampDate(next, min, max)
    setFocusedDate(clamped)
    setViewMonth(new Date(clamped.getFullYear(), clamped.getMonth(), 1))
    requestAnimationFrame(() => {
      const key = `${clamped.getFullYear()}-${clamped.getMonth()}-${clamped.getDate()}`
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)?.focus()
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    let next: Date | null = null
    if (event.key === 'ArrowLeft') next = addDays(date, -1)
    if (event.key === 'ArrowRight') next = addDays(date, 1)
    if (event.key === 'ArrowUp') next = addDays(date, -7)
    if (event.key === 'ArrowDown') next = addDays(date, 7)
    if (event.key === 'Home') next = addDays(date, -((date.getDay() - firstDayOfWeek + 7) % 7))
    if (event.key === 'End') next = addDays(date, 6 - ((date.getDay() - firstDayOfWeek + 7) % 7))
    if (event.key === 'PageUp') next = moveMonthPreservingDay(date, -(event.shiftKey ? 12 : 1))
    if (event.key === 'PageDown') next = moveMonthPreservingDay(date, event.shiftKey ? 12 : 1)
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      commit(date)
      return
    }
    if (!next) return
    event.preventDefault()
    moveFocus(next)
  }

  const previousMonthDisabled = Boolean(min && viewMonth <= new Date(min.getFullYear(), min.getMonth(), 1))
  const nextMonthDisabled = Boolean(max && addMonths(viewMonth, 1) > new Date(max.getFullYear(), max.getMonth(), 1))
  const navigateMonth = (amount: number) => {
    const targetMonth = addMonths(viewMonth, amount)
    const basis = sameMonth(focusedDate, viewMonth) ? focusedDate : selected
    const candidate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(basis.getDate(), daysInMonth(targetMonth.getFullYear(), targetMonth.getMonth())))
    const nextFocus = clampDate(candidate, min, max)
    setViewMonth(new Date(nextFocus.getFullYear(), nextFocus.getMonth(), 1))
    setFocusedDate(nextFocus)
  }

  return <section className={`calendar${disabled ? ' calendar--disabled' : ''}`} aria-labelledby={titleId} aria-disabled={disabled || undefined}>
    <header className="calendar__header">
      <h3 id={titleId}>{label}</h3>
      <div className="calendar__month-nav">
        <button type="button" aria-label={previousMonthLabel} disabled={disabled || previousMonthDisabled} onClick={() => navigateMonth(-1)}>‹</button>
        <strong aria-live="polite">{monthFormatter.format(viewMonth)}</strong>
        <button type="button" aria-label={nextMonthLabel} disabled={disabled || nextMonthDisabled} onClick={() => navigateMonth(1)}>›</button>
      </div>
    </header>
    <div ref={gridRef} className="calendar__grid" role="grid" aria-labelledby={titleId} aria-rowcount={7} aria-colcount={7}>
      <div className="calendar__weekdays" role="row">{weekdays.map((day, index) => <span key={`${day}-${index}`} role="columnheader">{day}</span>)}</div>
      {weeks.map((week, rowIndex) => <div className="calendar__row" role="row" key={`${viewMonth.getFullYear()}-${viewMonth.getMonth()}-${rowIndex}`}>
        {week.map((date) => {
          const selectedDay = sameDay(date, selected)
          const focused = sameDay(date, focusedDate)
          const outside = date.getMonth() !== viewMonth.getMonth()
          const unavailable = isDisabled(date)
          const isToday = sameDay(date, today)
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
          return <div key={key} className="calendar__cell" role="gridcell" aria-selected={selectedDay}>
            <button
              type="button"
              data-date={key}
              className={`calendar__day${outside ? ' is-outside' : ''}${isToday ? ' is-today' : ''}${selectedDay ? ' is-selected' : ''}`}
              aria-current={isToday ? 'date' : undefined}
              aria-label={dateFormatter.format(date)}
              tabIndex={!unavailable && focused ? 0 : -1}
              disabled={unavailable}
              onFocus={() => setFocusedDate(date)}
              onKeyDown={(event) => handleKeyDown(event, date)}
              onClick={() => commit(date)}
            >
              <span>{date.getDate()}</span>
            </button>
          </div>
        })}
      </div>)}
    </div>
  </section>
}
