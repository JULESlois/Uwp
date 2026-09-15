// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { ComboBox } from './combobox'

const options = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'blocked', label: 'Blocked', disabled: true },
  { value: 'charlie', label: 'Charlie' },
] as const

function StatefulCombo() {
  const [value, setValue] = useState<(typeof options)[number]['value']>('alpha')
  return <ComboBox label="Mode" value={value} onChange={setValue} options={options} />
}

describe('ComboBox DOM behavior', () => {
  it('opens with an enabled active descendant and skips disabled options', () => {
    render(<StatefulCombo />)
    const trigger = screen.getByRole('combobox', { name: 'Mode' })

    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const initialActive = trigger.getAttribute('aria-activedescendant')
    expect(initialActive).toBeTruthy()
    expect(document.getElementById(initialActive!)?.textContent).toContain('Alpha')

    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    const nextActive = trigger.getAttribute('aria-activedescendant')
    expect(nextActive).toBeTruthy()
    expect(document.getElementById(nextActive!)?.textContent).toContain('Charlie')
  })

  it('closes with Escape without changing the selected value', () => {
    render(<StatefulCombo />)
    const trigger = screen.getByRole('combobox', { name: 'Mode' })

    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'Escape' })

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.textContent).toContain('Alpha')
    expect(trigger.hasAttribute('aria-activedescendant')).toBe(false)
  })

  it('commits the active enabled option with Enter', () => {
    render(<StatefulCombo />)
    const trigger = screen.getByRole('combobox', { name: 'Mode' })

    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    fireEvent.keyDown(trigger, { key: 'Enter' })

    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.textContent).toContain('Charlie')
  })
})
