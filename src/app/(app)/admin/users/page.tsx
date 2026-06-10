import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import UserActions from './UserActions'
import NewUserForm from './NewUserForm'

export default async function AdminUsersPage() {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') redirect('/dashboard')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      engineerPrefix: true,
      active: true,
      createdAt: true,
      _count: { select: { tickets: true } },
    },
  })

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Users</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            {users.length} user{users.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <NewUserForm />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
              {['Name', 'Email', 'Role', 'Prefix', 'Tickets', 'Status', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--muted-foreground)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr
                key={user.id}
                style={{
                  borderBottom: i < users.length - 1 ? '1px solid var(--border)' : undefined,
                  opacity: user.active ? 1 : 0.55,
                }}
              >
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--foreground)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--muted-foreground)' }}>{user.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{
                      background: user.role === 'ADMIN' ? '#7c3aed' : user.role === 'EXTERN' ? '#64748b' : '#2563eb',
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
                  {user.engineerPrefix ?? '—'}
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--muted-foreground)', textAlign: 'right' }}>
                  {user._count.tickets}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: user.active ? '#f0fdf4' : '#fef2f2',
                    color: user.active ? '#16a34a' : '#dc2626',
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: user.active ? '#16a34a' : '#dc2626' }} />
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                  {formatDate(user.createdAt)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <UserActions userId={user.id} userName={user.name} isActive={user.active} user={user as any} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            No users found.
          </div>
        )}
      </div>
    </div>
  )
}
