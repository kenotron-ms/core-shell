# core-shell Design

## Goal

Build `core-shell` — an npm library that provides a VS Code-inspired Electron desktop application shell where all canvas content is provided by extensions. The shell itself is a permanent chrome/layout engine; everything inside the "editor area" equivalent is extension-defined. Apps like `amplifier-canvas` import core-shell and build their product on top of it. The repo itself contains a reference demo app (`packages/demo-app`) to demonstrate usage.

**Reference project:** `~/workspace/ms/canvas` — a pre-code fully-specced Electron + React + TypeScript + Zustand app that will become the first extension built on core-shell.

## Background

Desktop tooling for developer workflows increasingly demands a composable, extensible UI shell — one that provides professional-grade chrome (tabs, sidebars, panels, command palette) without forcing every tool to reinvent it. VS Code proved this model works, but its extension API is heavyweight and tightly coupled to its editor-centric architecture.

core-shell extracts the shell concept into a standalone platform where the "editor area" is a blank canvas owned entirely by extensions. This lets teams build rich desktop apps (AI cockpits, dashboards, design tools) that inherit a familiar, high-quality layout engine and extension ecosystem without carrying VS Code's editor baggage.

## Stack

| Technology | Version | Role |
|---|---|---|
| Electron | 41 | Two-process desktop shell (Node.js main + Chromium renderer) |
| React | 18 | Renderer UI framework |
| TypeScript | — | Type safety across shell and extensions |
| Zustand | 5 | State management (shell store + per-extension stores) |
| electron-vite | 5 | Build toolchain + HMR dev server |
| electron-builder | 26 | Packaging and distribution |
| chokidar | 4 | File watching (main process only) |
| node-pty | — | PTY for terminal panels, exposed to extensions via IPC |

## Approach

### Chosen: Thin React Shell

Extensions are React components that mount into named slots. One Chromium renderer. No separate extension host process. No IPC overhead between extension and shell UI.

**Why this approach:** Maximum "no friction" for extension authors — one folder, one manifest export, restart, done. Extensions talk to Node.js only through a typed IPC bridge, so extension code is already cloud-portable. Sandbox isolation can be added as a future layer when a public marketplace becomes real.

### Rejected Alternatives

- **VS Code Extension Host model (separate Node.js process):** Too heavy, too much friction, harder to port to web.
- **Hybrid trusted/sandboxed:** Two extension APIs to maintain; premature for current scope.

## Architecture

### Monorepo Structure

core-shell is an npm library, not a standalone Electron app. The repo is a monorepo with npm workspaces:

```
core-shell/ (monorepo)
├── packages/
│   ├── core-shell/          ← the npm library (name: "core-shell")
│   │   └── src/
│   │       ├── components/  ← ShellProvider, Shell, ActivityRail, TabBar, Sidebar,
│   │       │                   Canvas, RightSidebar, Panel, StatusBar, CommandPalette
│   │       ├── store/       ← shell-store.ts, extension-registry.ts
│   │       ├── extension/   ← useShell.ts, useExtensionStore.ts, ExtensionErrorBoundary.tsx
│   │       ├── main/        ← main process utilities for Electron app authors
│   │       └── preload/     ← contextBridge preload bridge for Electron app authors
│   ├── demo-app/            ← reference Electron app — imports core-shell, ships with ext-hello-world loaded
│   │   └── src/
│   │       ├── main/        ← Electron main process using core-shell main utilities
│   │       ├── preload/     ← using core-shell preload bridge
│   │       └── renderer/    ← App.tsx wraps ShellProvider with ext-hello-world configured
│   └── ext-hello-world/     ← Hello World reference extension (name: "ext-hello-world")
│       └── src/index.tsx    ← manifest + all 6 slot contributions
├── docs/
└── package.json             ← npm workspaces root
```

Apps import core-shell and wire up their own Electron main/renderer/preload processes using the utilities the library provides. The demo-app package demonstrates this pattern end-to-end.

### Package Exports

What core-shell exports for app authors:

```typescript
// Renderer (React)
export { ShellProvider, Shell } from 'core-shell'
export { useShell, useExtensionStore, ExtensionErrorBoundary } from 'core-shell'
export type { Manifest, Contributes, ShellAPI } from 'core-shell'

// Main process
export { createMainProcess, registerIPCHandlers } from 'core-shell/main'

// Preload
export { createPreloadBridge } from 'core-shell/preload'
```

### Two-Process Electron Model (App Author's Responsibility)

The consuming app (not core-shell itself) is responsible for the Electron two-process model. core-shell provides utilities for both sides:

```
┌─────────────────────────────────────────────────────────┐
│                  Main Process (Node.js)              │
│                                                     │
│  Window management    │  Extension loader/discoverer │
│  File system (Node)   │  Native menus               │
│  IPC handler registry │  chokidar file watchers     │
│  node-pty PTY instances │  npm subprocess            │
│                                                     │
│  App author uses: createMainProcess, registerIPCHandlers │
│  from 'core-shell/main'                             │
│                                                     │
│  ⚠ Never imports React. Never touches the DOM.       │
└───────────────────┬─────────────────────────────────────┘
                    │ contextBridge (typed preload.ts)
                    │ App author uses: createPreloadBridge
                    │ from 'core-shell/preload'
┌───────────────────▼─────────────────────────────────────┐
│             Renderer Process (Chromium + React)      │
│                                                     │
│  App author wraps root in <ShellProvider>            │
│  Shell chrome + extension components render inside   │
│  Shell Zustand store                                 │
│  Extension Zustand stores (isolated, per-extension)  │
│                                                     │
│  ⚠ Cannot call Node APIs directly — everything       │
│    goes through the typed IPC bridge.                │
└─────────────────────────────────────────────────────────┘
```

**Main Process (Node.js):** Window management, file system (Node APIs), extension loader/discoverer, native menus, IPC handler registry, chokidar file watchers, node-pty PTY instances, npm subprocess (for extension install). App authors bootstrap this using `createMainProcess` and `registerIPCHandlers` from `core-shell/main`. Never imports React. Never touches the DOM.

**Renderer Process (Chromium + React):** All UI. App authors wrap their root component in `<ShellProvider>` from `core-shell`. Bridged to main via typed `contextBridge` preload using `createPreloadBridge` from `core-shell/preload`. Renderer cannot call Node APIs directly — everything goes through the typed IPC bridge.

### Shell Chrome (permanent — extensions cannot modify)

- **Title bar** — macOS traffic lights + app/project name
- **Tab bar** — extension instances open as tabs, just like VS Code editor tabs
- **Activity rail** — icon strip, far left; each extension contributes icon + associated sidebar view
- **Layout engine** — manages resize handles, collapse states, panel heights
- **Command palette** — `Ctrl+Shift+P`; extensions contribute commands via `shell.registerCommand`
- **Shell Zustand store** — global state owned by shell

### Extension Slots (filled at runtime by extensions)

| Slot | Description |
|---|---|
| `activityRail` | Icon + which sidebar view to show when clicked |
| `sidebar` | Left panel — session list, file tree, etc. |
| `canvas` | Main content area — the extension's primary UI, one active at a time |
| `rightSidebar` | Optional properties/context panel, collapsible |
| `panel` | Bottom area — multiple tabs, multiple contributors (terminal, output, logs) |
| `statusBar` | Left or right-aligned status items — icon + short text only |

## Extension Model

### Manifest Shape

Each extension exports a `manifest` object from its entry point. Components are passed as values — not strings, not paths. No indirection. The shell imports the manifest and mounts whatever is in each slot.

```typescript
// extensions/amplifier-canvas/index.tsx
export const manifest = {
  id:          'amplifier-canvas',
  displayName: 'Amplifier Canvas',
  version:     '0.1.0',

  contributes: {
    activityRail: { icon: SessionsIcon, title: 'Sessions' },
    sidebar:      SessionListSidebar,
    canvas:       CanvasMain,            // ← primary UI, one active at a time
    panel:        { title: 'Terminal', component: TerminalPanel },
    statusBar:    { position: 'left', component: StatusItem },
  },

  // Optional lifecycle — for hot-reload state preservation
  onBeforeUnload: () => ({ savedState: myStore.getState() }),
  onAfterLoad:    (ctx) => { if (ctx.previousState) myStore.setState(ctx.previousState) },
}
```

### Shell API: `useShell()`

Available inside any extension component:

```typescript
const shell = useShell()

// IPC bridge → main process (all Node APIs go through here)
await shell.ipc.readFile(path)
await shell.ipc.writeFile(path, content)
const unsub = shell.ipc.watchDir(path, callback)  // returns unsubscribe fn
const pty   = await shell.ipc.spawn(cmd, args)    // returns PTY instance

// Navigation
shell.openTab(extensionId)
shell.setTitle(text)

// Command palette
shell.registerCommand('canvas.clearSessions', handler)
shell.executeCommand('workbench.reload')

// Per-extension state (isolated, persisted by shell automatically)
const [state, setState] = useExtensionStore({ sessions: [], active: null })
```

All IPC calls have a **10-second timeout** and reject with typed `IPCTimeoutError` on failure. No silent hangs.

### Extensions as npm Packages

Extensions are real npm packages discoverable by keyword `"core-shell-extension"`.

```json
{
  "name": "@myorg/amplifier-canvas",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "keywords": ["core-shell-extension"],
  "peerDependencies": { "react": "^18", "core-shell": "^1" },
  "dependencies": { "@xterm/xterm": "^6.0.0" }
}
```

- **Peer deps** (`react`, `core-shell`): provided by the shell at runtime — not bundled into extension.
- **Regular deps**: bundled into the extension's `dist/` — extension ships self-contained.

### Three Installation Modes

| Mode | Mechanism | Priority |
|---|---|---|
| **Bundled (first-party)** | Listed as workspace packages in the shell's monorepo. Built and shipped inside the app binary. Always present, cannot be uninstalled. | Lowest (overridden by local) |
| **Installed (npm)** | `npm install @myorg/my-ext` or `core-shell install @myorg/my-ext`. Discovered in `node_modules/` by scanning for the `"core-shell-extension"` keyword. | Middle |
| **Local dev** | Drop folder into `extensions/`. Discovered on startup. Overrides installed packages if IDs collide. This is the inner dev loop. | Highest (wins on conflict) |

**Discovery order:** bundled → installed (node_modules scan) → local (`extensions/` folder, wins on conflict).

### Dynamic Loading — No Restart Required

**ExtensionRegistry** is a Zustand store. When it updates, React re-renders the shell automatically.

**Install path (live, no restart):**

1. `core-shell install @org/ext`
2. Main process runs `npm install`
3. Sends `extension:installed` IPC event
4. Renderer calls `import(extensionPath)` dynamically
5. Manifest registered in ExtensionRegistry
6. Activity rail icon appears, canvas available

**Dev hot-reload path (~1s turnaround):**

1. Edit file in `extensions/`
2. chokidar detects change
3. Sends `extension:changed` IPC event
4. Renderer unmounts old extension
5. Calls `import(path + '?t=' + Date.now())` (cache-busts module)
6. Re-registers manifest — live
7. State optionally preserved via `onBeforeUnload`/`onAfterLoad`

## State Management

### Three Layers

#### Shell Store (Zustand, global)

| Key | Type | Purpose |
|---|---|---|
| `activeExtension` | `string` | Which extension's canvas is showing |
| `extensionRegistry` | `Record<id, { manifest, status }>` | The reactive heart of dynamic loading. Status: `'active'` \| `'loading'` \| `'errored'` |
| `layout` | `{ sidebarWidth, panelHeight, rightSidebarVisible }` | Persisted to disk |
| `theme` | `'light' \| 'dark'` | Current theme |
| `tabs` | `Tab[]` | Open tabs and their order |
| `commands` | `Command[]` | Registered command palette entries |

Extensions read via `useShell()` but **never write to the shell store directly**.

#### Extension Stores (Zustand, isolated)

One per extension via `useExtensionStore(initialState)`. Private to each extension. Shell persists these to disk keyed by extension ID — extensions don't manage their own persistence.

#### Main Process State (Node.js only, never in renderer)

chokidar file watchers, node-pty PTY instances, IPC handler registry, npm subprocess handles.

## Data Flow

All data flows in one direction. There is no polling and no manual refresh.

**Example: File change propagation**

```
Amplifier CLI appends to events.jsonl on disk
  → chokidar fires in main process
  → ipc:file-changed event sent to renderer
  → extension's shell.ipc.watchDir callback fires
  → extension calls setState({ sessions: parsedSessions })
  → Zustand notifies subscribers
  → Sidebar React component re-renders
```

## Error Handling

Every extension slot is wrapped in an `<ExtensionErrorBoundary>` React component provided by the shell. Extensions don't configure this — it's always there.

| Failure | Recovery |
|---|---|
| **Runtime crash** (render throws) | Error boundary catches → slot shows error UI (extension name + error + "Reload Extension" button). Reload re-runs dynamic import with cache-bust. |
| **Load failure** (bad manifest) | Extension skipped in registry. Activity rail icon shows warning indicator. Surfaced in "Failed extensions" section of command palette. |
| **IPC timeout** (main process unresponsive) | `shell.ipc.*` rejects with typed `IPCTimeoutError`. No silent hang. Extension handles the rejection. |
| **Renderer crash** (rare Chromium crash) | Electron automatically relaunches renderer. Layout restored from disk. Extension stores rehydrated. ExtensionRegistry rebuilt from discovery. |

When any extension is in errored state, the **status bar shows an amber indicator item**.

## Testing Strategy

Testing spans the three layers of the architecture:

- **Unit tests** — Shell Zustand stores, extension registry logic, IPC message serialization/deserialization, manifest validation. Run in Node.js with vitest.
- **Component tests** — Shell chrome components (tab bar, activity rail, command palette, layout engine) and `<ExtensionErrorBoundary>` behavior. Run with React Testing Library.
- **Integration tests** — Full extension lifecycle: discovery → load → mount → hot-reload → error → recovery. Uses a minimal "Hello World" test extension that exercises every slot.
- **E2E tests** — Electron app launch, extension rendering in real Chromium, IPC round-trips (file read/write, PTY spawn), and packaged binary smoke test. Uses Playwright Electron support.

The bundled Hello World extension doubles as a living integration test — if it renders correctly with all slots populated, the extension model is working.

## Theory of Success

core-shell is done when all five of the following are demonstrably true:

1. **The demo-app runs** — the reference Electron app in `packages/demo-app` launches with full VS Code-like chrome: activity rail, sidebar, canvas area, right sidebar, bottom panel, status bar, tab bar. Real UI, real layout engine, real extension loaded into it. core-shell itself is a library with no entry point — the demo-app proves the library works by importing it and building a complete shell.

2. **Stable + dev side-by-side** — a packaged binary (`electron-builder` output) and a hot-reloaded dev server (`electron-vite` HMR) run simultaneously in two windows. A change to an extension file appears in the dev window in ~1s; the stable window is unaffected.

3. **AI agent can introspect and navigate** — an Amplifier agent (or equivalent) can programmatically read the shell's state (loaded extensions, active tab, active canvas) and send navigation commands (switch tab, activate extension, open command palette) via a local API the shell exposes.

4. **Hello World extension** — a minimal built-in extension ships with the repo demonstrating the complete authoring pattern: manifest, activity rail icon, sidebar panel, canvas component, panel tab, status bar item, and a `useShell()` call. The canvas content makes the extension model self-evident on first glance.

5. **Extension documentation** — `docs/extensions/` covers: folder structure, manifest API reference, `useShell()` hook reference, dev hot-reload workflow, and publishing to npm. Sufficient for a new developer to ship their first extension without asking anyone.

## Open Questions

1. **AI agent bridge protocol** — What exactly does the local API look like for shell introspection/navigation? HTTP REST? Named pipe? WebSocket? Needs a follow-on design spike before implementation.

2. **Command palette UX** — Keyboard shortcut (`Ctrl+Shift+P` vs `Cmd+K`), fuzzy search implementation, extension command namespacing convention.

3. **Extension versioning** — How does the shell handle version mismatches between an installed extension and the `core-shell` peer dep it declares? Warn and load? Refuse to load?

4. **Right sidebar ownership** — Is it always extension-defined, or can the shell contribute a default properties panel when no extension claims it?

5. **Tab model** — Can multiple instances of the same extension be open in different tabs simultaneously, or is it one-instance-per-extension?

6. **App author configuration** — How does an app author configure core-shell? (ShellProvider props vs config file vs environment?)
