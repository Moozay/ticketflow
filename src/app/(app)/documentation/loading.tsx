export default function DocumentationLoading() {
  return (
    <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
      <div className="skeleton" style={{ width: 140, height: 26, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 280, height: 14, marginBottom: 28 }} />
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: i < 9 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: '55%', height: 15, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: '80%', height: 12 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <div className="skeleton" style={{ width: 50, height: 28, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
