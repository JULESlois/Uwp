import { describe, expect, it } from 'vitest'
import { clampDate, daysInMonth, moveMonthPreservingDay, startOfDay } from './calendar-utils'

const ymd = (value: Date) => [value.getFullYear(), value.getMonth() + 1, value.getDate()]

describe('Calendar date utilities', () => {
  it('preserves the day when the target month can represent it', () => {
    expect(ymd(moveMonthPreservingDay(new Date(2026, 0, 15), 1))).toEqual([2026, 2, 15])
  })

  it('clamps month movement to the last valid day', () => {
    expect(ymd(moveMonthPreservingDay(new Date(2025, 0, 31), 1))).toEqual([2025, 2, 28])
    expect(ymd(moveMonthPreservingDay(new Date(2024, 0, 31), 1))).toEqual([2024, 2, 29])
  })

  it('preserves leap-day semantics when moving by years', () => {
    expect(ymd(moveMonthPreservingDay(new Date(2024, 1, 29), 12))).toEqual([2025, 2, 28])
    expect(ymd(moveMonthPreservingDay(new Date(2024, 1, 29), -12))).toEqual([2023, 2, 28])
  })

  it('clamps dates to inclusive min and max bounds', () => {
    const min = new Date(2026, 4, 10, 18)
    const max = new Date(2026, 4, 20, 3)
    expect(ymd(clampDate(new Date(2026, 4, 1), min, max))).toEqual([2026, 5, 10])
    expect(ymd(clampDate(new Date(2026, 4, 15), min, max))).toEqual([2026, 5, 15])
    expect(ymd(clampDate(new Date(2026, 4, 31), min, max))).toEqual([2026, 5, 20])
  })

  it('normalizes returned values to local start of day', () => {
    const value = startOfDay(new Date(2026, 8, 14, 23, 59, 59))
    expect(value.getHours()).toBe(0)
    expect(value.getMinutes()).toBe(0)
    expect(value.getSeconds()).toBe(0)
    expect(value.getMilliseconds()).toBe(0)
  })

  it('reports leap-year month lengths correctly', () => {
    expect(daysInMonth(2024, 1)).toBe(29)
    expect(daysInMonth(2025, 1)).toBe(28)
    expect(daysInMonth(2026, 8)).toBe(30)
  })
})
