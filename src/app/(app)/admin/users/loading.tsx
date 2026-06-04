export default function AdminUsersLoading() {
  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div className="skeleton" style={{ width: 160, height: 26, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 240, height: 14, marginBottom: 28 }} />
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 20px', borderBottom: i < 6 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: 140, height: 15, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: 200, height: 13 }} />
            </div>
            <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 5 }} />
            <div className="skeleton" style={{ width: 80, height: 30, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
