export default function TicketDetailLoading() {
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 }
  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* Back + badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="skeleton" style={{ width: 90, height: 14 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 60, height: 24, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 8 }} />
        </div>
      </div>

      {/* Title card */}
      <div style={card}>
        <div className="skeleton" style={{ width: 100, height: 11, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 120, height: 28, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: '70%', height: 16 }} />
      </div>

      {/* Dates */}
      <div style={card}>
        <div className="skeleton" style={{ width: 140, height: 12, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ width: 80, height: 11, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: 100, height: 16 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Assignment */}
      <div style={card}>
        <div className="skeleton" style={{ width: 180, height: 12, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ width: 80, height: 11, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: 120, height: 16 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Classification */}
      <div style={card}>
        <div className="skeleton" style={{ width: 120, height: 12, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ width: 90, height: 11, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: 110, height: 16 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div style={card}>
        <div className="skeleton" style={{ width: 100, height: 12, marginBottom: 16 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ width: i === 3 ? '60%' : '100%', height: 14, marginBottom: 8 }} />
        ))}
      </div>
    </div>
  )
}
