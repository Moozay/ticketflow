export default function PartnerDetailLoading() {
  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div className="skeleton" style={{ width: 100, height: 13, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: 220, height: 30, marginBottom: 32 }} />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 32 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
            <div className="skeleton" style={{ width: 80, height: 11, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: 60, height: 30 }} />
          </div>
        ))}
      </div>

      {/* Charts */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div className="skeleton" style={{ width: 180, height: 13, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 8 }} />
        </div>
      ))}

      {/* Ticket table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginTop: 24 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 14px', borderBottom: i < 7 ? '1px solid var(--border)' : 'none' }}>
            {[70, 80, 140, 90, 70, 50].map((w, j) => (
              <div key={j} className="skeleton" style={{ width: w, height: 14, flexShrink: 0 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
