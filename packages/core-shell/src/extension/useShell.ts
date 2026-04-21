// Phase 1A stub — re-exports the shell store directly.
// Phase 1B: returns full ShellAPI with IPC bridge, extension-scoped actions.
export { useShellStore as useShell } from '../store/shell-store'
