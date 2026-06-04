export default function SettingsLoading() {
  return (
    <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
      <div className="skeleton" style={{ width: 100, height: 26, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 300, height: 14, marginBottom: 28 }} />
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[80, 90, 80, 100, 120].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: w, height: 36, borderRadius: '6px 6px 0 0' }} />
        ))}
      </div>
      {/* List items */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < 9 ? '1px solid var(--border)' : 'none' }}>
            <div className="skeleton" style={{ width: 180, height: 14 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="skeleton" style={{ width: 50, height: 28, borderRadius: 6 }} />
              <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
