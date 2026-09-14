export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate())

export const addDays = (value: Date, amount: number) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate() + amount)

export const addMonths = (value: Date, amount: number) =>
  new Date(value.getFullYear(), value.getMonth() + amount, 1)

export const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate()

export const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

export const moveMonthPreservingDay = (value: Date, amount: number) => {
  const month = new Date(value.getFullYear(), value.getMonth() + amount, 1)
  return new Date(
    month.getFullYear(),
    month.getMonth(),
    Math.min(value.getDate(), daysInMonth(month.getFullYear(), month.getMonth())),
  )
}

export const clampDate = (value: Date, min?: Date, max?: Date) => {
  const day = startOfDay(value)
  if (min && day < startOfDay(min)) return startOfDay(min)
  if (max && day > startOfDay(max)) return startOfDay(max)
  return day
}
