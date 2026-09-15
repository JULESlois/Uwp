/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ThemeRoot, useUwpTheme } from './theme'

function Probe() {
  const theme = useUwpTheme()
  return <span>{`${theme.era}/${theme.colorScheme}/${theme.density}/${theme.accentColor ?? 'none'}`}</span>
}

describe('ThemeRoot', () => {
  it('provides defaults and stable theme attributes', () => {
    const { container } = render(<ThemeRoot><Probe /></ThemeRoot>)
    const root = container.firstElementChild as HTMLElement

    expect(root.classList.contains('uwp-theme-root')).toBe(true)
    expect(root.classList.contains('win10')).toBe(true)
    expect(root.getAttribute('data-uwp-era')).toBe('win10')
    expect(root.getAttribute('data-uwp-color-scheme')).toBe('light')
    expect(screen.getByText('win10/light/standard/none')).toBeTruthy()
  })

  it('maps theme options to the existing era, dark and compact classes', () => {
    const { container } = render(
      <ThemeRoot theme={{ era: 'win8', colorScheme: 'dark', density: 'compact', accentColor: '#0078d4', reducedMotion: true }}>
        <Probe />
      </ThemeRoot>,
    )
    const root = container.firstElementChild as HTMLElement

    expect(['uwp-theme-root', 'win8', 'dark', 'compact'].every((name) => root.classList.contains(name))).toBe(true)
    expect(root.getAttribute('data-uwp-reduced-motion')).toBe('true')
    expect(root.style.getPropertyValue('--accent')).toBe('#0078d4')
    expect(screen.getByText('win8/dark/compact/#0078d4')).toBeTruthy()
  })
})
