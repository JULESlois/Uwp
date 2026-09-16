export type NavItem<T extends string> = { key: T; glyph: string; label: string }
export type PaneMode = 'auto' | 'compact' | 'expanded'
export type ListItem = { key: string; title: string; detail?: string; glyph?: string; disabled?: boolean }
