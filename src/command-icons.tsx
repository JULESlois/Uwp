export type CommandIconName = 'search' | 'reset' | 'share' | 'pin' | 'sync' | 'devices' | 'more'

const glyphMap: Record<string, CommandIconName> = {
  '⌕': 'search',
  '⟲': 'reset',
  '↗': 'share',
  '⌖': 'pin',
  '↻': 'sync',
  '▣': 'devices',
}

export function commandIconFromGlyph(glyph?: string) {
  return glyph ? glyphMap[glyph] : undefined
}

export function CommandIcon({ name }: { name: CommandIconName }) {
  const common = {
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'search') return <svg {...common}><circle cx="8.2" cy="8.2" r="4.65" /><path d="m11.7 11.7 4.05 4.05" /></svg>
  if (name === 'reset') return <svg {...common}><path d="M4.15 7.05A6.25 6.25 0 1 1 4 12.35" /><path d="M4.15 7.05V3.55M4.15 7.05h3.5" /></svg>
  if (name === 'share') return <svg {...common}><path d="M7.4 12.6 14.85 5.15" /><path d="M10.65 5.15h4.2v4.2" /><path d="M13.6 11.25v3.4a1.75 1.75 0 0 1-1.75 1.75H5.35a1.75 1.75 0 0 1-1.75-1.75v-6.5A1.75 1.75 0 0 1 5.35 6.4h3.4" /></svg>
  if (name === 'pin') return <svg {...common}><path d="m7.1 3.8 5.8 5.8" /><path d="m6.1 8.6 5.3 5.3" /><path d="m8.05 4.75-2.2 2.2 1.25 1.65-3.25 3.25 4.3 4.3 3.25-3.25 1.65 1.25 2.2-2.2" /><path d="m6.15 13.85-2.3 2.3" /></svg>
  if (name === 'sync') return <svg {...common}><path d="M15.45 7.1A6.1 6.1 0 0 0 5.2 5.45L3.55 7.1" /><path d="M3.55 3.95V7.1H6.7" /><path d="M4.55 12.9A6.1 6.1 0 0 0 14.8 14.55l1.65-1.65" /><path d="M16.45 16.05V12.9H13.3" /></svg>
  if (name === 'devices') return <svg {...common}><rect x="3.25" y="4.1" width="13.5" height="9.35" rx=".6" /><path d="M7.1 16h5.8M10 13.45V16" /></svg>
  return <svg {...common}><circle cx="5" cy="10" r=".9" fill="currentColor" stroke="none" /><circle cx="10" cy="10" r=".9" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r=".9" fill="currentColor" stroke="none" /></svg>
}
