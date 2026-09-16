import { createContext, useContext, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react'

export type UwpEra = 'win8' | 'win10'
export type UwpColorScheme = 'light' | 'dark'
export type UwpDensity = 'standard' | 'compact'

export type UwpTheme = {
  era: UwpEra
  colorScheme: UwpColorScheme
  density: UwpDensity
  accentColor?: string
  reducedMotion?: boolean
}

export const defaultUwpTheme: UwpTheme = {
  era: 'win10',
  colorScheme: 'light',
  density: 'standard',
}

const UwpThemeContext = createContext<UwpTheme>(defaultUwpTheme)

export type ThemeRootProps = Omit<HTMLAttributes<HTMLDivElement>, 'color'> & {
  children: ReactNode
  theme?: Partial<UwpTheme>
}

export function ThemeRoot({ children, theme, className = '', style, ...props }: ThemeRootProps) {
  const parentTheme = useContext(UwpThemeContext)
  const value = { ...parentTheme, ...theme }
  const classes = [
    'uwp-theme-root',
    value.era,
    value.colorScheme === 'dark' ? 'dark' : '',
    value.density === 'compact' ? 'compact' : '',
    className,
  ].filter(Boolean).join(' ')
  const themeStyle = value.accentColor
    ? ({ '--accent': value.accentColor, ...style } as CSSProperties)
    : style

  return (
    <UwpThemeContext.Provider value={value}>
      <div
        {...props}
        className={classes}
        data-uwp-era={value.era}
        data-uwp-color-scheme={value.colorScheme}
        data-uwp-density={value.density}
        data-uwp-reduced-motion={value.reducedMotion ? 'true' : undefined}
        style={themeStyle}
      >
        {children}
      </div>
    </UwpThemeContext.Provider>
  )
}

export function useUwpTheme() {
  return useContext(UwpThemeContext)
}
