# Extension Authoring Guide

Everything you need to build, test, and publish a core-shell extension.

## What is an extension?

An extension is an npm package that exports a `manifest` object. The manifest tells core-shell what your extension is called and which **slots** it contributes content to. Slots are named regions of the shell chrome — sidebar, canvas, right sidebar, etc. — that the shell renders for you.

Extensions are React components. They run in the same Chromium renderer process as the shell. No separate process, no IPC overhead, no serialization boundary between your component and the DOM.

### The manifest contract

```typescript
import type { Manifest } from 'core-shell'

export const manifest: Manifest = {
  id: 'ext-my-tool',            // unique identifier (kebab-case)
  displayName: 'My Tool',       // shown in activity rail tooltip + status bar
  version: '0.1.0',             // semver
  contributes: {
    activityRail: { icon: '🔧', title: 'My Tool' },  // activity rail icon
    sidebar:      MySidebar,      // left panel component
    canvas:       MyCanvas,       // main content component
    rightSidebar: MyProperties,   // right panel component
    // panel:     MyPanel,        // bottom panel (Phase 1B)
    // statusBar: [...]           // status bar items (Phase 1B)
  },
}
```

Every field in `contributes` is optional. An extension can contribute to just one slot (canvas-only is a perfectly valid extension) or all of them.

### TypeScript types

```typescript
// Exported from 'core-shell'
interface Manifest {
  id: string
  displayName: string
  version: string
  contributes: ExtensionContributes
}

interface ExtensionContributes {
  activityRail?: { icon: ReactNode; title: string }
  sidebar?: ComponentType
  canvas?: ComponentType
  rightSidebar?: ComponentType
  panel?: ComponentType
  statusBar?: Array<{ position: 'left' | 'right'; component: ComponentType }>
}
```

---

## Quickstart: Hello World in 5 minutes

Let's build a minimal extension from scratch, wire it into the demo app, and see it render.

### 1. Create the extension package

From the repo root:

```bash
mkdir -p packages/ext-my-first/src
```

### 2. Create `packages/ext-my-first/package.json`

```json
{
  "name": "ext-my-first",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "vite build"
  },
  "keywords": ["core-shell-extension"],
  "peerDependencies": {
    "react": "^18",
    "core-shell": "^1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4",
    "core-shell": "workspace:*",
    "vite": "^5",
    "vite-plugin-dts": "^4",
    "typescript": "^5",
    "react": "^18",
    "@types/react": "^18"
  }
}
```

### 3. Create `packages/ext-my-first/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### 4. Create `packages/ext-my-first/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [react(), dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'core-shell'],
    },
  },
})
```

### 5. Create `packages/ext-my-first/src/index.tsx`

```tsx
function MyCanvas() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>🚀</div>
      <h1 style={{ color: 'var(--cs-text)', margin: 0 }}>My First Extension</h1>
      <p style={{ color: 'var(--cs-text-muted)' }}>
        This canvas is rendered by ext-my-first.
      </p>
    </div>
  )
}

export const manifest = {
  id: 'ext-my-first',
  displayName: 'My First Extension',
  version: '0.1.0',
  contributes: {
    activityRail: { icon: '🚀', title: 'My First Extension' },
    canvas: MyCanvas,
  },
}
```

### 6. Wire it into the demo app

Add the dependency to `packages/demo-app/package.json`:

```json
{
  "dependencies": {
    "core-shell": "workspace:*",
    "ext-hello-world": "workspace:*",
    "ext-my-first": "workspace:*"
  }
}
```

Update `packages/demo-app/src/renderer/src/App.tsx`:

```tsx
import { ShellProvider, Shell } from 'core-shell'
import 'core-shell/dist/style.css'
import { manifest as helloWorld } from 'ext-hello-world'
import { manifest as myFirst } from 'ext-my-first'

export function App() {
  return (
    <ShellProvider extensions={[helloWorld, myFirst]}>
      <Shell />
    </ShellProvider>
  )
}
```

### 7. Build and run

```bash
pnpm install          # link the new workspace package
pnpm build            # build core-shell → ext-hello-world → ext-my-first → demo-app
pnpm dev              # launch the Electron app
```

You'll see two icons in the activity rail — 👋 and 🚀. Click 🚀 to switch to your extension's canvas.

---

## Slot reference

### `activityRail`

**What it's for:** The 44px-wide icon strip on the far left edge. Each extension contributes one icon. Clicking the icon switches the shell to show that extension's sidebar and canvas.

**Shape:**

```typescript
activityRail: {
  icon: ReactNode   // emoji string, SVG element, or React component
  title: string     // tooltip text
}
```

**Behavior:**
- The active extension's icon has a blue accent bar on its left edge
- Clicking an icon calls `setActiveExtensionId(extensionId)` internally
- Icons are rendered in the order extensions are passed to `ShellProvider`

**Example:**

```tsx
// Simple emoji icon
activityRail: { icon: '📊', title: 'Dashboard' }

// SVG icon
activityRail: {
  icon: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2L2 7l8 5 8-5-8-5zM2 13l8 5 8-5" />
    </svg>
  ),
  title: 'Layers',
}
```

---

### `sidebar`

**What it's for:** The left panel. Typically used for navigation, file trees, session lists, or secondary controls. Collapsible by dragging the right border handle.

**Shape:**

```typescript
sidebar: React.ComponentType   // no props passed by the shell
```

**Layout details:**
- Default width: **220px**
- Minimum open width: **150px**
- Snap-to-hide threshold: **80px** (drag below this and it collapses to 0)
- Maximum width: **500px**
- Re-expand: drag from the left edge of the canvas area

**Example:**

```tsx
function MySidebar() {
  const items = ['Sessions', 'Templates', 'Settings']
  return (
    <div style={{ padding: '12px 10px' }}>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--cs-text-muted)', marginBottom: 12,
      }}>
        Navigation
      </div>
      {items.map(item => (
        <div key={item} style={{
          padding: '5px 8px', borderRadius: 4, fontSize: 12,
          color: 'var(--cs-text-muted)', cursor: 'pointer',
        }}>
          {item}
        </div>
      ))}
    </div>
  )
}
```

---

### `canvas`

**What it's for:** The main content area. This is your extension's primary UI — the equivalent of the editor area in VS Code. It fills all remaining horizontal and vertical space after the sidebars.

**Shape:**

```typescript
canvas: React.ComponentType   // no props passed by the shell
```

**Layout details:**
- Fills all remaining space (flex: 1)
- Overflow is hidden — your component manages its own scrolling
- Only one extension's canvas is visible at a time (controlled by the active extension)

**Example:**

```tsx
import { useExtensionStore } from 'core-shell'

function MyCanvas() {
  const [state, setState] = useExtensionStore({
    items: ['Write docs', 'Ship feature', 'Review PR'],
    selectedIndex: 0,
  })

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <h2 style={{ color: 'var(--cs-text)', marginBottom: 16 }}>Tasks</h2>
      {state.items.map((item, i) => (
        <div
          key={i}
          onClick={() => setState({ selectedIndex: i })}
          style={{
            padding: '8px 12px', marginBottom: 4, borderRadius: 6, cursor: 'pointer',
            background: i === state.selectedIndex ? 'var(--cs-surface-hover)' : 'transparent',
            color: 'var(--cs-text)',
          }}
        >
          {item}
        </div>
      ))}
    </div>
  )
}
```

---

### `rightSidebar`

**What it's for:** The right panel. Typically used for properties, details, context, or inspector panels. Collapsible by dragging the left border handle.

**Shape:**

```typescript
rightSidebar: React.ComponentType   // no props passed by the shell
```

**Layout details:**
- Default width: **280px**
- Minimum open width: **200px**
- Snap-to-hide threshold: **60px** (drag below this and it collapses to 0)
- Maximum width: **600px**

**Example:**

```tsx
function MyProperties() {
  return (
    <div style={{ padding: '12px 10px' }}>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--cs-text-muted)', marginBottom: 12,
      }}>
        Properties
      </div>
      {[
        ['Type', 'Task'],
        ['Status', 'In Progress'],
        ['Priority', 'High'],
      ].map(([label, value]) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--cs-text)' }}>{value}</div>
        </div>
      ))}
    </div>
  )
}
```

---

### `panel` (Phase 1B — not yet available)

**What it's for:** The bottom panel area. Intended for terminal output, logs, diagnostics, or any content that benefits from a horizontal layout below the canvas. Multiple extensions can contribute panel tabs.

**Shape (planned):**

```typescript
panel: {
  title: string              // tab label in the panel tab bar
  component: React.ComponentType
}
```

**Layout details (planned):**
- Default height: **200px**
- Collapsible via vertical drag handle
- Tab bar at top for multiple panel contributors

> This slot is shelved in Phase 1A. It will be implemented in Phase 1B.

---

### `statusBar` (Phase 1B — not yet available)

**What it's for:** Small status indicators in the 20px footer bar at the bottom of the shell. Extensions can contribute items to the left or right side.

**Shape (planned):**

```typescript
statusBar: Array<{
  position: 'left' | 'right'
  component: React.ComponentType
}>
```

**Guidelines:**
- Keep status bar items minimal — icon + short text only
- Don't put interactive controls in the status bar
- Left side: extension name, connection status, mode indicators
- Right side: line/column, encoding, language mode, notifications

> This slot is shelved in Phase 1A. It will be implemented in Phase 1B.

---

## `useShell()` reference

The `useShell()` hook is available inside any component rendered within `<ShellProvider>`. It returns the shell's Zustand store with both state and actions.

```typescript
import { useShell } from 'core-shell'

function MyComponent() {
  const shell = useShell()
  // ...
}
```

### State

| Property | Type | Description |
|---|---|---|
| `activeExtension` | `string \| null` | ID of the currently active extension |
| `tabs` | `TabEntry[]` | Open tabs: `{ id, label, extensionId }` |
| `activeTabId` | `string \| null` | ID of the active tab |
| `layout` | `LayoutState` | Current layout dimensions (see below) |
| `theme` | `'light' \| 'dark'` | Current theme |
| `commandPaletteOpen` | `boolean` | Whether the command palette is showing |
| `commands` | `CommandEntry[]` | Registered commands: `{ id, label, onSelect }` |

### Layout state

```typescript
interface LayoutState {
  sidebarWidth: number       // 0 = collapsed, 220 default
  panelHeight: number        // 0 = collapsed, 200 default
  rightSidebarWidth: number  // 0 = collapsed, 280 default
}
```

### Actions (Phase 1A — available now)

| Method | Signature | Description |
|---|---|---|
| `setActiveExtension` | `(id: string \| null) => void` | Switch the active extension |
| `openTab` | `(tab: TabEntry) => void` | Open a tab: `{ id, label, extensionId }` |
| `closeTab` | `(id: string) => void` | Close a tab by ID |
| `setActiveTab` | `(id: string) => void` | Switch to a tab by ID |
| `registerCommand` | `(cmd: CommandEntry) => void` | Register a command palette entry: `{ id, label, onSelect }` |
| `openCommandPalette` | `() => void` | Programmatically open the command palette |
| `closeCommandPalette` | `() => void` | Close the command palette |
| `setLayout` | `(patch: Partial<LayoutState>) => void` | Update layout dimensions |

### Example: Registering a command

```tsx
import { useShell } from 'core-shell'
import { useEffect } from 'react'

function MyCanvas() {
  const shell = useShell()

  useEffect(() => {
    shell.registerCommand({
      id: 'my-tool.sayHello',
      label: 'My Tool: Say Hello',
      onSelect: () => alert('Hello from My Tool!'),
    })
  }, [])

  return <div>Open Cmd+Shift+P and search "Say Hello"</div>
}
```

### IPC Bridge (Phase 1B — not yet available)

These methods will be available on `shell.ipc` once Phase 1B ships:

| Method | Signature | Description |
|---|---|---|
| `readFile` | `(path: string) => Promise<string>` | Read a file via the main process |
| `writeFile` | `(path: string, content: string) => Promise<void>` | Write a file via the main process |
| `watchDir` | `(path: string, cb: (event) => void) => () => void` | Watch directory. Returns unsubscribe fn. |
| `spawn` | `(cmd: string, args: string[]) => Promise<PTY>` | Spawn a PTY process |

All IPC calls will have a **10-second timeout** and reject with a typed `IPCTimeoutError`. No silent hangs.

---

## `useExtensionStore()` reference

Isolated state management for extensions. Each extension gets its own store, separate from the shell store and from other extensions.

### Signature

```typescript
function useExtensionStore<T>(initialState: T): [T, (update: Partial<T>) => void]
```

### Parameters

- `initialState` — the initial state object. This is the full shape of your extension's state.

### Returns

A tuple of `[state, setState]`:
- `state` — the current state object
- `setState` — accepts a **partial update** that is merged (spread) into the current state. This is not a replacement — only the keys you pass are updated.

### Example

```tsx
import { useExtensionStore } from 'core-shell'

function SessionList() {
  const [state, setState] = useExtensionStore({
    sessions: [] as string[],
    activeSession: null as string | null,
    filter: '',
  })

  const addSession = (name: string) => {
    setState({ sessions: [...state.sessions, name] })
  }

  const selectSession = (name: string) => {
    setState({ activeSession: name })  // only updates activeSession, sessions + filter unchanged
  }

  return (
    <div>
      <input
        value={state.filter}
        onChange={e => setState({ filter: e.target.value })}
        placeholder="Filter sessions..."
      />
      {state.sessions
        .filter(s => s.includes(state.filter))
        .map(s => (
          <div key={s} onClick={() => selectSession(s)}>
            {s} {s === state.activeSession ? '(active)' : ''}
          </div>
        ))}
      <button onClick={() => addSession(`Session ${state.sessions.length + 1}`)}>
        New Session
      </button>
    </div>
  )
}
```

### Current limitations (Phase 1A)

- Backed by React `useState` — state is lost on component unmount or app restart
- Not truly isolated per-extension — if two components in the same extension both call `useExtensionStore`, they get separate state instances

### Phase 1B improvements

- Upgraded to isolated Zustand stores, one per extension ID
- Automatic persistence to disk — state survives app restarts
- All components within an extension share the same store instance
- State preserved across extension hot-reloads via `onBeforeUnload`/`onAfterLoad`

---

## Dev workflow

### Build order matters

The packages have build dependencies:

```
core-shell → ext-hello-world → demo-app
             ext-my-first ──┘
```

`pnpm build` (at the repo root) builds them in dependency order automatically.

### Inner dev loop

For day-to-day extension development:

```bash
# Terminal 1: Start the demo app with hot reload
pnpm dev

# Terminal 2: Rebuild your extension after changes
pnpm --filter ext-my-first build
```

After rebuilding the extension, the `electron-vite` dev server picks up the change and hot-reloads the renderer. You should see the update within ~1 second.

### Full rebuild from clean

```bash
pnpm install
pnpm build
pnpm dev
```

### Running tests

```bash
# Run core-shell unit tests
pnpm --filter core-shell test

# Run all tests across the monorepo
pnpm -r test
```

### CSS custom properties

core-shell exposes design tokens as CSS custom properties. Use these in your extension components for consistent theming:

| Token | Default (dark) | Usage |
|---|---|---|
| `--cs-bg` | `#0d1117` | Page background |
| `--cs-surface` | `#161b22` | Panel/sidebar background |
| `--cs-surface-hover` | `#21262d` | Hover state background |
| `--cs-border` | `#21262d` | Primary borders |
| `--cs-border-subtle` | `#30363d` | Subtle borders (command palette) |
| `--cs-text` | `#c9d1d9` | Primary text |
| `--cs-text-muted` | `#8b949e` | Secondary/muted text |
| `--cs-accent` | `#388bfd` | Accent color (links, active states) |
| `--cs-accent-hover` | `#58a6ff` | Accent hover |
| `--cs-status-bar-bg` | `#1c4b9b` | Status bar background |
| `--cs-status-bar-text` | `#cce5ff` | Status bar text |

Always use these tokens instead of hardcoded colors. When core-shell adds theme support (Phase 1C), your extension will automatically adapt.

---

## Publishing to npm

Extensions are real npm packages. Anyone can `npm install` your extension and pass it to `ShellProvider`.

### Package requirements

1. **Export a `manifest` object** from your package entry point
2. **Add the `core-shell-extension` keyword** to `package.json` — this is the convention for discoverability
3. **Declare `react` and `core-shell` as peer dependencies** — the shell provides these at runtime
4. **Externalize peer deps in your build** — don't bundle React or core-shell into your dist

### Example `package.json` for a published extension

```json
{
  "name": "@myorg/ext-dashboard",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "keywords": ["core-shell-extension"],
  "peerDependencies": {
    "react": "^18",
    "core-shell": "^1"
  },
  "dependencies": {
    "d3": "^7"
  }
}
```

**Key points:**
- **Peer deps** (`react`, `core-shell`): provided by the host app at runtime. Not bundled.
- **Regular deps** (`d3` in this example): bundled into your `dist/`. Your extension ships self-contained.

### Build configuration

Your `vite.config.ts` must externalize peer dependencies:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [react(), dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'core-shell'],
    },
  },
})
```

### Publishing

```bash
cd packages/ext-my-tool
pnpm build
npm publish --access public
```

### Consuming a published extension

```bash
# In the consuming app
pnpm add @myorg/ext-dashboard
```

```tsx
import { ShellProvider, Shell } from 'core-shell'
import 'core-shell/dist/style.css'
import { manifest as dashboard } from '@myorg/ext-dashboard'

export function App() {
  return (
    <ShellProvider extensions={[dashboard]}>
      <Shell />
    </ShellProvider>
  )
}
```

---

## Error boundaries

Every extension slot is wrapped in an `<ExtensionErrorBoundary>` React error boundary, provided automatically by core-shell. You don't configure this — it's always there.

### What happens when an extension crashes

If any component in a slot throws during rendering:

1. The error boundary catches the exception
2. The slot shows an error UI:
   - A warning icon
   - **"Extension crashed"** heading
   - The extension ID and error message in monospace
   - A **"Reload Extension"** button
3. The error is logged to the console: `[core-shell] Extension "ext-my-tool" crashed: <error>`
4. **Other slots continue working.** A crash in the sidebar doesn't take down the canvas.

### The Reload Extension button

Clicking "Reload Extension" resets the error boundary state and re-renders the component. In Phase 1A, this is a simple React state reset. In Phase 1B, it will trigger a full extension hot-reload — unmount, reimport with cache-bust, remount.

### Failure modes and recovery

| Failure | What happens | Recovery |
|---|---|---|
| **Runtime crash** (render throws) | Error boundary catches. Slot shows error UI. | Click "Reload Extension" or fix the bug and rebuild. |
| **Bad manifest** (missing `id`, invalid shape) | Extension is skipped by `ShellProvider`. No icon appears in the activity rail. | Check the console for the registration error. Fix the manifest. |
| **IPC timeout** (Phase 1B) | `shell.ipc.*` rejects with `IPCTimeoutError` after 10s. | Handle the rejection in your extension. Retry or show error state. |

### Testing error recovery

You can intentionally trigger the error boundary to see it in action:

```tsx
function CrashyCanvas() {
  const [shouldCrash, setShouldCrash] = useState(false)
  if (shouldCrash) throw new Error('Intentional crash for testing')
  return (
    <button onClick={() => setShouldCrash(true)}>
      Test Error Boundary
    </button>
  )
}
```

---

## Reference: Hello World extension

The built-in `ext-hello-world` package (`packages/ext-hello-world/src/index.tsx`) demonstrates a complete extension with three slots populated. Read it as a reference implementation — it's 89 lines of straightforward React.

**Slots contributed:**
- `activityRail` — 👋 emoji icon with "Hello World" tooltip
- `sidebar` — navigation list with four items
- `canvas` — centered hero with the manifest rendered as a code block
- `rightSidebar` — properties panel showing extension metadata

**Source:** [`packages/ext-hello-world/src/index.tsx`](../../packages/ext-hello-world/src/index.tsx)
