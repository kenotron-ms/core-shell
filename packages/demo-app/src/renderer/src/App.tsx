import { ShellProvider, Shell } from 'core-shell'
import 'core-shell/dist/style.css'
import { manifest as helloWorldManifest } from 'ext-hello-world'

export function App() {
  return (
    <ShellProvider extensions={[helloWorldManifest]}>
      <Shell />
    </ShellProvider>
  )
}
