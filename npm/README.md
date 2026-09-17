# uwp_components

React + TypeScript components inspired by Windows 8 Modern UI and Windows 10 / early UWP interaction patterns.

The package focuses on reusable controls, navigation, command surfaces, collections, overlays, keyboard/focus behavior, and a restrained UWP visual language. It is not a pixel-identical WinUI port.

## Install

```bash
npm install uwp_components react react-dom
```

React and React DOM are peer dependencies. React 18.3+ and React 19 are covered by the repository CI matrix.

Load the shared stylesheet once near your application entry point:

```ts
import 'uwp_components/styles.css'
```

## Quick start

```tsx
import { Button, ComboBox, Slider } from 'uwp_components/controls'
import { CommandBar } from 'uwp_components/commands'
import { ContentDialog } from 'uwp_components/overlays'
import { useState } from 'react'

export function ProjectToolbar() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [density, setDensity] = useState('comfortable')
  const [zoom, setZoom] = useState(75)

  return (
    <>
      <CommandBar
        ariaLabel="Project commands"
        commands={[
          { label: 'New', glyph: '+', primary: true, onClick: () => setDialogOpen(true) },
          { label: 'Refresh', glyph: '↻' },
        ]}
      />

      <ComboBox
        label="Density"
        value={density}
        onChange={setDensity}
        options={[
          { value: 'comfortable', label: 'Comfortable' },
          { value: 'compact', label: 'Compact' },
        ]}
      />

      <Slider
        label="Zoom"
        value={zoom}
        onValueChange={setZoom}
        formatValue={(value) => `${value}%`}
      />

      <Button variant="accent" onClick={() => setDialogOpen(true)}>
        Create project
      </Button>

      <ContentDialog
        open={dialogOpen}
        title="Create project"
        onClose={() => setDialogOpen(false)}
        primaryButtonText="Create"
        secondaryButtonText="Cancel"
      >
        Configure the project here.
      </ContentDialog>
    </>
  )
}
```

## Import paths

The root export remains available:

```ts
import { Button, NavigationView, ContentDialog } from 'uwp_components'
```

For clearer dependencies and better long-term API boundaries, prefer the domain entry points:

```ts
import { Button, CheckBox, RadioGroup, Slider, ComboBox, Calendar, ProgressBar } from 'uwp_components/controls'
import { CommandBar, AppBar, PriorityCommandBar } from 'uwp_components/commands'
import { NavigationView, SplitView } from 'uwp_components/navigation'
import { ListView, GridView } from 'uwp_components/collections'
import { ContentDialog, Flyout, TeachingTip, ContextMenu, SettingsPane } from 'uwp_components/overlays'
```

## Theming

The package exports `ThemeRoot` from the root entry point. It can define UWP era, color mode, density, accent color, and reduced-motion behavior for a subtree.

```tsx
import { ThemeRoot } from 'uwp_components'
import { Button } from 'uwp_components/controls'

export function App() {
  return (
    <ThemeRoot
      theme={{
        era: 'win10',
        colorMode: 'dark',
        density: 'standard',
        accent: '#0078d7',
      }}
    >
      <Button variant="accent">Continue</Button>
    </ThemeRoot>
  )
}
```

Nested `ThemeRoot` instances inherit the parent theme and only override the fields they specify.

## Component groups

**Controls**

Button, CheckBox, RadioButton, RadioGroup, ToggleSwitch, Slider, ComboBox, AutoSuggestBox, Calendar, ProgressRing, and ProgressBar.

**Commands**

CommandBar, AppBar, EdgeAppBar, PriorityCommandBar, and command icon helpers.

**Navigation**

NavigationView variants, SplitView, Pivot, and related navigation patterns.

**Collections**

List/grid collection patterns with selection, keyboard navigation, invocation, reorder, and cross-drop behavior.

**Overlays**

ContentDialog, Flyout, TeachingTip, ContextMenu, and SettingsPane with focus lifecycle handling.

## Accessibility and interaction

The library aims to preserve native DOM semantics where possible and includes keyboard/focus contracts for components such as ComboBox, Calendar, CommandBar, dialogs, flyouts, selectors, and collection views. Many reusable components expose their underlying DOM element through refs and accept standard HTML/ARIA attributes.

## Styles

Import the aggregate stylesheet once:

```ts
import 'uwp_components/styles.css'
```

The visual direction intentionally avoids heavy shadows, oversized rounded cards, and decorative motion that do not belong to the Windows 8/10 / early UWP design grammar.

## TypeScript

Type declarations are included with the package. Domain subpath imports also ship their own declaration entry points.

## Repository

Source code, Showcase, examples, implementation notes, tests, and development documentation live in the GitHub repository:

https://github.com/JULESlois/Uwp
