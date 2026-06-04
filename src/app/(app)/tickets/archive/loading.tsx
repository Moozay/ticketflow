export default function ArchiveLoading() {
  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div className="skeleton" style={{ width: 80, height: 26, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 260, height: 14, marginBottom: 28 }} />
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 16, padding: '10px 14px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
          {[70, 120, 130, 90, 100, 80, 90, 100].map((w, i) => (
            <div key={i} className="skeleton" style={{ width: w, height: 11, flexShrink: 0 }} />
          ))}
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 14px', borderBottom: i < 7 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
            {[70, 120, 130, 80, 90, 80, 90].map((w, j) => (
              <div key={j} className="skeleton" style={{ width: w, height: 14, flexShrink: 0 }} />
            ))}
            <div style={{ display: 'flex', gap: 6 }}>
              <div className="skeleton" style={{ width: 65, height: 26, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
