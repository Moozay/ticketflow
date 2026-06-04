export default function TicketsLoading() {
  return (
    <div className="p-8 max-w-full">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div className="skeleton" style={{ width: 80, height: 26, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 120, height: 14 }} />
        </div>
        <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 8 }} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[200, 140, 140, 140, 140, 140].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: w, height: 36, borderRadius: 8 }} />
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'flex', gap: 16, padding: '12px 16px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
          {[120, 100, 120, 140, 100, 80, 90].map((w, i) => (
            <div key={i} className="skeleton" style={{ width: w, height: 11, flexShrink: 0 }} />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 16px', borderBottom: i < 14 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: 70, height: 14, flexShrink: 0 }} />
            <div className="skeleton" style={{ width: 90, height: 13, flexShrink: 0 }} />
            <div className="skeleton" style={{ width: 110, height: 13, flexShrink: 0 }} />
            <div className="skeleton" style={{ width: 130, height: 13, flexShrink: 0 }} />
            <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 5, flexShrink: 0 }} />
            <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 5, flexShrink: 0 }} />
            <div className="skeleton" style={{ width: 80, height: 13, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
