# UWP React Lab

A React + TypeScript component library and implementation study for Windows 8 Modern UI and Windows 10 / early UWP interaction patterns.

The project has two roles that are intentionally kept separate:

- **Library** — reusable typed components, interaction primitives, design tokens and styles exported through stable package entry points.
- **Showcase / examples** — applications that consume the same public API instead of maintaining a parallel set of controls.

The GitHub repository documents development, architecture, Showcase work, examples, and implementation research. The published npm package uses a separate usage-first README from `npm/README.md` and does not publish Showcase or example sources.

## Package usage

The public npm package is `uwp_components`:

```bash
npm install uwp_components react react-dom
```

Load the shared styles once at application startup. The package root remains a convenience entry point:

```tsx
import { Button, ComboBox, CommandBar, ContentDialog } from 'uwp_components'
import 'uwp_components/styles.css'
```

For larger applications, prefer the domain entry points so dependencies reflect the application architecture:

```tsx
import { Button, ComboBox, Slider } from 'uwp_components/controls'
import { CommandBar } from 'uwp_components/commands'
import { AdaptiveNavigationView } from 'uwp_components/navigation'
import { CollectionView } from 'uwp_components/collections'
import { ContentDialog, Flyout } from 'uwp_components/overlays'
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

## Showcase and example application

The repository contains the main component Showcase plus `examples/project-hub`, a small application built through package-style imports. These are development and demonstration surfaces; they are intentionally excluded from the staged npm package.

```bash
npm run dev
npm run dev:example
npm run build:example
```

## Development

```bash
npm install
npm run dev
```

The main Showcase is deployed as a GitHub project page, so its Vite build uses `/Uwp/` as the base path.

## Validation

```bash
npm test
npm run build
npm run build:lib
npm run pack:check
npm run build:example
```

- `build` validates the Showcase.
- `build:lib` emits the npm-facing ESM bundles, CSS and TypeScript declarations into `dist-lib`.
- `package:stage` builds the library and creates a clean `npm-package/` directory containing only publishable runtime files, package metadata, and the npm-specific README.
- `pack:check` dry-runs npm packaging from that staged directory rather than from the repository root.
- `build:example` verifies a consumer-style application against the package entry points.

### Registry release

The repository root stays `private`; releases use npm Trusted Publishing with staged publishing instead of direct automated publication or a long-lived write token.

1. Bump `package.json` to the intended semver version and merge the tested commit to `main`.
2. Create a Git tag named exactly `v<version>` from that commit, for example `v0.1.1`.
3. Publish the corresponding non-prerelease GitHub Release.
4. `.github/workflows/publish-npm.yml` verifies the tag/version contract, reruns tests and package validation, then stages `npm-package/` on npm through OIDC.
5. Review the staged package on npm and approve it with 2FA before it becomes public.

A local authenticated staging run is available as `npm run stage:npm`; there is intentionally no repository script that performs direct `npm publish`.

Before the first automated release, configure the `uwp_components` npm Trusted Publisher for GitHub Actions with repository `JULESlois/Uwp`, workflow filename `publish-npm.yml`, environment `npm`, and stage-publish permission. No long-lived `NPM_TOKEN` is required.

CI validates the default React baseline and a separate React 19 consumer baseline for automation branches and pull requests.

## Architecture direction

The library is being decomposed toward domain-owned modules with stable package entry points. The public subpaths are intentionally introduced before large implementation moves so internal files can be split without forcing consumers to change imports. The next structural work is to move shared models such as collection item types into their owning domain and eliminate reverse dependencies between large implementation modules.

The Showcase will likewise be split into independent pages and converted to consume only package boundaries. This prevents demo-only imports from becoming accidental public APIs and makes components easier to test, publish and reuse.

## Scope

This is not a pixel-identical WinUI compatibility layer. It focuses on the design grammar and interaction model: typography, spacing, flat surfaces, state transitions, direct manipulation, keyboard/focus behavior and adaptive layout.

The package has not yet selected a repository license; registry publication should not be treated as ready for third-party redistribution until that is resolved.
