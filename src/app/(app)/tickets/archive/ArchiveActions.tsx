'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ArchiveActions({ ticketId, isAdmin }: { ticketId: string; isAdmin: boolean }) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState<'restore' | 'delete' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function restore() {
    setLoading('restore')
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivedAt: null }),
    })
    if (res.ok) router.refresh()
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Failed to restore'); setLoading(null) }
  }

  async function deletePermanently() {
    setLoading('delete')
    setError(null)
    const res = await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' })
    if (res.ok) { setShowDeleteModal(false); router.refresh() }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Failed to delete'); setLoading(null) }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={restore}
          disabled={loading !== null}
          style={{
            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
            background: 'var(--primary)', color: '#fff', border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading === 'restore' ? 0.6 : 1,
          }}
        >
          {loading === 'restore' ? '…' : 'Restore'}
        </button>
        {isAdmin && (
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={loading !== null}
            style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
              background: 'transparent', border: '1px solid #fca5a5', color: '#dc2626',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading === 'delete' ? 0.6 : 1,
            }}
          >
            Delete
          </button>
        )}
      </div>

      {showDeleteModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !loading && setShowDeleteModal(false)}
        >
          <div
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px 32px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
              </div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                Permanently delete this ticket?
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', lineHeight: 1.6, marginBottom: '20px' }}>
              This action cannot be undone. The ticket and all its data will be permanently removed from the system.
            </p>
            {error && (
              <p style={{ fontSize: '13px', color: '#dc2626', marginBottom: '16px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>
                {error}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading !== null}
                style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={deletePermanently}
                disabled={loading !== null}
                style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#dc2626', border: 'none', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading === 'delete' ? 0.7 : 1 }}
              >
                {loading === 'delete' ? 'Deleting…' : 'Yes, delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
