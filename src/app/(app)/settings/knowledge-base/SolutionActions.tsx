'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Solution = {
  id: string
  title: string
  description: string | null
  category: string | null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--input-bg, var(--card))',
  color: 'var(--foreground)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--muted-foreground)',
  marginBottom: '4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

export default function SolutionActions({ solution }: { solution: Solution }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: solution.title,
    description: solution.description ?? '',
    category: solution.category ?? '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/solutions/${solution.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Failed to update')
          return
        }
        setEditOpen(false)
        router.refresh()
      } catch {
        setError('Network error')
      }
    })
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await fetch(`/api/solutions/${solution.id}`, { method: 'DELETE' })
      setConfirmDelete(false)
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => setEditOpen(true)}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--foreground)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            border: 'none',
            background: '#fef2f2',
            color: '#dc2626',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setEditOpen(false) }}
        >
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Edit Solution</h2>
              <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <input style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea rows={5} style={{ ...inputStyle, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '14px' }}>{error}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setEditOpen(false)} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending} style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}>
                  {isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(false) }}
        >
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 8px' }}>Delete solution?</h3>
            <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: '0 0 24px' }}>
              "{solution.title}" will be permanently deleted. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isDeleting} style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1 }}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
