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
    const root = container.firstElementChild

    expect(root).toHaveClass('uwp-theme-root', 'win10')
    expect(root).toHaveAttribute('data-uwp-era', 'win10')
    expect(root).toHaveAttribute('data-uwp-color-scheme', 'light')
    expect(screen.getByText('win10/light/standard/none')).toBeTruthy()
  })

  it('maps theme options to the existing era, dark and compact classes', () => {
    const { container } = render(
      <ThemeRoot theme={{ era: 'win8', colorScheme: 'dark', density: 'compact', accentColor: '#0078d4', reducedMotion: true }}>
        <Probe />
      </ThemeRoot>,
    )
    const root = container.firstElementChild as HTMLElement

    expect(root).toHaveClass('uwp-theme-root', 'win8', 'dark', 'compact')
    expect(root).toHaveAttribute('data-uwp-reduced-motion', 'true')
    expect(root.style.getPropertyValue('--accent')).toBe('#0078d4')
    expect(screen.getByText('win8/dark/compact/#0078d4')).toBeTruthy()
  })
})
