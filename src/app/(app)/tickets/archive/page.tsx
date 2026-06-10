import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import ArchiveActions from './ArchiveActions'

const STATUS_STYLES: Record<string, { bg: string; color: string; ring: string }> = {
  DONE:             { bg: '#ecfdf5', color: '#047857', ring: '#a7f3d0' },
  DONE_BY_L2:       { bg: '#ecfdf5', color: '#047857', ring: '#a7f3d0' },
  ESCALATED_TO_L2:  { bg: '#fffbeb', color: '#b45309', ring: '#fde68a' },
  IN_PROGRESS:      { bg: '#eff6ff', color: '#2563eb', ring: '#bfdbfe' },
  ON_HOLD:          { bg: '#f1f5f9', color: '#64748b', ring: 'transparent' },
  NOT_YET_STARTED:  { bg: '#f5f5f5', color: '#737373', ring: 'transparent' },
}

export default async function ArchivePage() {
  const session = await auth()
  const userRole = (session?.user as any)?.role

  const tickets = await prisma.ticket.findMany({
    where: { archivedAt: { not: null } },
    orderBy: { archivedAt: 'desc' },
    select: {
      id: true, ticketNumber: true, startDate: true, archivedAt: true,
      designPartner: true, issueTopic: true, status: true, urgency: true,
      engineer: { select: { name: true } },
    },
  })

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Link href="/tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--muted-foreground)', textDecoration: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              All tickets
            </Link>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Archive</h1>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            {tickets.length} archived ticket{tickets.length !== 1 ? 's' : ''} — restore to return to the active list, or permanently delete (admin only)
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div style={{ padding: '60px 24px', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <p style={{ fontSize: '15px', color: 'var(--muted-foreground)' }}>No archived tickets</p>
        </div>
      ) : (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {['Ticket', 'Partner', 'Issue Topic', 'Status', 'Engineer', 'Start Date', 'Archived', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, i) => {
                const statusStyle = STATUS_STYLES[t.status] ?? STATUS_STYLES.NOT_YET_STARTED
                return (
                  <tr key={t.id} style={{ borderBottom: i < tickets.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <Link href={`/tickets/${t.id}`} style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
                        {t.ticketNumber}
                      </Link>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--foreground)' }}>{t.designPartner}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--muted-foreground)' }}>{t.issueTopic ?? '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 500, background: statusStyle.bg, color: statusStyle.color, boxShadow: `inset 0 0 0 1px ${statusStyle.ring}` }}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--muted-foreground)' }}>{t.engineer.name}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{formatDate(t.startDate)}</td>
                    <td style={{ padding: '12px 14px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{formatDate(t.archivedAt!)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <ArchiveActions ticketId={t.id} isAdmin={userRole === 'ADMIN'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
