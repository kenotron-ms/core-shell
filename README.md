# core-shell

**VS Code's shell without the editor.** An npm library that provides a complete Electron desktop application chrome — activity rail, sidebars, canvas, command palette, status bar — where all content is defined by extensions.

[![npm](https://img.shields.io/npm/v/core-shell)](https://www.npmjs.com/package/core-shell)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## What is core-shell?

Desktop tooling for developer workflows needs a composable, extensible UI shell — one that provides professional-grade chrome without forcing every tool to reinvent it. VS Code proved this model works, but its extension API is heavyweight and tightly coupled to its editor architecture.

core-shell extracts the shell concept into a standalone platform where the "editor area" is a blank canvas owned entirely by extensions. You import core-shell, wrap your app in `<ShellProvider>`, and get a full VS Code-style layout engine for free. Your extensions define what goes in each slot — sidebar content, main canvas, properties panel, status bar items.

Extensions are React components. No separate process. No IPC overhead. One folder, one manifest export, restart, done. The shell handles layout, resize, collapse, command palette, and error boundaries. You handle your product.

## Demo

Run the included `demo-app` to see core-shell in action with the Hello World extension loaded:

- **Activity rail** on the left edge — a 👋 icon for the Hello World extension
- **Left sidebar** (220px) — navigation items: "Getting started", "Extension slots", "Shell API", "Publishing"
- **Main canvas** — centered hero with the extension manifest rendered as a code block
- **Right sidebar** (280px) — properties panel showing extension metadata
- **Status bar** at the bottom — extension name on the left, "ready" on the right
- **Command palette** — press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)

All sidebars are resizable by dragging the border handle. Drag past the snap threshold and the panel collapses entirely. Drag from the edge to re-expand. No buttons — pure border-drag.

## Getting started

**Prerequisites:** Node.js 20+, pnpm 9+

```bash
# Clone and install
git clone https://github.com/kenotron-ms/core-shell.git
cd core-shell
pnpm install
```

```bash
# Build all packages (core-shell → ext-hello-world → demo-app)
pnpm build
```

```bash
# Run the demo app with hot reload
pnpm dev
```

`pnpm dev` starts `electron-vite dev` inside `packages/demo-app`. The Electron window opens with the full shell chrome and the Hello World extension rendered in all slots.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Title Bar (28px)                       │
├────┬─────────────┬──┬───────────────────┬──┬─────────────────┤
│    │             │  │                   │  │                 │
│ A  │   Left      │◄►│      Canvas       │◄►│    Right        │
│ c  │   Sidebar   │  │                   │  │    Sidebar      │
│ t  │             │  │  (extension-      │  │                 │
│ i  │  (extension │  │   defined         │  │  (extension-    │
│ v  │   sidebar)  │  │   content)        │  │   defined       │
│ i  │             │  │                   │  │   properties)   │
│ t  │  220px      │  │  fills remaining  │  │  280px          │
│ y  │  default    │  │  space            │  │  default        │
│    │             │  │                   │  │                 │
│ R  │  collapsible│  │                   │  │  collapsible    │
│ a  │  via drag   │  │                   │  │  via drag       │
│ i  │             │  │                   │  │                 │
│ l  │             │  │                   │  │                 │
│    │             │  │                   │  │                 │
│44px│             │4px│                   │4px│                 │
├────┴─────────────┴──┴───────────────────┴──┴─────────────────┤
│                       Status Bar (20px)                       │
└──────────────────────────────────────────────────────────────┘

◄► = drag handle (snap-to-hide when dragged past threshold)
```

| Region | Description |
|---|---|
| **Title bar** | macOS traffic lights + app name. Draggable for window positioning. |
| **Activity rail** | 44px icon strip. Each extension contributes an icon + sidebar view. Click to switch active extension. Active item has a blue accent bar. |
| **Left sidebar** | Collapsible panel (220px default). Extension-defined content — navigation, file trees, lists. Snap threshold: 80px. Min open width: 150px. |
| **Canvas** | Main content area. Fills all remaining horizontal and vertical space. One active extension at a time. |
| **Right sidebar** | Collapsible panel (280px default). Extension-defined properties/context. Snap threshold: 60px. Min open width: 200px. |
| **Status bar** | 20px footer. Left-aligned: active extension name. Right-aligned: status text. Blue background. |
| **Command palette** | Modal overlay triggered by `Cmd+Shift+P`. Extensions register commands via `shell.registerCommand()`. |

## Writing your first extension

An extension is a package that exports a `manifest` object. The manifest declares which slots the extension contributes to and provides React components for each:

```tsx
// packages/ext-my-tool/src/index.tsx
import { useExtensionStore } from 'core-shell'

function MySidebar() {
  return <div style={{ padding: 12 }}>My navigation</div>
}

function MyCanvas() {
  const [state, setState] = useExtensionStore({ count: 0 })
  return (
    <div style={{ padding: 24 }}>
      <h1>Count: {state.count}</h1>
      <button onClick={() => setState({ count: state.count + 1 })}>
        Increment
      </button>
    </div>
  )
}

export const manifest = {
  id: 'ext-my-tool',
  displayName: 'My Tool',
  version: '0.1.0',
  contributes: {
    activityRail: { icon: '🔧', title: 'My Tool' },
    sidebar: MySidebar,
    canvas: MyCanvas,
  },
}
```

Then wire it into your app:

```tsx
// App.tsx
import { ShellProvider, Shell } from 'core-shell'
import 'core-shell/dist/style.css'
import { manifest as myTool } from 'ext-my-tool'

export function App() {
  return (
    <ShellProvider extensions={[myTool]}>
      <Shell />
    </ShellProvider>
  )
}
```

The shell handles everything else — layout, resize, activity rail icon, command palette, error boundaries.

## Extension slot reference

Every slot is optional. Contribute only what your extension needs.

| Slot | Type | Description |
|---|---|---|
| `activityRail` | `{ icon: ReactNode; title: string }` | Icon (emoji, SVG, or component) displayed in the 44px activity rail. `title` is the tooltip. Clicking switches the active extension. |
| `sidebar` | `React.ComponentType` | Left sidebar content. Rendered inside a scrollable container. Default width: 220px. |
| `canvas` | `React.ComponentType` | Main content area. Fills all remaining space. This is your extension's primary UI. |
| `rightSidebar` | `React.ComponentType` | Right sidebar / properties panel. Default width: 280px. |
| `panel` | `React.ComponentType` | Bottom panel — terminal, output, logs. *(Phase 1B — not yet implemented)* |
| `statusBar` | `Array<{ position: 'left' \| 'right'; component: React.ComponentType }>` | Status bar items. *(Phase 1B — not yet implemented)* |

## Shell API

### `useShell()`

Available inside any component rendered within `<ShellProvider>`. Returns the shell store with actions.

| Method | Description | Status |
|---|---|---|
| `setActiveExtension(id)` | Switch the active extension by ID | ✅ Available |
| `openTab(tab)` | Open a new tab: `{ id, label, extensionId }` | ✅ Available |
| `closeTab(id)` | Close a tab by ID | ✅ Available |
| `setActiveTab(id)` | Switch to a tab by ID | ✅ Available |
| `registerCommand(cmd)` | Register a command: `{ id, label, onSelect }` | ✅ Available |
| `openCommandPalette()` | Open the command palette programmatically | ✅ Available |
| `setLayout(patch)` | Update layout: `{ sidebarWidth?, panelHeight?, rightSidebarWidth? }` | ✅ Available |
| `ipc.readFile(path)` | Read a file via the main process IPC bridge | 🔜 Phase 1B |
| `ipc.writeFile(path, content)` | Write a file via the main process IPC bridge | 🔜 Phase 1B |
| `ipc.watchDir(path, callback)` | Watch a directory for changes. Returns unsubscribe function. | 🔜 Phase 1B |
| `ipc.spawn(cmd, args)` | Spawn a PTY process via the main process | 🔜 Phase 1B |

### `useExtensionStore<T>(initialState)`

Isolated per-extension state. Returns `[state, setState]` where `setState` accepts a partial update (merged with spread).

```tsx
const [state, setState] = useExtensionStore({ sessions: [], activeId: null })
setState({ activeId: 'abc' }) // merges, doesn't replace
```

> **Phase 1A:** Backed by React `useState`. Phase 1B will upgrade to isolated Zustand stores with automatic persistence keyed by extension ID.

## Monorepo structure

```
core-shell/
├── packages/
│   ├── core-shell/              ← npm library (name: "core-shell")
│   │   └── src/
│   │       ├── components/      ← Shell, ShellProvider, ActivityRail, Sidebar,
│   │       │                       Canvas, RightSidebar, Panel, StatusBar,
│   │       │                       CommandPalette, TabBar
│   │       ├── store/           ← shell-store.ts (Zustand)
│   │       ├── extension/       ← useShell, useExtensionStore,
│   │       │                       ExtensionErrorBoundary
│   │       ├── types/           ← Manifest, ExtensionContributes, ShellAPI
│   │       ├── main/            ← Main process utilities (Phase 1B)
│   │       └── preload/         ← contextBridge preload bridge (Phase 1B)
│   ├── demo-app/                ← Reference Electron app
│   │   └── src/
│   │       ├── main/            ← Electron main process
│   │       ├── preload/         ← Preload bridge
│   │       └── renderer/        ← App.tsx wraps ShellProvider + Shell
│   └── ext-hello-world/         ← Hello World reference extension
│       └── src/index.tsx        ← manifest + Sidebar, Canvas, RightSidebar
├── docs/
│   ├── plans/                   ← Design documents
│   └── extensions/              ← Extension authoring guide
├── package.json                 ← pnpm workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Roadmap

### Phase 1A — Shell Chrome ✅

- [x] Activity rail with extension icons
- [x] Left sidebar (collapsible via drag, snap-to-hide)
- [x] Main canvas area
- [x] Right sidebar (collapsible via drag, snap-to-hide)
- [x] Status bar
- [x] Command palette (`Cmd+Shift+P`)
- [x] Extension manifest model (`contributes` slots)
- [x] `ShellProvider` / `Shell` component API
- [x] `useShell()` and `useExtensionStore()` hooks (stubs)
- [x] `ExtensionErrorBoundary` crash recovery
- [x] Hello World reference extension
- [x] Demo app with electron-vite

### Phase 1B — Extension Runtime (next)

- [ ] Full `useShell()` API with typed IPC bridge
- [ ] `ipc.readFile`, `ipc.writeFile`, `ipc.watchDir`, `ipc.spawn`
- [ ] Dynamic extension discovery (`extensions/` folder + `node_modules` scan)
- [ ] Hot-reload: file change → unmount → reimport → remount (~1s)
- [ ] `onBeforeUnload` / `onAfterLoad` lifecycle for state preservation
- [ ] Isolated per-extension Zustand stores with automatic persistence
- [ ] Bottom panel slot (terminal, output, logs)
- [ ] Tab bar for multiple extension instances
- [ ] `core-shell/main` and `core-shell/preload` exports
- [ ] Extension status bar contributions

### Phase 1C — Ecosystem (later)

- [ ] `core-shell install <package>` CLI command
- [ ] npm-based extension marketplace discovery
- [ ] AI agent bridge protocol (introspection + navigation)
- [ ] Theme API (light/dark/custom)
- [ ] Extension versioning and compatibility checks
- [ ] Sandbox isolation for untrusted extensions

## Tech stack

| Technology | Version | Role |
|---|---|---|
| Electron | 41 | Desktop shell (Node.js main + Chromium renderer) |
| React | 18 | UI framework |
| TypeScript | 5 | Type safety across shell and extensions |
| Zustand | 5 | State management (shell store + extension stores) |
| electron-vite | 5 | Build toolchain + HMR dev server |
| pnpm | 9 | Monorepo package manager |

## Contributing

```bash
pnpm install          # install all dependencies
pnpm build            # build all packages
pnpm dev              # start demo-app with hot reload
pnpm --filter core-shell test   # run core-shell unit tests
```

**Extension contributions welcome.** See [`docs/extensions/README.md`](docs/extensions/README.md) for the full authoring guide.

**Architecture decisions** are documented in [`docs/plans/`](docs/plans/).

## License

MIT
