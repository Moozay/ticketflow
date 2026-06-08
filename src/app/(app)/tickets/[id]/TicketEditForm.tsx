'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type TicketData = {
  id: string
  ticketNumber: string
  startDate: Date | string
  estimatedEnd: Date | string | null
  actualEnd: Date | string | null
  category: string
  issueType: string
  urgency: string
  status: string
  popZone: string
  designPartner: string
  subcontractor: string | null
  description: string | null
  canUserSolve: string
  documentationStatus: string
  documentations: { id: string; title: string }[]
  isValidTicket: boolean
  isOutlier: boolean
  issueTopic: string | null
  solutionTopic: string | null
  engineerId: string
  engineer: { id: string; name: string }
}

type Props = {
  ticket: TicketData
  documentations: { id: string; title: string; section: string | null }[]
  engineers: { id: string; name: string }[]
  popZones: string[]
  issueTopics: string[]
  solutionTopics: string[]
  partners: string[]
}

function toDateInput(val: Date | string | null) {
  if (!val) return ''
  return new Date(val).toISOString().substring(0, 10)
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
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function SearchableMultiSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
}: {
  value: string[]
  onChange: (values: string[]) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const toggle = (val: string) =>
    onChange(value.includes(val) ? value.filter(x => x !== val) : [...value, val])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLabels = options.filter(o => value.includes(o.value)).map(o => o.label)
  const displayText = selectedLabels.length === 0
    ? placeholder
    : selectedLabels.length <= 2
      ? selectedLabels.join(', ')
      : `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); if (!open) setSearch('') }}
        style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <span style={{
          color: value.length > 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
        }}>
          {displayText}
        </span>
        <svg style={{ flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', zIndex: 100, top: '100%', left: 0, right: 0, marginTop: '4px',
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', minWidth: '200px',
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{ ...inputStyle, padding: '6px 10px', fontSize: '13px' }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <div style={{ maxHeight: '210px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>No results</p>
            ) : filtered.map(opt => (
              <label
                key={opt.value}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                  cursor: 'pointer', fontSize: '14px', color: 'var(--foreground)',
                  background: value.includes(opt.value) ? 'var(--accent-bg)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!value.includes(opt.value))
                    (e.currentTarget as HTMLElement).style.background = 'var(--muted)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background =
                    value.includes(opt.value) ? 'var(--accent-bg)' : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={value.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', flexShrink: 0 }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TicketEditForm({ ticket, documentations, engineers, popZones, issueTopics, solutionTopics, partners }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    ticketNumber: ticket.ticketNumber,
    startDate: toDateInput(ticket.startDate),
    estimatedEnd: toDateInput(ticket.estimatedEnd),
    actualEnd: toDateInput(ticket.actualEnd),
    category: ticket.category,
    issueType: ticket.issueType,
    urgency: ticket.urgency,
    status: ticket.status,
    designPartner: ticket.designPartner,
    subcontractor: ticket.subcontractor ?? '',
    description: ticket.description ?? '',
    canUserSolve: ticket.canUserSolve,
    documentationStatus: ticket.documentationStatus,
    isValidTicket: ticket.isValidTicket,
    isOutlier: ticket.isOutlier,
    engineerId: ticket.engineerId,
  })

  // Multi-select state (arrays)
  const [selectedPopZones, setSelectedPopZones] = useState<string[]>(() =>
    ticket.popZone ? ticket.popZone.split(', ').filter(Boolean) : []
  )
  const [selectedIssueTopics, setSelectedIssueTopics] = useState<string[]>(() =>
    ticket.issueTopic ? ticket.issueTopic.split(', ').filter(Boolean) : []
  )
  const [selectedSolutionTopics, setSelectedSolutionTopics] = useState<string[]>(() =>
    ticket.solutionTopic ? ticket.solutionTopic.split(', ').filter(Boolean) : []
  )
  const [selectedDocumentations, setSelectedDocumentations] = useState<string[]>(() =>
    ticket.documentations.map(d => d.id)
  )

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          ...form,
          startDate: form.startDate || undefined,
          estimatedEnd: form.estimatedEnd || undefined,
          actualEnd: form.actualEnd || undefined,
          subcontractor: form.subcontractor || undefined,
          popZone: selectedPopZones.join(', '),
          issueTopic: selectedIssueTopics.join(', ') || undefined,
          solutionTopic: selectedSolutionTopics.join(', ') || undefined,
          documentationIds: selectedDocumentations,
        }

        const isDone = form.status === 'DONE' || form.status === 'DONE_BY_L2'
        const isOnHold = form.status === 'ON_HOLD'
        if (isDone && !body.issueTopic) { setError('Issue Topic is required when status is Done.'); return }
        if (isDone && !body.actualEnd) { setError('Actual End date is required when status is Done.'); return }
        if (isDone && (!body.documentationStatus || body.documentationStatus === 'UNKNOWN')) { setError('Documentation Status is required when status is Done.'); return }
        if (isOnHold && !form.description?.trim()) { setError('Description is required to justify why the ticket is On Hold.'); return }
        const res = await fetch(`/api/tickets/${ticket.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Failed to update ticket')
          return
        }
        setOpen(false)
        router.refresh()
      } catch {
        setError('Network error')
      }
    })
  }

  const popZoneOpts = popZones.map(z => ({ value: z, label: z }))
  const issueTopicOpts = issueTopics.map(t => ({ value: t, label: t }))
  const solutionTopicOpts = solutionTopics.map(t => ({ value: t, label: t }))
  const documentationOpts = documentations.map(d => ({ value: d.id, label: d.title + (d.section ? ` — ${d.section}` : '') }))

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 18px',
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
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            overflowY: 'auto',
            padding: '32px 16px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '720px',
              padding: '28px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
                Edit Ticket — {ticket.ticketNumber}
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '4px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <FormField label="Ticket Number">
                  <input style={inputStyle} value={form.ticketNumber} onChange={e => set('ticketNumber', e.target.value)} required />
                </FormField>
                <FormField label="Engineer">
                  <select style={inputStyle} value={form.engineerId} onChange={e => set('engineerId', e.target.value)}>
                    {engineers.map(eng => <option key={eng.id} value={eng.id}>{eng.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Start Date">
                  <input type="date" style={inputStyle} value={form.startDate} onChange={e => set('startDate', e.target.value)} required />
                </FormField>
                <FormField label="Estimated End">
                  <input type="date" style={inputStyle} value={form.estimatedEnd} onChange={e => set('estimatedEnd', e.target.value)} />
                </FormField>
                <FormField label={(form.status === 'DONE' || form.status === 'DONE_BY_L2') ? 'Actual End *' : 'Actual End'}>
                  <input type="date" style={inputStyle} value={form.actualEnd} onChange={e => set('actualEnd', e.target.value)} />
                  {(form.status === 'DONE' || form.status === 'DONE_BY_L2') && !form.actualEnd && (
                    <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>Required when status is Done</p>
                  )}
                </FormField>
                <FormField label="Status">
                  <select style={inputStyle} value={form.status} onChange={e => {
                    const s = e.target.value
                    set('status', s)
                    if ((s === 'DONE' || s === 'DONE_BY_L2') && !form.actualEnd) {
                      set('actualEnd', new Date().toISOString().split('T')[0])
                    }
                  }}>
                    {['NOT_YET_STARTED','IN_PROGRESS','ON_HOLD','DONE','DONE_BY_L2','ESCALATED_TO_L2'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Urgency">
                  <select style={inputStyle} value={form.urgency} onChange={e => set('urgency', e.target.value)}>
                    {['LOW','MEDIUM','HIGH'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Category">
                  <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
                    {['CATEGORY_1','CATEGORY_2','CATEGORY_3'].map(c => (
                      <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Issue Type">
                  <select style={inputStyle} value={form.issueType} onChange={e => set('issueType', e.target.value)}>
                    {['MARLIN_ISSUE','COMSOF_ISSUE'].map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="POP Zone">
                  <SearchableMultiSelect
                    value={selectedPopZones}
                    onChange={setSelectedPopZones}
                    options={popZoneOpts}
                    placeholder="Select zones…"
                  />
                </FormField>
                <FormField label="Design Partner">
                  <select style={inputStyle} value={form.designPartner} onChange={e => set('designPartner', e.target.value)} required>
                    <option value="" disabled>Select partner…</option>
                    {partners.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </FormField>
                <FormField label="Subcontractor">
                  <select style={inputStyle} value={form.subcontractor} onChange={e => set('subcontractor', e.target.value)}>
                    <option value="">None</option>
                    {partners.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </FormField>
                <FormField label="Can User Solve">
                  <select style={inputStyle} value={form.canUserSolve} onChange={e => set('canUserSolve', e.target.value)}>
                    {['YES','NO'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label={(form.status === 'DONE' || form.status === 'DONE_BY_L2') ? 'Documentation Status *' : 'Documentation Status'}>
                  <select style={inputStyle} value={form.documentationStatus} onChange={e => set('documentationStatus', e.target.value)}>
                    {['ALREADY_EXISTS','NOT_NEEDED','WILL_CREATE','CREATED'].map(v => (
                      <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label={(form.status === 'DONE' || form.status === 'DONE_BY_L2') ? 'Issue Topic *' : 'Issue Topic'}>
                  <SearchableMultiSelect
                    value={selectedIssueTopics}
                    onChange={setSelectedIssueTopics}
                    options={issueTopicOpts}
                    placeholder="Select issue topics…"
                  />
                </FormField>
                <FormField label="Solution Topic">
                  <SearchableMultiSelect
                    value={selectedSolutionTopics}
                    onChange={setSelectedSolutionTopics}
                    options={solutionTopicOpts}
                    placeholder="Select solution topics…"
                  />
                </FormField>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <FormField label="Documentation (Knowledge Base)">
                  <SearchableMultiSelect
                    value={selectedDocumentations}
                    onChange={setSelectedDocumentations}
                    options={documentationOpts}
                    placeholder="Select documentation links…"
                  />
                </FormField>
              </div>

              <FormField label={form.status === 'ON_HOLD' ? 'Description *' : 'Description'}>
                <textarea
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  value={form.description}
                  placeholder={form.status === 'ON_HOLD' ? 'Required: explain why this ticket is on hold…' : ''}
                  onChange={e => set('description', e.target.value)}
                />
                {form.status === 'ON_HOLD' && !form.description?.trim() && (
                  <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>Required to justify why the ticket is On Hold</p>
                )}
                {form.status === 'ESCALATED_TO_L2' && !form.description?.includes('atlassian.net') && (
                  <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                    A Jira link (atlassian.net) is required when escalating to L2.
                  </p>
                )}
              </FormField>

              {/* Boolean flags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '20px' }}>
                {[
                  { field: 'isValidTicket', label: 'Valid Ticket' },
                  { field: 'isOutlier', label: 'Outlier' },
                ].map(({ field, label }) => (
                  <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--foreground)' }}>
                    <input
                      type="checkbox"
                      checked={form[field as keyof typeof form] as boolean}
                      onChange={e => set(field, e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                    />
                    {label}
                  </label>
                ))}
              </div>

              {error && (
                <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--foreground)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    opacity: isPending ? 0.7 : 1,
                  }}
                >
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
