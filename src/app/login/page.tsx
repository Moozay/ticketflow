'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) setError('Invalid email or password')
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style={{ background: 'var(--primary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>TicketFlow</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Internal · L1 Support</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--foreground)' }}>Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg text-sm" style={{ background: '#fef2f2', color: 'var(--destructive)', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                placeholder="you@mdesignsolutions.be"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-all mt-2"
              style={{
                background: loading ? 'var(--border)' : 'var(--primary)',
                color: 'var(--primary-foreground)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted-foreground)' }}>
          Contact your admin to reset your password
        </p>
      </div>
    </div>
  )
}
