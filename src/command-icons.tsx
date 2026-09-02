export type CommandIconName = 'search' | 'reset' | 'share' | 'pin' | 'sync' | 'devices' | 'more' | 'start' | 'settings' | 'add' | 'delete' | 'blocked' | 'back' | 'close'

const glyphMap: Record<string, CommandIconName> = {
  '⌕': 'search',
  '⟲': 'reset',
  '↗': 'share',
  '⌖': 'pin',
  '↻': 'sync',
  '▣': 'devices',
  '⊞': 'start',
  '⚙': 'settings',
  '+': 'add',
  '×': 'delete',
  '·': 'blocked',
  '←': 'back',
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
  if (name === 'start') return <svg {...common}><path d="M3.4 3.7 9.2 2.9v6H3.4V3.7Zm7.4-1 5.8-.8v7h-5.8V2.7ZM3.4 10.6h5.8v6l-5.8-.8v-5.2Zm7.4 0h5.8v7l-5.8-.8v-6.2Z" /></svg>
  if (name === 'settings') return <svg {...common}><circle cx="10" cy="10" r="2.4" /><path d="M10 2.9v1.6M10 15.5v1.6M17.1 10h-1.6M4.5 10H2.9M15.02 4.98l-1.14 1.14M6.12 13.88l-1.14 1.14M15.02 15.02l-1.14-1.14M6.12 6.12 4.98 4.98" /></svg>
  if (name === 'add') return <svg {...common}><path d="M10 3.8v12.4M3.8 10h12.4" /></svg>
  if (name === 'delete') return <svg {...common}><path d="M5.3 6.25h9.4M7.2 6.25V4.4h5.6v1.85M6.4 6.25l.65 9.35h5.9l.65-9.35M8.6 8.4v5M11.4 8.4v5" /></svg>
  if (name === 'blocked') return <svg {...common}><circle cx="10" cy="10" r="6.35" /><path d="m5.55 5.55 8.9 8.9" /></svg>
  if (name === 'back') return <svg {...common}><path d="m9.2 4.3-5.7 5.7 5.7 5.7" /><path d="M3.8 10h12.7" /></svg>
  if (name === 'close') return <svg {...common}><path d="m5.1 5.1 9.8 9.8M14.9 5.1l-9.8 9.8" /></svg>
  return <svg {...common}><circle cx="5" cy="10" r=".9" fill="currentColor" stroke="none" /><circle cx="10" cy="10" r=".9" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r=".9" fill="currentColor" stroke="none" /></svg>
}
