'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ArchiveButton({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleArchive() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivedAt: new Date().toISOString() }),
    })
    if (res.ok) {
      router.push('/tickets')
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Failed to archive ticket')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          background: 'transparent', border: '1px solid #fca5a5', color: '#dc2626',
          cursor: 'pointer',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
        Archive
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
          }}
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: '14px', padding: '28px 32px', maxWidth: '420px', width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                Archive this ticket?
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '20px' }}>
              The ticket will be moved to the archive and removed from the active list. You can restore it at any time from the Archive page.
            </p>
            {error && (
              <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '16px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>
                {error}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                style={{
                  padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                  background: 'var(--secondary)', border: '1px solid var(--border)',
                  color: 'var(--foreground)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={loading}
                style={{
                  padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  background: '#dc2626', border: 'none', color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Archiving…' : 'Yes, archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
