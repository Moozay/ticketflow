'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

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

export default function NewUserForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ENGINEER',
    engineerPrefix: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function reset() {
    setForm({ name: '', email: '', password: '', role: 'ENGINEER', engineerPrefix: '' })
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }
        if (form.engineerPrefix) body.engineerPrefix = parseInt(form.engineerPrefix)

        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Failed to create user')
          return
        }
        setOpen(false)
        reset()
        router.refresh()
      } catch {
        setError('Network error')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '9px 18px',
          borderRadius: '8px',
          background: 'var(--primary)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '14px',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New user
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) { setOpen(false); reset() } }}
        >
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>New User</h2>
              <button onClick={() => { setOpen(false); reset() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Full name *</label>
                <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="John Doe" />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} required placeholder="john@example.com" />
              </div>
              <div>
                <label style={labelStyle}>Password *</label>
                <input type="password" style={inputStyle} value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} placeholder="Min 6 characters" />
              </div>
              <div>
                <label style={labelStyle}>Role *</label>
                <select style={inputStyle} value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="ENGINEER">Engineer</option>
                  <option value="ADMIN">Admin</option>
                  <option value="EXTERN">Extern</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Engineer Prefix</label>
                <input
                  type="number"
                  min="1"
                  style={inputStyle}
                  value={form.engineerPrefix}
                  onChange={e => set('engineerPrefix', e.target.value)}
                  placeholder="e.g. 12 (unique per engineer)"
                />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '14px' }}>{error}</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setOpen(false); reset() }} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending} style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}>
                  {isPending ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
