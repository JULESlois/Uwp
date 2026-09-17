# UWP React Lab

A React + TypeScript component library and implementation study for Windows 8 Modern UI and Windows 10 / early UWP interaction patterns.

The project has two roles that are intentionally kept separate:

- **Library** — reusable typed components, interaction primitives, design tokens and styles exported through stable package entry points.
- **Showcase / examples** — applications that consume the same public API instead of maintaining a parallel set of controls.

## Package usage

The repository is structured for npm distribution. After the first registry release, consumers will install the package together with its React peer dependencies:

```bash
npm install uwp-react-lab react react-dom
```

Load the shared styles once at application startup. The package root remains a convenience entry point:

```tsx
import { Button, ComboBox, CommandBar, ContentDialog } from 'uwp-react-lab'
import 'uwp-react-lab/styles.css'
```

For larger applications, prefer the domain entry points so dependencies reflect the application architecture:

```tsx
import { Button, ComboBox, Slider } from 'uwp-react-lab/controls'
import { CommandBar } from 'uwp-react-lab/commands'
import { AdaptiveNavigationView } from 'uwp-react-lab/navigation'
import { CollectionView } from 'uwp-react-lab/collections'
import { ContentDialog, Flyout } from 'uwp-react-lab/overlays'
```

React and React DOM are peer dependencies so applications keep ownership of their React runtime.

## Public API

The package currently exposes controls and patterns including:

- Button, CheckBox, RadioButton, RadioGroup, ToggleSwitch
- Slider, ComboBox, AutoSuggestBox, Calendar
- ProgressRing and ProgressBar
- Pivot, CommandBar, AppBar and PriorityCommandBar
- NavigationView variants and SplitView
- ListView / GridView selection collections
- ContentDialog, Flyout, TeachingTip, ContextMenu and SettingsPane
- Windows 8 / Windows 10 layout and interaction primitives

`src/index.ts` is the compatibility root. Domain entry points under `src/entrypoints` define narrower package boundaries for controls, commands, navigation, collections and overlays. New applications and examples should not import implementation modules directly.

## Example application

`examples/project-hub` is a small application built through package-style imports. It intentionally consumes the domain entry points so missing exports or broken subpath mappings fail the example build.

```bash
npm run dev:example
npm run build:example
```

## Development

```bash
npm install
npm run dev
```

The main showcase is deployed as a GitHub project page, so its Vite build uses `/Uwp/` as the base path.

## Validation

```bash
npm test
npm run build
npm run build:lib
npm run pack:check
npm run build:example
```

- `build` validates the showcase.
- `build:lib` emits the npm-facing ESM bundles, CSS and TypeScript declarations into `dist-lib`.
- `pack:check` runs the npm packaging lifecycle and reports the files that would be published.
- `build:example` verifies a consumer-style application against the package entry points.

CI validates the default React baseline and a separate React 19 consumer baseline for automation branches and pull requests.

## Architecture direction

The library is being decomposed toward domain-owned modules with stable package entry points. The public subpaths are intentionally introduced before large implementation moves so internal files can be split without forcing consumers to change imports. The next structural work is to move shared models such as collection item types into their owning domain and eliminate reverse dependencies between large implementation modules.

The showcase will likewise be split into independent pages and converted to consume only package boundaries. This prevents demo-only imports from becoming accidental public APIs and makes components easier to test, publish and reuse.

## Scope

This is not a pixel-identical WinUI compatibility layer. It focuses on the design grammar and interaction model: typography, spacing, flat surfaces, state transitions, direct manipulation, keyboard/focus behavior and adaptive layout.

The package has not yet selected a repository license; registry publication should not be treated as ready for third-party redistribution until that is resolved.
