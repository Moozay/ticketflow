import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import TicketEditForm from './TicketEditForm'
import ArchiveButton from './ArchiveButton'

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  DONE:             { bg: '#f0fdf4', color: '#16a34a' },
  DONE_BY_L2:       { bg: '#f0fdf4', color: '#15803d' },
  ESCALATED_TO_L2:  { bg: '#fef3c7', color: '#d97706' },
  IN_PROGRESS:      { bg: '#eff6ff', color: '#2563eb' },
  ON_HOLD:          { bg: '#f5f3ff', color: '#7c3aed' },
  NOT_YET_STARTED:  { bg: 'var(--muted)', color: 'var(--muted-foreground)' },
}

const URGENCY_STYLES: Record<string, { bg: string; color: string }> = {
  HIGH:          { bg: '#fef2f2', color: '#dc2626' },
  MEDIUM:        { bg: '#fef3c7', color: '#d97706' },
  LOW:           { bg: '#f0fdf4', color: '#16a34a' },
  NOT_SPECIFIED: { bg: 'var(--muted)', color: 'var(--muted-foreground)' },
}

function Badge({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        background: style.bg,
        color: style.color,
        letterSpacing: '0.01em',
      }}
    >
      {label.replace(/_/g, ' ')}
    </span>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', color: 'var(--foreground)' }}>
        {value ?? <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
      </span>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: '13px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: 'var(--muted-foreground)',
      borderBottom: '1px solid var(--border)',
      paddingBottom: '8px',
      marginBottom: '16px',
    }}>
      {children}
    </h2>
  )
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const userRole = (session?.user as any)?.role

  const [ticket, documentations, engineers, popZones, issueTopics, solutionTopics, partners] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id },
      include: {
        engineer: { select: { id: true, name: true } },
        documentations: { select: { id: true, title: true, url: true, description: true } },
        attachments: true,
      },
    }),
    prisma.documentation.findMany({ orderBy: [{ section: 'asc' }, { order: 'asc' }], select: { id: true, title: true, section: true } }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true } }),
    prisma.popZone.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
    prisma.issueTopic.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
    prisma.solutionTopic.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
    prisma.partner.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
  ])

  if (!ticket) notFound()

  const statusStyle = STATUS_STYLES[ticket.status] ?? STATUS_STYLES.NOT_YET_STARTED
  const urgencyStyle = URGENCY_STYLES[ticket.urgency] ?? URGENCY_STYLES.NOT_SPECIFIED

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Back + header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link
          href="/tickets"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            color: 'var(--muted-foreground)',
            textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All tickets
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge label={ticket.status} style={statusStyle} />
          <Badge label={ticket.urgency} style={urgencyStyle} />
          {(userRole === 'ADMIN' || userRole === 'ENGINEER') && (
            <ArchiveButton ticketId={ticket.id} />
          )}
        </div>
      </div>

      {/* Title card */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Ticket number
            </p>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
              {ticket.ticketNumber}
            </h1>
            {ticket.description && (
              <p style={{ marginTop: '8px', fontSize: '15px', color: 'var(--foreground)', lineHeight: 1.6, maxWidth: '600px' }}>
                {ticket.description}
              </p>
            )}
          </div>
          {(userRole === 'ADMIN' || userRole === 'ENGINEER') && (
            <TicketEditForm
              ticket={ticket as any}
              documentations={documentations}
              engineers={engineers}
              popZones={popZones.map(p => p.name)}
              issueTopics={issueTopics.map(t => t.name)}
              solutionTopics={solutionTopics.map(t => t.name)}
              partners={partners.map(p => p.name)}
            />
          )}
        </div>
      </div>

      {/* Dates & resolution */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <SectionHeading>Dates & Timeline</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
          <Field label="Start Date" value={formatDate(ticket.startDate)} />
          <Field label="Estimated End" value={formatDate(ticket.estimatedEnd)} />
          <Field label="Actual End" value={formatDate(ticket.actualEnd)} />
        </div>
      </div>

      {/* Assignment */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <SectionHeading>Assignment & Location</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
          <Field label="Engineer" value={ticket.engineer.name} />
          <Field label="Design Partner" value={ticket.designPartner} />
          <Field label="Subcontractor" value={ticket.subcontractor || null} />
        </div>
        <div style={{ marginTop: '20px' }}>
          <Field label="POP Zone" value={<span style={{ wordBreak: 'break-word' }}>{ticket.popZone}</span>} />
        </div>
      </div>

      {/* Classification */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <SectionHeading>Classification</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
          <Field label="Category" value={ticket.category?.replace(/_/g, ' ') || null} />
          <Field label="Issue Type" value={ticket.issueType?.replace(/_/g, ' ') || null} />
          <Field label="Issue Topic" value={
            ticket.issueTopic
              ? <span style={{ background: 'var(--accent-bg)', color: 'var(--accent-fg)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{ticket.issueTopic}</span>
              : null
          } />
          <Field label="Solution Topic" value={
            ticket.solutionTopic
              ? <span style={{ background: 'var(--accent-bg)', color: 'var(--accent-fg)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{ticket.solutionTopic}</span>
              : null
          } />
          <Field label="Can User Solve" value={ticket.canUserSolve?.replace(/_/g, ' ') || null} />
          <Field label="Documentation Status" value={ticket.documentationStatus?.replace(/_/g, ' ') || null} />
        </div>
      </div>

      {/* Documentation links */}
      {ticket.documentations.length > 0 && (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <SectionHeading>Documentation ({ticket.documentations.length})</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ticket.documentations.map(doc => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--muted)',
                  color: 'var(--foreground)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                <svg style={{ marginTop: '2px', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  <span style={{ fontWeight: 600 }}>{doc.title}</span>
                  {doc.description && (
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{doc.description}</p>
                  )}
                </div>
                <svg style={{ marginLeft: 'auto', flexShrink: 0, marginTop: '2px' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Remarks */}
      {ticket.description && (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <SectionHeading>Description</SectionHeading>
          <p style={{ fontSize: '14px', color: 'var(--foreground)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {ticket.description}
          </p>
        </div>
      )}

      {/* Flags */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <SectionHeading>Flags</SectionHeading>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {[
            { label: 'Valid Ticket', value: ticket.isValidTicket },
            { label: 'Resolved', value: ticket.status === 'DONE' || ticket.status === 'DONE_BY_L2' },
            { label: 'Outlier', value: ticket.isOutlier },
            { label: 'Escalated', value: ticket.status === 'ESCALATED_TO_L2' },
          ].map(flag => (
            <span
              key={flag.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: flag.value ? '#f0fdf4' : 'var(--muted)',
                color: flag.value ? '#16a34a' : 'var(--muted-foreground)',
                border: `1px solid ${flag.value ? '#bbf7d0' : 'var(--border)'}`,
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: flag.value ? '#16a34a' : 'var(--muted-foreground)', display: 'inline-block' }} />
              {flag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Attachments */}
      {ticket.attachments.length > 0 && (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <SectionHeading>Attachments ({ticket.attachments.length})</SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ticket.attachments.map(att => (
              <a
                key={att.id}
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'var(--muted)',
                  color: 'var(--foreground)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                {att.fileName}
                {att.fileSize && (
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    {(att.fileSize / 1024).toFixed(1)} KB
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
