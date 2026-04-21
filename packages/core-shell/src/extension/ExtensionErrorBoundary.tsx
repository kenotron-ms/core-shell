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
              aria-label="Reload extension"
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
