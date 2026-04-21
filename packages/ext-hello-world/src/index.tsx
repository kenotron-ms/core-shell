function Sidebar() {
  return (
    <div style={{ padding: '12px 10px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cs-text-muted)', marginBottom: 12 }}>
        Hello World
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {['Getting started', 'Extension slots', 'Shell API', 'Publishing'].map(item => (
          <div key={item} style={{
            padding: '5px 8px', borderRadius: 4, fontSize: 12,
            color: 'var(--cs-text-muted)', cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--cs-surface-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function Canvas() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 20,
      background: 'var(--cs-bg)',
    }}>
      <div style={{ fontSize: 56 }}>👋</div>
      <h1 style={{ color: 'var(--cs-text)', fontWeight: 600, fontSize: 24, margin: 0 }}>
        Hello, core-shell!
      </h1>
      <p style={{
        color: 'var(--cs-text-muted)', maxWidth: 460, textAlign: 'center',
        lineHeight: 1.6, fontSize: 14, margin: 0,
      }}>
        This canvas is contributed by <code style={{ color: 'var(--cs-accent)' }}>ext-hello-world</code>.
        Export a manifest with React components and they appear in the shell's slots.
      </p>
      <div style={{
        background: 'var(--cs-surface)', border: '1px solid var(--cs-border)',
        borderRadius: 8, padding: '16px 24px', fontFamily: 'monospace',
        fontSize: 13, color: 'var(--cs-text)', lineHeight: 1.8,
      }}>
        <div><span style={{ color: 'var(--cs-text-muted)' }}>export const</span> <span style={{ color: 'var(--cs-accent)' }}>manifest</span> = {'{'}</div>
        <div style={{ paddingLeft: 20 }}><span style={{ color: 'var(--cs-text-muted)' }}>id:</span> <span style={{ color: '#a5d6ff' }}>'ext-hello-world'</span>,</div>
        <div style={{ paddingLeft: 20 }}><span style={{ color: 'var(--cs-text-muted)' }}>contributes:</span> {'{'} canvas: Canvas, sidebar: Sidebar, ... {'}'}</div>
        <div>{'}'}</div>
      </div>
    </div>
  )
}

function RightSidebar() {
  return (
    <div style={{ padding: '12px 10px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cs-text-muted)', marginBottom: 12 }}>
        Properties
      </div>
      {[
        ['Extension', 'ext-hello-world'],
        ['Version', '0.1.0'],
        ['Slots', 'sidebar, canvas, rightSidebar'],
        ['Status', '✓ Active'],
      ].map(([label, value]) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--cs-text)' }}>{value}</div>
        </div>
      ))}
    </div>
  )
}

export const manifest = {
  id: 'ext-hello-world',
  displayName: 'Hello World',
  version: '0.1.0',
  contributes: {
    activityRail: { icon: '👋', title: 'Hello World' },
    sidebar:      Sidebar,
    canvas:       Canvas,
    rightSidebar: RightSidebar,
  },
}
