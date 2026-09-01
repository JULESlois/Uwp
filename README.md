# UWP React Lab

React + TypeScript + Vite implementation study of Windows 8 Modern UI and Windows 10 / early UWP interaction patterns.

## Included

- Metro-style Start screen and tiles
- NavigationView-like responsive navigation
- CommandBar-like toolbar
- Windows 8 / Windows 10 presentation switch
- Button, selection, TextBox, ComboBox, ToggleSwitch, ProgressRing and ProgressBar studies
- Light / dark theme tokens
- Compact density and reduced-motion states
- GitHub Pages deployment via GitHub Actions

## Local development

```bash
npm install
npm run dev
```

The repository is deployed as a GitHub project page, so Vite uses `/Uwp/` as its base path.

## Build

```bash
npm run build
```

## Scope

This is a design and implementation study, not a pixel-identical WinUI compatibility layer. It focuses on the design grammar: typography, spacing, flat surfaces, state transitions, direct manipulation and adaptive layout.
