'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  name: string
  email: string
  role: string
  engineerPrefix: number | null
  active: boolean
}

type Props = {
  userId: string
  userName: string
  isActive: boolean
  user: User
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

export default function UserActions({ userId, userName, isActive, user }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    engineerPrefix: user.engineerPrefix != null ? String(user.engineerPrefix) : '',
    password: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleToggle() {
    setIsToggling(true)
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !isActive }),
      })
      router.refresh()
    } finally {
      setIsToggling(false)
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
        }
        if (form.engineerPrefix) body.engineerPrefix = parseInt(form.engineerPrefix)
        if (form.password) body.password = form.password

        const res = await fetch(`/api/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Failed to update user')
          return
        }
        setEditOpen(false)
        router.refresh()
      } catch {
        setError('Network error')
      }
    })
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
          onClick={handleToggle}
          disabled={isToggling}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            border: 'none',
            background: isActive ? '#fef2f2' : '#f0fdf4',
            color: isActive ? '#dc2626' : '#16a34a',
            fontSize: '12px',
            fontWeight: 600,
            cursor: isToggling ? 'not-allowed' : 'pointer',
            opacity: isToggling ? 0.6 : 1,
          }}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {editOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setEditOpen(false) }}
        >
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', width: '100%', maxWidth: '460px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Edit — {userName}</h2>
              <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Full name</label>
                <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select style={inputStyle} value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="ENGINEER">Engineer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Engineer Prefix</label>
                <input type="number" min="1" style={inputStyle} value={form.engineerPrefix} onChange={e => set('engineerPrefix', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>New password (leave blank to keep)</label>
                <input type="password" style={inputStyle} value={form.password} onChange={e => set('password', e.target.value)} minLength={6} placeholder="Min 6 characters" />
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
    </>
  )
}
