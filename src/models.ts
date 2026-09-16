import type { CommandIconName } from './command-icons'

/** Shared navigation item model used by navigation surfaces. */
export type NavItem<T extends string> = {
  key: T
  glyph: string
  label: string
}

/** Responsive pane presentation mode used by navigation surfaces. */
export type PaneMode = 'auto' | 'compact' | 'expanded'

/** Command model shared by command bars and application bars. */
export type Command = {
  label: string
  glyph?: string
  icon?: CommandIconName
  onClick?: () => void
  primary?: boolean
  disabled?: boolean
}

/** Collection item model shared by list/grid collection surfaces. */
export type ListItem = {
  key: string
  title: string
  detail?: string
  glyph?: string
  disabled?: boolean
}
