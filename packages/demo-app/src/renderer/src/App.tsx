import { ShellProvider, Shell } from 'core-shell'
import 'core-shell/dist/style.css'

export function App() {
  return (
    <ShellProvider extensions={[]}>
      <Shell />
    </ShellProvider>
  )
}
