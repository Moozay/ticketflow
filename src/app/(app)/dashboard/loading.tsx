export default function DashboardLoading() {
  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div className="skeleton" style={{ width: 180, height: 28, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 320, height: 16 }} />
        </div>
        <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 8 }} />
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 36 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
            <div className="skeleton" style={{ width: 80, height: 11, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: 60, height: 32 }} />
          </div>
        ))}
      </div>

      {/* Partner chart */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 260, height: 14, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '100%', height: 400, borderRadius: 8 }} />
      </div>

      {/* Partner table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 36 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ width: 140, height: 14 }} />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 20px', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
            <div className="skeleton" style={{ width: 160, height: 14, flexShrink: 0 }} />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="skeleton" style={{ flex: 1, height: 14 }} />
            ))}
          </div>
        ))}
      </div>

      {/* Two chart cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 36 }}>
        {[240, 200].map((h, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div className="skeleton" style={{ width: 140, height: 13, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '100%', height: h, borderRadius: 8 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
