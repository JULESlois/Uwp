# UWP React Lab

A React + TypeScript component library and implementation study for Windows 8 Modern UI and Windows 10 / early UWP interaction patterns.

The project has two roles that are intentionally kept separate:

- **Library** — reusable typed components, interaction primitives, design tokens and styles exported from `src/index.ts`.
- **Showcase / examples** — applications that consume the same public API instead of maintaining a parallel set of controls.

## Package usage

The repository is structured for npm distribution. After the first registry release, consumers will install the package together with its React peer dependencies:

```bash
npm install uwp-react-lab react react-dom
```

Import components only from the package root and load the shared styles once at application startup:

```tsx
import { Button, ComboBox, CommandBar, ContentDialog } from 'uwp-react-lab'
import 'uwp-react-lab/styles.css'
```

React and React DOM are peer dependencies so applications keep ownership of their React runtime.

## Public API

The package currently exposes controls and patterns including:

- Button, CheckBox, RadioButton, ToggleSwitch
- Slider, ComboBox, AutoSuggestBox, Calendar
- ProgressRing and ProgressBar
- Pivot, CommandBar, AppBar and PriorityCommandBar
- NavigationView variants and SplitView
- ListView / GridView selection collections
- ContentDialog, Flyout, TeachingTip, ContextMenu and SettingsPane
- Windows 8 / Windows 10 layout and interaction primitives

`src/index.ts` is the package boundary. New applications and examples should not import implementation modules directly.

## Example application

`examples/project-hub` is a small application built through the package-style public import. During repository development, Vite and TypeScript map `uwp-react-lab` back to `src/index.ts`, so missing exports are caught by the example build.

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
- `build:lib` emits the npm-facing ESM bundle, CSS and TypeScript declarations into `dist-lib`.
- `pack:check` runs the npm packaging lifecycle and reports the files that would be published.
- `build:example` verifies a consumer-style application against the public entry point.

CI runs all four product-level checks for automation branches and pull requests.

## Architecture direction

The library is being decomposed toward smaller component modules with explicit public APIs. The showcase will likewise be split into independent pages and converted to consume only the package boundary. This prevents demo-only imports from becoming accidental public APIs and makes components easier to test, publish and reuse.

## Scope

This is not a pixel-identical WinUI compatibility layer. It focuses on the design grammar and interaction model: typography, spacing, flat surfaces, state transitions, direct manipulation, keyboard/focus behavior and adaptive layout.

The package has not yet selected a repository license; registry publication should not be treated as ready for third-party redistribution until that is resolved.
