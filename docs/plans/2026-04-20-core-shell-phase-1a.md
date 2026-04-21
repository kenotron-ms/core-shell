# core-shell Phase 1A: Monorepo Scaffold + Shell Chrome + Demo App

> **Execution:** Use the subagent-driven-development workflow to implement this plan.

**Goal:** Scaffold the core-shell monorepo and build the shell chrome library with a demo Electron app that renders it — producing a VS Code-like window with all 6 extension slot regions visible and resize handles working.

**Architecture:** core-shell is an npm library (`packages/core-shell`) that provides React shell chrome components + Zustand state. Apps import it. The monorepo also contains `packages/demo-app` — a reference Electron app that wraps `<ShellProvider><Shell /></ShellProvider>` and proves the library works. Shell chrome is permanent (title bar, activity rail, tab bar, sidebar, canvas, panel, right sidebar, status bar, command palette). Extension slots are empty placeholders in Phase 1A — filled at runtime by extensions in Phase 1B.

**Tech Stack:** pnpm workspaces, TypeScript 5, React 18, Zustand 5, Vite 5 (library build for core-shell), electron-vite 5 (demo-app), Electron 41

**This is Phase 1A of 2.** Phase 1B covers ExtensionRegistry, extension discovery/mounting, Hello World extension, full useShell() IPC bridge, and dynamic loading.

**Design document:** `docs/plans/2026-04-20-core-shell-design.md`

**Done when:** `pnpm --filter demo-app dev` opens an Electron window with full VS Code-like chrome, all 6 regions visible, resize handles working, no console errors.

**Out of scope:** ExtensionRegistry, extension discovery/mounting, full useShell() IPC, Hello World extension (ext-hello-world), dynamic loading, AI bridge, packaging, extension docs.

---

## Task 1: Monorepo Root Scaffold

Context: The repo exists at `/Users/ken/workspace/ms/core-shell/` with only `docs/` and `.git/`. We need root workspace config for pnpm. Reference pattern: canvas uses npm + single package; core-shell uses pnpm workspaces + monorepo.

What to build:

**`package.json`** (root, private — manages workspace orchestration):

```json
{
  "name": "core-shell-repo",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "pnpm --filter demo-app dev",
    "build": "pnpm -r build",
    "install:all": "pnpm install"
  }
}
```

**`pnpm-workspace.yaml`**:

```yaml
packages:
  - 'packages/*'
```

**`tsconfig.base.json`** (shared compiler options — all packages extend this):

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

**`.gitignore`** — overwrite with:

```
node_modules
dist
out
.DS_Store
release
packages/demo-app/out
packages/*/dist
*.js.map
```

**`README.md`** (stub):

```markdown
# core-shell

VS Code-inspired Electron shell library. Apps import it.

## Requirements

- Node.js 20+
- pnpm 9+

## Development

```bash
pnpm install
pnpm dev        # starts demo-app
pnpm build      # builds all packages
```
```

Theory of Success: `pnpm install` at repo root completes without error.
Proof: `cd /Users/ken/workspace/ms/core-shell && pnpm install && echo "PASS: install OK"`

NFR scan:
- Compatibility: pnpm 9+ required — stated in README.md
- Workspace resolution: `workspace:*` protocol resolves cross-package deps (verified in Task 6 when demo-app depends on core-shell)

Commit: `feat(1a-task1): monorepo root scaffold`

---

## Task 2: packages/core-shell Library Scaffold

Context: core-shell is a Vite library build that produces ES modules + type declarations. Consumers import React components and hooks. React/react-dom are peer deps (not bundled). CSS is extracted to `dist/index.css` for consumers to import.

What to build:

Create `packages/core-shell/`.

**`packages/core-shell/package.json`**:

```json
{
  "name": "core-shell",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./main": {
      "import": "./dist/main/index.js",
      "types": "./dist/main/index.d.ts"
    },
    "./preload": {
      "import": "./dist/preload/index.js",
      "types": "./dist/preload/index.d.ts"
    }
  },
  "scripts": {
    "build": "vite build && tsc --emitDeclarationOnly"
  },
  "peerDependencies": {
    "react": "^18",
    "react-dom": "^18"
  },
  "dependencies": {
    "zustand": "^5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4",
    "typescript": "^5",
    "vite": "^5",
    "vite-plugin-dts": "^4",
    "react": "^18",
    "react-dom": "^18",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}
```

> Note: `zustand` is a regular dependency (not peer) because it's the shell's state engine — consumers don't need to install it separately.

**`packages/core-shell/tsconfig.json`**:

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

**`packages/core-shell/vite.config.ts`**:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [react(), dts({ include: ['src'], rollupTypes: true })],
  build: {
    lib: { entry: 'src/index.ts', formats: ['es'], fileName: 'index' },
    rollupOptions: { external: ['react', 'react/jsx-runtime', 'react-dom'] },
    outDir: 'dist',
  },
})
```

**`packages/core-shell/src/types/index.ts`**:

```typescript
export interface TabEntry {
  id: string
  label: string
  extensionId: string
}

export interface CommandEntry {
  id: string
  label: string
  onSelect: () => void
}

export interface ActivityRailItem {
  id: string
  icon: React.ReactNode
  title: string
  active?: boolean
  onClick: () => void
}

export interface LayoutState {
  sidebarWidth: number
  sidebarCollapsed: boolean
  panelHeight: number
  panelCollapsed: boolean
  rightSidebarWidth: number
  rightSidebarVisible: boolean
}

// Stubs for Phase 1B
export interface Manifest {
  id: string
  displayName: string
  version: string
  contributes: Record<string, unknown>
}
```

**`packages/core-shell/src/index.ts`** — initial barrel (exports only what exists so far):

```typescript
export * from './types'
// Components and hooks are added to this barrel as they are created in Tasks 3-7.
// Do NOT add exports for files that don't exist yet — build will fail.
```

**`packages/core-shell/src/main/index.ts`** — stub:

```typescript
// Phase 1B: main process utilities (createMainProcess, registerIPCHandlers)
export {}
```

**`packages/core-shell/src/preload/index.ts`** — stub:

```typescript
// Phase 1B: preload bridge (createPreloadBridge)
export {}
```

After creating all files, run `pnpm install` from repo root to link workspaces.

Theory of Success: `pnpm --filter core-shell build` succeeds and `packages/core-shell/dist/index.js` exists.
Proof: `cd /Users/ken/workspace/ms/core-shell && pnpm install && pnpm --filter core-shell build && ls packages/core-shell/dist/index.js && echo "PASS: core-shell build OK"`

NFR scan:
- Tree-shaking: react/react-dom in `external` — verify `dist/index.js` contains no react code (`grep -c "createElement" packages/core-shell/dist/index.js` should be 0)
- Types: vite-plugin-dts produces `dist/index.d.ts` — verify with `ls packages/core-shell/dist/index.d.ts`

Commit: `feat(1a-task2): core-shell library scaffold`

---

## Task 3: Design Tokens + Shell Chrome Components

Context: All components use plain CSS class names prefixed `cs-` (core-shell). No CSS-in-JS, no Tailwind. Colors via CSS custom properties in `tokens.css`. Each component is a standalone `.tsx` file. Components depend on types from `src/types/index.ts` and `ExtensionErrorBoundary` from `src/extension/` (created in Task 7). Since Task 7 doesn't exist yet, Task 3 creates Canvas.tsx and Panel.tsx without the error boundary wrapper — Task 7 updates them to add it.

What to build:

**`packages/core-shell/src/components/tokens.css`**:

```css
:root {
  --cs-bg: #0d1117;
  --cs-surface: #161b22;
  --cs-surface-hover: #21262d;
  --cs-border: #21262d;
  --cs-border-subtle: #30363d;
  --cs-text: #c9d1d9;
  --cs-text-muted: #8b949e;
  --cs-accent: #388bfd;
  --cs-accent-hover: #58a6ff;
  --cs-status-bar-bg: #1c4b9b;
  --cs-status-bar-text: #cce5ff;
  --cs-activity-rail-width: 44px;
  --cs-tab-bar-height: 32px;
  --cs-title-bar-height: 28px;
  --cs-status-bar-height: 20px;
}
```

**`packages/core-shell/src/components/ActivityRail.tsx`**:

```tsx
import type { ActivityRailItem } from '../types'

interface Props {
  items: ActivityRailItem[]
  bottomItems?: ActivityRailItem[]
}

export function ActivityRail({ items, bottomItems = [] }: Props) {
  return (
    <div className="cs-activity-rail" role="navigation" aria-label="Activity rail">
      <div className="cs-activity-rail__top">
        {items.map(item => (
          <button
            key={item.id}
            className={`cs-activity-rail__item ${item.active ? 'cs-activity-rail__item--active' : ''}`}
            title={item.title}
            aria-label={item.title}
            onClick={item.onClick}
          >
            {item.icon}
          </button>
        ))}
      </div>
      <div className="cs-activity-rail__bottom">
        {bottomItems.map(item => (
          <button
            key={item.id}
            className="cs-activity-rail__item"
            title={item.title}
            aria-label={item.title}
            onClick={item.onClick}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**`packages/core-shell/src/components/TabBar.tsx`**:

```tsx
import type { TabEntry } from '../types'

interface Props {
  tabs: TabEntry[]
  activeTabId: string | null
  onTabClick: (id: string) => void
  onTabClose: (id: string) => void
  onNewTab?: () => void
}

export function TabBar({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }: Props) {
  return (
    <div className="cs-tab-bar" role="tablist">
      {tabs.map(tab => (
        <div
          key={tab.id}
          className={`cs-tab ${tab.id === activeTabId ? 'cs-tab--active' : ''}`}
          role="tab"
          aria-selected={tab.id === activeTabId}
          onClick={() => onTabClick(tab.id)}
        >
          <span className="cs-tab__label">{tab.label}</span>
          <button
            className="cs-tab__close"
            onClick={e => { e.stopPropagation(); onTabClose(tab.id) }}
            aria-label="Close tab"
          >
            ×
          </button>
        </div>
      ))}
      {onNewTab && (
        <button className="cs-tab-bar__new" onClick={onNewTab} aria-label="New tab">+</button>
      )}
    </div>
  )
}
```

**`packages/core-shell/src/components/Sidebar.tsx`**:

```tsx
import type { ReactNode } from 'react'

interface Props {
  width: number
  collapsed: boolean
  onCollapseToggle: () => void
  children?: ReactNode
}

export function Sidebar({ width, collapsed, onCollapseToggle, children }: Props) {
  return (
    <div className="cs-sidebar" style={{ width: collapsed ? 28 : width }}>
      <button
        className="cs-sidebar__collapse-btn"
        onClick={onCollapseToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '\u203A' : '\u2039'}
      </button>
      {!collapsed && <div className="cs-sidebar__content">{children}</div>}
    </div>
  )
}
```

**`packages/core-shell/src/components/Canvas.tsx`** (no error boundary yet — added in Task 7):

```tsx
import type { ReactNode } from 'react'

interface Props {
  children?: ReactNode
  extensionId?: string
}

export function Canvas({ children }: Props) {
  return (
    <div className="cs-canvas">
      {children ?? (
        <div className="cs-canvas__empty">
          <span>No extension loaded</span>
        </div>
      )}
    </div>
  )
}
```

**`packages/core-shell/src/components/RightSidebar.tsx`**:

```tsx
import type { ReactNode } from 'react'

interface Props {
  width: number
  visible: boolean
  children?: ReactNode
}

export function RightSidebar({ width, visible, children }: Props) {
  if (!visible) return null
  return <div className="cs-right-sidebar" style={{ width }}>{children}</div>
}
```

**`packages/core-shell/src/components/Panel.tsx`** (no error boundary yet — added in Task 7):

```tsx
import type { ReactNode } from 'react'

interface Props {
  height: number
  collapsed: boolean
  onCollapseToggle: () => void
  children?: ReactNode
}

export function Panel({ height, collapsed, onCollapseToggle, children }: Props) {
  return (
    <div className="cs-panel" style={{ height: collapsed ? 28 : height }}>
      <div className="cs-panel__header">
        <button
          className="cs-panel__collapse-btn"
          onClick={onCollapseToggle}
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '\u25B2' : '\u25BC'}
        </button>
      </div>
      {!collapsed && (
        <div className="cs-panel__content">{children}</div>
      )}
    </div>
  )
}
```

**`packages/core-shell/src/components/StatusBar.tsx`**:

```tsx
import type { ReactNode } from 'react'

interface Props {
  leftItems?: ReactNode[]
  rightItems?: ReactNode[]
}

export function StatusBar({ leftItems = [], rightItems = [] }: Props) {
  return (
    <div className="cs-status-bar" role="status">
      <div className="cs-status-bar__left">
        {leftItems.map((item, i) => (
          <span key={i} className="cs-status-bar__item">{item}</span>
        ))}
      </div>
      <div className="cs-status-bar__right">
        {rightItems.map((item, i) => (
          <span key={i} className="cs-status-bar__item">{item}</span>
        ))}
      </div>
    </div>
  )
}
```

**`packages/core-shell/src/components/CommandPalette.tsx`**:

```tsx
import { useState, useEffect } from 'react'
import type { CommandEntry } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  commands: CommandEntry[]
}

export function CommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState('')
  const filtered = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  if (!open) return null

  return (
    <div
      className="cs-command-palette-overlay"
      onClick={onClose}
      role="dialog"
      aria-label="Command palette"
      aria-modal
    >
      <div className="cs-command-palette" onClick={e => e.stopPropagation()}>
        <input
          className="cs-command-palette__input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type a command..."
          autoFocus
          aria-label="Search commands"
        />
        <ul className="cs-command-palette__list" role="listbox">
          {filtered.map(cmd => (
            <li
              key={cmd.id}
              className="cs-command-palette__item"
              role="option"
              onClick={() => { cmd.onSelect(); onClose() }}
            >
              {cmd.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

**Update `packages/core-shell/src/index.ts`** — add component exports:

```typescript
export { ActivityRail } from './components/ActivityRail'
export { TabBar } from './components/TabBar'
export { Sidebar } from './components/Sidebar'
export { Canvas } from './components/Canvas'
export { RightSidebar } from './components/RightSidebar'
export { Panel } from './components/Panel'
export { StatusBar } from './components/StatusBar'
export { CommandPalette } from './components/CommandPalette'
export * from './types'
```

Theory of Success: `pnpm --filter core-shell build` succeeds with all 8 components compiled into `dist/index.js`.
Proof: `cd /Users/ken/workspace/ms/core-shell && pnpm --filter core-shell build 2>&1 | tail -10`

NFR scan:
- Accessibility: all interactive elements have `aria-label` — verified in component code
- Styling: zero external CSS libraries — only plain CSS class names; the stylesheet is created in Task 4

Commit: `feat(1a-task3): shell chrome components`

---

## Task 4: Shell Zustand Store + Full CSS

Context: The store is the reactive state engine for the shell. Components read from it; only shell actions mutate it. CSS provides the full layout for all chrome components — imported via `shell.css` which also imports `tokens.css`. Vite will extract this to `dist/index.css` during library build.

What to build:

**`packages/core-shell/src/store/shell-store.ts`**:

```typescript
import { create } from 'zustand'
import type { TabEntry, CommandEntry, LayoutState } from '../types'

interface ShellStore {
  activeExtension: string | null
  tabs: TabEntry[]
  activeTabId: string | null
  layout: LayoutState
  theme: 'light' | 'dark'
  commandPaletteOpen: boolean
  commands: CommandEntry[]

  // Actions
  setLayout: (patch: Partial<LayoutState>) => void
  openTab: (tab: TabEntry) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
  registerCommand: (cmd: CommandEntry) => void
  setActiveExtension: (id: string | null) => void
}

const DEFAULT_LAYOUT: LayoutState = {
  sidebarWidth: 220,
  sidebarCollapsed: false,
  panelHeight: 200,
  panelCollapsed: false,
  rightSidebarWidth: 280,
  rightSidebarVisible: false,
}

export const useShellStore = create<ShellStore>((set) => ({
  activeExtension: null,
  tabs: [],
  activeTabId: null,
  layout: DEFAULT_LAYOUT,
  theme: 'dark',
  commandPaletteOpen: false,
  commands: [],

  setLayout: (patch) => set(s => ({ layout: { ...s.layout, ...patch } })),

  openTab: (tab) => set(s => ({
    tabs: [...s.tabs, tab],
    activeTabId: tab.id,
  })),

  closeTab: (id) => set(s => {
    const tabs = s.tabs.filter(t => t.id !== id)
    return {
      tabs,
      activeTabId: s.activeTabId === id
        ? (tabs[tabs.length - 1]?.id ?? null)
        : s.activeTabId,
    }
  }),

  setActiveTab: (id) => set({ activeTabId: id }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),

  registerCommand: (cmd) => set(s => ({
    commands: [...s.commands.filter(c => c.id !== cmd.id), cmd],
  })),

  setActiveExtension: (id) => set({ activeExtension: id }),
}))
```

**`packages/core-shell/src/components/shell.css`** — comprehensive layout CSS for all shell chrome:

```css
@import './tokens.css';

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Root container */
.cs-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--cs-bg);
  color: var(--cs-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
}

/* Title bar */
.cs-title-bar {
  height: var(--cs-title-bar-height);
  background: var(--cs-surface);
  border-bottom: 1px solid var(--cs-border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  flex-shrink: 0;
  -webkit-app-region: drag;
  user-select: none;
}
.cs-title-bar__title {
  flex: 1;
  text-align: center;
  color: var(--cs-text-muted);
  font-size: 12px;
}

/* Tab bar */
.cs-tab-bar {
  height: var(--cs-tab-bar-height);
  background: var(--cs-bg);
  border-bottom: 1px solid var(--cs-border);
  display: flex;
  align-items: flex-end;
  padding-left: var(--cs-activity-rail-width);
  flex-shrink: 0;
  overflow-x: auto;
}
.cs-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: var(--cs-bg);
  border: 1px solid var(--cs-border);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  color: var(--cs-text-muted);
  white-space: nowrap;
}
.cs-tab--active {
  background: var(--cs-surface);
  color: var(--cs-text);
  border-top: 1.5px solid var(--cs-accent);
}
.cs-tab__close {
  background: none;
  border: none;
  color: var(--cs-text-muted);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
}
.cs-tab__close:hover {
  color: var(--cs-text);
}
.cs-tab-bar__new {
  background: none;
  border: none;
  color: var(--cs-text-muted);
  cursor: pointer;
  font-size: 18px;
  padding: 0 8px;
  margin-bottom: 4px;
}

/* Body */
.cs-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

/* Activity rail */
.cs-activity-rail {
  width: var(--cs-activity-rail-width);
  flex-shrink: 0;
  background: var(--cs-surface);
  border-right: 1px solid var(--cs-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 0;
}
.cs-activity-rail__top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}
.cs-activity-rail__bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.cs-activity-rail__item {
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--cs-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  position: relative;
}
.cs-activity-rail__item:hover {
  color: var(--cs-text);
  background: var(--cs-surface-hover);
}
.cs-activity-rail__item--active {
  color: var(--cs-text);
  background: var(--cs-surface-hover);
}
.cs-activity-rail__item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--cs-accent);
  border-radius: 0 2px 2px 0;
}

/* Sidebar */
.cs-sidebar {
  background: var(--cs-surface);
  border-right: 1px solid var(--cs-border);
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.15s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}
.cs-sidebar__collapse-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--cs-text-muted);
  cursor: pointer;
  font-size: 16px;
  z-index: 1;
}
.cs-sidebar__content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* Main content area */
.cs-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

/* Canvas */
.cs-canvas {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
}
.cs-canvas__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--cs-text-muted);
}

/* Resize handles */
.cs-resize-handle-v {
  width: 4px;
  background: transparent;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.1s;
}
.cs-resize-handle-v:hover,
.cs-resize-handle-v--dragging {
  background: var(--cs-accent);
}
.cs-resize-handle-h {
  height: 4px;
  background: transparent;
  cursor: row-resize;
  flex-shrink: 0;
  transition: background 0.1s;
}
.cs-resize-handle-h:hover,
.cs-resize-handle-h--dragging {
  background: var(--cs-accent);
}

/* Panel */
.cs-panel {
  background: var(--cs-surface);
  border-top: 1px solid var(--cs-border);
  flex-shrink: 0;
  overflow: hidden;
  transition: height 0.15s ease;
  display: flex;
  flex-direction: column;
}
.cs-panel__header {
  height: 28px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-bottom: 1px solid var(--cs-border);
  flex-shrink: 0;
}
.cs-panel__collapse-btn {
  background: none;
  border: none;
  color: var(--cs-text-muted);
  cursor: pointer;
  font-size: 12px;
}
.cs-panel__content {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

/* Right sidebar */
.cs-right-sidebar {
  background: var(--cs-surface);
  border-left: 1px solid var(--cs-border);
  flex-shrink: 0;
  overflow-y: auto;
}

/* Status bar */
.cs-status-bar {
  height: var(--cs-status-bar-height);
  background: var(--cs-status-bar-bg);
  display: flex;
  align-items: center;
  padding: 0 8px;
  flex-shrink: 0;
}
.cs-status-bar__left,
.cs-status-bar__right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cs-status-bar__right {
  margin-left: auto;
}
.cs-status-bar__item {
  font-size: 11px;
  color: var(--cs-status-bar-text);
  cursor: default;
}

/* Command palette */
.cs-command-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  z-index: 1000;
}
.cs-command-palette {
  background: var(--cs-surface);
  border: 1px solid var(--cs-border-subtle);
  border-radius: 8px;
  width: 560px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.cs-command-palette__input {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--cs-border);
  color: var(--cs-text);
  font-size: 14px;
  padding: 12px 16px;
  outline: none;
}
.cs-command-palette__list {
  list-style: none;
  overflow-y: auto;
  flex: 1;
}
.cs-command-palette__item {
  padding: 8px 16px;
  cursor: pointer;
  color: var(--cs-text);
}
.cs-command-palette__item:hover {
  background: var(--cs-surface-hover);
}
```

**Update `packages/core-shell/src/index.ts`** — add store export:

```typescript
export { ActivityRail } from './components/ActivityRail'
export { TabBar } from './components/TabBar'
export { Sidebar } from './components/Sidebar'
export { Canvas } from './components/Canvas'
export { RightSidebar } from './components/RightSidebar'
export { Panel } from './components/Panel'
export { StatusBar } from './components/StatusBar'
export { CommandPalette } from './components/CommandPalette'
export { useShellStore } from './store/shell-store'
export * from './types'
```

Theory of Success: `pnpm --filter core-shell build` succeeds. CSS is extracted to `dist/index.css`. All color values use CSS custom properties (no hardcoded hex outside `tokens.css`).
Proof: `cd /Users/ken/workspace/ms/core-shell && pnpm --filter core-shell build && ls packages/core-shell/dist/index.css && echo "PASS: store + CSS OK"`

NFR scan:
- Theming: all colors use CSS custom properties — no hardcoded hex outside `tokens.css`
- Animation: sidebar/panel transitions use 0.15s ease — smooth enough without `will-change` overhead

Commit: `feat(1a-task4): shell store + CSS layout`

---

## Task 5: Shell + ShellProvider Composition + Resize Handles

Context: `Shell` is the root layout component — it composes all chrome components and owns resize handle logic. `ShellProvider` wraps the app root (Phase 1A: passthrough; Phase 1B: wires extension registry). Shell imports `shell.css` which triggers CSS inclusion in the Vite library build output.

What to build:

**`packages/core-shell/src/components/Shell.tsx`**:

```tsx
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import './shell.css'
import { useShellStore } from '../store/shell-store'
import { ActivityRail } from './ActivityRail'
import { TabBar } from './TabBar'
import { Sidebar } from './Sidebar'
import { Canvas } from './Canvas'
import { RightSidebar } from './RightSidebar'
import { Panel } from './Panel'
import { StatusBar } from './StatusBar'
import { CommandPalette } from './CommandPalette'

interface ShellProps {
  children?: ReactNode
}

export function Shell({ children }: ShellProps) {
  const {
    layout, setLayout,
    tabs, activeTabId, closeTab, setActiveTab,
    commandPaletteOpen, openCommandPalette, closeCommandPalette,
    commands,
  } = useShellStore()

  const [draggingV, setDraggingV] = useState(false)
  const [draggingH, setDraggingH] = useState(false)

  const startDragV = (e: React.MouseEvent) => {
    e.preventDefault()
    setDraggingV(true)
    const startX = e.clientX
    const startW = layout.sidebarWidth
    const onMove = (ev: MouseEvent) => {
      requestAnimationFrame(() =>
        setLayout({ sidebarWidth: Math.max(150, Math.min(500, startW + ev.clientX - startX)) })
      )
    }
    const onUp = () => {
      setDraggingV(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const startDragH = (e: React.MouseEvent) => {
    e.preventDefault()
    setDraggingH(true)
    const startY = e.clientY
    const startH = layout.panelHeight
    const onMove = (ev: MouseEvent) => {
      requestAnimationFrame(() =>
        setLayout({ panelHeight: Math.max(80, Math.min(600, startH - (ev.clientY - startY))) })
      )
    }
    const onUp = () => {
      setDraggingH(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // Cmd+Shift+P / Ctrl+Shift+P to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        openCommandPalette()
      }
      if (e.key === 'Escape') {
        closeCommandPalette()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openCommandPalette, closeCommandPalette])

  return (
    <div className="cs-root">
      <div className="cs-title-bar">
        <span className="cs-title-bar__title">core-shell</span>
      </div>

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabClick={setActiveTab}
        onTabClose={closeTab}
      />

      <div className="cs-body">
        <ActivityRail items={[]} />

        {!layout.sidebarCollapsed && (
          <>
            <Sidebar
              width={layout.sidebarWidth}
              collapsed={layout.sidebarCollapsed}
              onCollapseToggle={() => setLayout({ sidebarCollapsed: true })}
            >
              <p style={{ color: 'var(--cs-text-muted)', fontSize: 12 }}>No extension loaded</p>
            </Sidebar>
            <div
              className={`cs-resize-handle-v ${draggingV ? 'cs-resize-handle-v--dragging' : ''}`}
              onMouseDown={startDragV}
            />
          </>
        )}

        {layout.sidebarCollapsed && (
          <button
            style={{
              width: 28,
              background: 'var(--cs-surface)',
              border: 'none',
              color: 'var(--cs-text-muted)',
              cursor: 'pointer',
              borderRight: '1px solid var(--cs-border)',
              fontSize: 16,
            }}
            onClick={() => setLayout({ sidebarCollapsed: false })}
            aria-label="Expand sidebar"
          >
            {'\u203A'}
          </button>
        )}

        <div className="cs-main">
          <Canvas>{children}</Canvas>
          <div
            className={`cs-resize-handle-h ${draggingH ? 'cs-resize-handle-h--dragging' : ''}`}
            onMouseDown={startDragH}
          />
          <Panel
            height={layout.panelHeight}
            collapsed={layout.panelCollapsed}
            onCollapseToggle={() => setLayout({ panelCollapsed: !layout.panelCollapsed })}
          >
            <p style={{ color: 'var(--cs-text-muted)', fontSize: 12 }}>No panel extension loaded</p>
          </Panel>
        </div>

        <RightSidebar
          width={layout.rightSidebarWidth}
          visible={layout.rightSidebarVisible}
        />
      </div>

      <StatusBar
        leftItems={['core-shell v0.1']}
        rightItems={['ready']}
      />

      <CommandPalette
        open={commandPaletteOpen}
        onClose={closeCommandPalette}
        commands={commands}
      />
    </div>
  )
}
```

**`packages/core-shell/src/components/ShellProvider.tsx`**:

```tsx
import type { ReactNode } from 'react'
import type { Manifest } from '../types'

interface Props {
  extensions?: Manifest[]
  children: ReactNode
}

export function ShellProvider({ children }: Props) {
  // Phase 1B: extension discovery + registry wired here
  // Phase 1A: passthrough — extensions prop accepted but not processed
  return <>{children}</>
}
```

**Update `packages/core-shell/src/index.ts`** — add Shell and ShellProvider exports:

```typescript
export { Shell } from './components/Shell'
export { ShellProvider } from './components/ShellProvider'
export { ActivityRail } from './components/ActivityRail'
export { TabBar } from './components/TabBar'
export { Sidebar } from './components/Sidebar'
export { Canvas } from './components/Canvas'
export { RightSidebar } from './components/RightSidebar'
export { Panel } from './components/Panel'
export { StatusBar } from './components/StatusBar'
export { CommandPalette } from './components/CommandPalette'
export { useShellStore } from './store/shell-store'
export * from './types'
```

Theory of Success: `pnpm --filter core-shell build` succeeds with Shell and ShellProvider compiled. The `dist/index.js` exports both.
Proof: `cd /Users/ken/workspace/ms/core-shell && pnpm --filter core-shell build && echo "PASS: Shell + ShellProvider OK"`

NFR scan:
- Keyboard: Cmd+Shift+P / Ctrl+Shift+P opens command palette — verified in Task 6 manual test
- Memory: `mouseup` listener always cleaned up on drag end — no leak

Commit: `feat(1a-task5): Shell + ShellProvider + resize handles`

---

## Task 6: packages/demo-app Electron Scaffold

Context: demo-app is a reference Electron app that imports core-shell and renders the shell. Uses electron-vite (same as canvas project). electron-vite expects 3 tsconfig files: `tsconfig.json` (references), `tsconfig.node.json` (main + preload), `tsconfig.web.json` (renderer). The renderer imports `<ShellProvider><Shell /></ShellProvider>` from `core-shell` and the compiled CSS from `core-shell/dist/index.css`.

What to build:

Create `packages/demo-app/`.

**`packages/demo-app/package.json`**:

```json
{
  "name": "demo-app",
  "version": "0.1.0",
  "private": true,
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview"
  },
  "dependencies": {
    "core-shell": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "electron": "^41.1.1",
    "electron-builder": "^26.8.1",
    "electron-vite": "^5.0.0",
    "typescript": "^5.8.3",
    "vite": "^8.0.3",
    "@vitejs/plugin-react": "^4"
  }
}
```

**`packages/demo-app/electron.vite.config.ts`**:

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [react()],
  },
})
```

**`packages/demo-app/tsconfig.json`** (references — electron-vite convention):

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

**`packages/demo-app/tsconfig.node.json`** (main + preload processes):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./out",
    "rootDir": ".",
    "types": ["node"]
  },
  "include": [
    "src/main/**/*.ts",
    "src/preload/**/*.ts",
    "electron.vite.config.ts"
  ]
}
```

**`packages/demo-app/tsconfig.web.json`** (renderer process):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "outDir": "./out",
    "rootDir": ".",
    "paths": {
      "@renderer/*": ["./src/renderer/src/*"]
    }
  },
  "include": [
    "src/renderer/src/**/*.ts",
    "src/renderer/src/**/*.tsx"
  ]
}
```

**`packages/demo-app/src/main/index.ts`**:

```typescript
import { app, BrowserWindow } from 'electron'
import { join } from 'path'

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
```

**`packages/demo-app/src/preload/index.ts`**:

```typescript
import { contextBridge } from 'electron'

// Phase 1B: full IPC bridge exposed here via createPreloadBridge from core-shell/preload
contextBridge.exposeInMainWorld('shellBridge', {})
```

**`packages/demo-app/src/renderer/index.html`**:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Demo App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**`packages/demo-app/src/renderer/src/main.tsx`**:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**`packages/demo-app/src/renderer/src/App.tsx`**:

```tsx
import { ShellProvider, Shell } from 'core-shell'
import 'core-shell/dist/index.css'

export function App() {
  return (
    <ShellProvider extensions={[]}>
      <Shell />
    </ShellProvider>
  )
}
```

> **Important:** The CSS import `core-shell/dist/index.css` works because `core-shell` is a workspace dependency resolved to the local `packages/core-shell/` directory. The CSS file is produced by `pnpm --filter core-shell build` (Task 4). You must build core-shell before running demo-app for the first time.

After creating all files, run from repo root:
```bash
pnpm install
pnpm --filter core-shell build
pnpm --filter demo-app dev
```

Theory of Success: `pnpm --filter demo-app dev` from repo root opens an Electron window showing:
- Title bar (top, draggable)
- Tab bar (below title bar, offset by activity rail width)
- Activity rail (44px left strip)
- Collapsible sidebar (220px, left of canvas)
- Vertical resize handle between sidebar and canvas (blue highlight on hover)
- Main canvas area (center, says "No extension loaded")
- Horizontal resize handle between canvas and panel
- Collapsible panel at bottom (says "No panel extension loaded")
- Status bar footer (blue, "core-shell v0.1" left, "ready" right)
- Cmd+Shift+P opens command palette overlay
- No console errors in DevTools

Proof: `cd /Users/ken/workspace/ms/core-shell && pnpm install && pnpm --filter core-shell build && pnpm --filter demo-app dev` — Electron window opens — open DevTools (Cmd+Option+I) — console shows 0 errors.

NFR scan:
- Security: `contextIsolation: true`, `nodeIntegration: false` — confirmed in `src/main/index.ts`
- DX: single command `pnpm dev` at repo root starts demo-app (via root `package.json` scripts)

Commit: `feat(1a-task6): demo-app Electron scaffold`

---

## Task 7: ExtensionErrorBoundary + Stub Hooks

Context: Error boundaries wrap each extension slot so a crashing extension doesn't take down the shell. `useShell()` and `useExtensionStore()` are Phase 1A stubs — minimal implementations that work for demo-app but will be replaced with full IPC-backed versions in Phase 1B. After creating these files, update Canvas.tsx and Panel.tsx to wrap children in `<ExtensionErrorBoundary>`.

What to build:

**`packages/core-shell/src/extension/ExtensionErrorBoundary.tsx`**:

```tsx
import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  extensionId: string
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ExtensionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[core-shell] Extension "${this.props.extensionId}" crashed:`, error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    // Phase 1B: trigger full extension hot-reload via shell.reloadExtension(this.props.extensionId)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100%', gap: 12, padding: 24,
        }}>
          <div style={{ fontSize: 24 }}>&#x26A0;&#xFE0F;</div>
          <div style={{ color: '#f85149', fontWeight: 700 }}>Extension crashed</div>
          <div style={{
            color: '#8b949e', fontSize: 12, textAlign: 'center', fontFamily: 'monospace',
          }}>
            {this.props.extensionId} &middot; {this.state.error?.message}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={this.handleReload}
              style={{
                padding: '6px 14px', background: '#1c2d1e',
                border: '1px solid #3fb950', borderRadius: 4,
                color: '#3fb950', cursor: 'pointer',
              }}
            >
              &#x21BA; Reload Extension
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

**`packages/core-shell/src/extension/useShell.ts`**:

```typescript
// Phase 1A stub — re-exports the shell store directly.
// Phase 1B: returns full ShellAPI with IPC bridge, extension-scoped actions.
export { useShellStore as useShell } from '../store/shell-store'
```

**`packages/core-shell/src/extension/useExtensionStore.ts`**:

```typescript
import { useState } from 'react'

// Phase 1A stub — simple React state.
// Phase 1B: isolated per extension, persisted by shell, keyed by extension ID.
export function useExtensionStore<T>(initialState: T): [T, (update: Partial<T>) => void] {
  const [state, setState] = useState<T>(initialState)
  return [state, (update) => setState(prev => ({ ...prev, ...update }))]
}
```

**Update `packages/core-shell/src/components/Canvas.tsx`** — wrap children in error boundary:

```tsx
import type { ReactNode } from 'react'
import { ExtensionErrorBoundary } from '../extension/ExtensionErrorBoundary'

interface Props {
  children?: ReactNode
  extensionId?: string
}

export function Canvas({ children, extensionId = 'canvas' }: Props) {
  return (
    <div className="cs-canvas">
      <ExtensionErrorBoundary extensionId={extensionId}>
        {children ?? (
          <div className="cs-canvas__empty">
            <span>No extension loaded</span>
          </div>
        )}
      </ExtensionErrorBoundary>
    </div>
  )
}
```

**Update `packages/core-shell/src/components/Panel.tsx`** — wrap content in error boundary:

```tsx
import type { ReactNode } from 'react'
import { ExtensionErrorBoundary } from '../extension/ExtensionErrorBoundary'

interface Props {
  height: number
  collapsed: boolean
  onCollapseToggle: () => void
  children?: ReactNode
}

export function Panel({ height, collapsed, onCollapseToggle, children }: Props) {
  return (
    <div className="cs-panel" style={{ height: collapsed ? 28 : height }}>
      <div className="cs-panel__header">
        <button
          className="cs-panel__collapse-btn"
          onClick={onCollapseToggle}
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? '\u25B2' : '\u25BC'}
        </button>
      </div>
      {!collapsed && (
        <ExtensionErrorBoundary extensionId="panel">
          <div className="cs-panel__content">{children}</div>
        </ExtensionErrorBoundary>
      )}
    </div>
  )
}
```

**Update `packages/core-shell/src/index.ts`** — add all extension exports (final barrel):

```typescript
export { Shell } from './components/Shell'
export { ShellProvider } from './components/ShellProvider'
export { ActivityRail } from './components/ActivityRail'
export { TabBar } from './components/TabBar'
export { Sidebar } from './components/Sidebar'
export { Canvas } from './components/Canvas'
export { RightSidebar } from './components/RightSidebar'
export { Panel } from './components/Panel'
export { StatusBar } from './components/StatusBar'
export { CommandPalette } from './components/CommandPalette'
export { ExtensionErrorBoundary } from './extension/ExtensionErrorBoundary'
export { useShell } from './extension/useShell'
export { useExtensionStore } from './extension/useExtensionStore'
export { useShellStore } from './store/shell-store'
export * from './types'
```

After updating, rebuild core-shell and restart demo-app:

```bash
pnpm --filter core-shell build && pnpm --filter demo-app dev
```

Theory of Success: Error boundary catches extension crashes without taking down the shell. To verify: temporarily add `throw new Error('test crash')` as the first line inside the Canvas component's `<ExtensionErrorBoundary>` children (e.g., wrap the "No extension loaded" span in a component that throws) — the error boundary UI shows in the canvas slot (red warning, error message, Reload button) while sidebar, panel, and status bar remain visible. Remove the throw to return to normal render.

Proof: Build and run: `pnpm --filter core-shell build && pnpm --filter demo-app dev` — verify shell renders with all chrome regions — open DevTools — 0 console errors.

NFR scan:
- Isolation: boundary wraps per-slot children (Canvas, Panel) — not the whole app
- Logging: `componentDidCatch` logs to console with extension ID — surfaced to developer immediately

Commit: `feat(1a-task7): ExtensionErrorBoundary + stub hooks`

---

## Final Verification

After all 7 tasks are committed, run from repo root:

```bash
cd /Users/ken/workspace/ms/core-shell
pnpm install && pnpm --filter core-shell build && pnpm --filter demo-app dev
```

This is the Phase 1A Theory of Success: **full shell chrome visible in Electron, resize works, command palette opens on Cmd+Shift+P, no console errors.**

Expected file tree at completion:

```
core-shell/
├── package.json                          (root, private)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
├── README.md
├── docs/plans/
│   ├── 2026-04-20-core-shell-design.md
│   └── 2026-04-20-core-shell-phase-1a.md
└── packages/
    ├── core-shell/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── vite.config.ts
    │   └── src/
    │       ├── index.ts                  (barrel)
    │       ├── types/index.ts
    │       ├── store/shell-store.ts
    │       ├── components/
    │       │   ├── tokens.css
    │       │   ├── shell.css
    │       │   ├── Shell.tsx
    │       │   ├── ShellProvider.tsx
    │       │   ├── ActivityRail.tsx
    │       │   ├── TabBar.tsx
    │       │   ├── Sidebar.tsx
    │       │   ├── Canvas.tsx
    │       │   ├── RightSidebar.tsx
    │       │   ├── Panel.tsx
    │       │   ├── StatusBar.tsx
    │       │   └── CommandPalette.tsx
    │       ├── extension/
    │       │   ├── ExtensionErrorBoundary.tsx
    │       │   ├── useShell.ts
    │       │   └── useExtensionStore.ts
    │       ├── main/index.ts             (stub)
    │       └── preload/index.ts          (stub)
    └── demo-app/
        ├── package.json
        ├── electron.vite.config.ts
        ├── tsconfig.json
        ├── tsconfig.node.json
        ├── tsconfig.web.json
        └── src/
            ├── main/index.ts
            ├── preload/index.ts
            └── renderer/
                ├── index.html
                └── src/
                    ├── main.tsx
                    └── App.tsx
```
