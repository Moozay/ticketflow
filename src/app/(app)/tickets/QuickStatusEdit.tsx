'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: 'NOT_YET_STARTED', label: 'Not Yet Started' },
  { value: 'IN_PROGRESS',     label: 'In Progress' },
  { value: 'ON_HOLD',         label: 'On Hold' },
  { value: 'DONE',            label: 'Done' },
  { value: 'DONE_BY_L2',      label: 'Done by L2' },
  { value: 'ESCALATED_TO_L2', label: 'Escalated to L2' },
]

const DOC_OPTIONS = [
  { value: 'ALREADY_EXISTS', label: 'Already Exists' },
  { value: 'NOT_NEEDED',     label: 'Not Needed' },
  { value: 'WILL_CREATE',    label: 'Will Create' },
  { value: 'CREATED',        label: 'Created' },
]

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DONE:             { bg: '#f0fdf4', color: '#16a34a' },
  DONE_BY_L2:       { bg: '#f0fdf4', color: '#15803d' },
  ESCALATED_TO_L2:  { bg: '#fef3c7', color: '#d97706' },
  IN_PROGRESS:      { bg: '#eff6ff', color: '#2563eb' },
  ON_HOLD:          { bg: '#f5f3ff', color: '#7c3aed' },
  NOT_YET_STARTED:  { bg: 'var(--muted)', color: 'var(--muted-foreground)' },
}

interface Ticket {
  id: string
  ticketNumber: string
  status: string
  issueTopic: string | null
  actualEnd: Date | null
  documentationStatus: string
  description: string | null
}

interface Props {
  ticket: Ticket
  issueTopics: string[]
}

const inp: React.CSSProperties = {
  background: 'var(--input-bg)', border: '1px solid var(--border)',
  color: 'var(--foreground)', borderRadius: 8, padding: '8px 10px',
  fontSize: 13, width: '100%', outline: 'none',
}

export default function QuickStatusEdit({ ticket, issueTopics }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(ticket.status)
  const [issueTopic, setIssueTopic] = useState(ticket.issueTopic ?? '')
  const [actualEnd, setActualEnd] = useState(
    ticket.actualEnd ? new Date(ticket.actualEnd).toISOString().split('T')[0] : ''
  )
  const [docStatus, setDocStatus] = useState(ticket.documentationStatus)
  const [description, setDescription] = useState(ticket.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDone = status === 'DONE' || status === 'DONE_BY_L2'

  // Auto-set actual end to today when switching to Done if not already set
  function handleStatusChange(newStatus: string) {
    setStatus(newStatus)
    if ((newStatus === 'DONE' || newStatus === 'DONE_BY_L2') && !actualEnd) {
      setActualEnd(new Date().toISOString().split('T')[0])
    }
  }
  const isOnHold = status === 'ON_HOLD'
  const isEscalated = status === 'ESCALATED_TO_L2'
  const needsExtra = isDone || isOnHold || isEscalated

  function open_modal() {
    setStatus(ticket.status)
    setIssueTopic(ticket.issueTopic ?? '')
    setActualEnd(ticket.actualEnd ? new Date(ticket.actualEnd).toISOString().split('T')[0] : '')
    setDocStatus(ticket.documentationStatus)
    setDescription(ticket.description ?? '')
    setError(null)
    setOpen(true)
  }

  async function handleSave() {
    setError(null)

    if (isDone && !issueTopic) { setError('Issue Topic is required when status is Done.'); return }
    if (isDone && !actualEnd) { setError('Actual End date is required when status is Done.'); return }
    if (isDone && (!docStatus || docStatus === 'UNKNOWN')) { setError('Documentation Status is required when status is Done.'); return }
    if (isOnHold && !description.trim()) { setError('Description is required to justify why the ticket is On Hold.'); return }
    if (isEscalated && !description.includes('atlassian.net')) { setError('A Jira link (atlassian.net) is required in the description when escalating to L2.'); return }

    setSaving(true)
    try {
      const body: Record<string, unknown> = { status }
      if (isDone) {
        body.issueTopic = issueTopic
        body.actualEnd = actualEnd
        body.documentationStatus = docStatus
      }
      if (isOnHold || isEscalated) body.description = description

      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to update status')
        return
      }
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const statusStyle = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.NOT_YET_STARTED

  return (
    <>
      {/* Edit button */}
      <button
        onClick={open_modal}
        title="Change status"
        style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 6,
          padding: '3px 8px', cursor: 'pointer', color: 'var(--muted-foreground)',
          fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
          transition: 'all 0.1s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)' }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit
      </button>

      {/* Modal */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !saving && setOpen(false)}
        >
          <div
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px', maxWidth: 460, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)', marginBottom: 4 }}>
                Update Status
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'monospace' }}>{ticket.ticketNumber}</span>
                <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: statusStyle.bg, color: statusStyle.color }}>
                  {STATUS_OPTIONS.find(s => s.value === ticket.status)?.label ?? ticket.status}
                </span>
              </div>
            </div>

            {/* Status selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', display: 'block', marginBottom: 6 }}>New Status</label>
              <select value={status} onChange={e => handleStatusChange(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            {/* Conditional fields — smooth appearance */}
            {isDone && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, background: 'var(--muted)', borderRadius: 10, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', margin: 0 }}>Required for Done</p>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: 5 }}>Issue Topic *</label>
                  <select value={issueTopic} onChange={e => setIssueTopic(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Select issue topic…</option>
                    {issueTopics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: 5 }}>Actual End Date *</label>
                  <input type="date" value={actualEnd} onChange={e => setActualEnd(e.target.value)} style={inp} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: 5 }}>Documentation Status *</label>
                  <select value={docStatus} onChange={e => setDocStatus(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    {DOC_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {(isOnHold || isEscalated) && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', display: 'block', marginBottom: 5 }}>
                  {isEscalated ? 'Description (Jira link required) *' : 'Description — reason for hold *'}
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder={isEscalated ? 'Include the Jira ticket URL (atlassian.net)…' : 'Explain why this ticket is on hold…'}
                  style={{ ...inp, resize: 'vertical', minHeight: 80 }}
                />
                {isEscalated && description && !description.includes('atlassian.net') && (
                  <p style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>Must include a Jira link (atlassian.net)</p>
                )}
              </div>
            )}

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontSize: 12, marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)} disabled={saving}
                style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: saving ? 'var(--border)' : 'var(--primary)', border: 'none', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', minWidth: 90 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
