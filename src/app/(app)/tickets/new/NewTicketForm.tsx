'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  defaultTicketNumber: string
  engineerId: string
  documentations: { id: string; title: string; section: string | null }[]
  partners: string[]
  popZones: string[]
  issueTopics: string[]
  solutionTopics: string[]
  engineers: { id: string; name: string; engineerPrefix: number | null }[]
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
        {label}{required && <span style={{ color: 'var(--destructive)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
  borderRadius: '0.5rem',
  padding: '0.5rem 0.75rem',
  fontSize: '0.875rem',
  width: '100%',
  outline: 'none',
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={inputStyle}
      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} style={{ ...inputStyle, cursor: 'pointer' }}
      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
  )
}

function MultiSelect({
  name,
  options,
  placeholder = 'Select…',
  initialValues = [],
}: {
  name: string
  options: { value: string; label: string }[]
  placeholder?: string
  initialValues?: string[]
}) {
  const [selected, setSelected] = useState<string[]>(initialValues)
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
    setSelected(s => s.includes(val) ? s.filter(x => x !== val) : [...s, val])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLabels = options.filter(o => selected.includes(o.value)).map(o => o.label)
  const displayText = selectedLabels.length === 0
    ? placeholder
    : selectedLabels.length <= 2
      ? selectedLabels.join(', ')
      : `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2}`

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input type="hidden" name={name} value={selected.join(', ')} />
      <button
        type="button"
        onClick={() => { setOpen(o => !o); if (!open) setSearch('') }}
        style={{ ...inputStyle, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <span style={{
          color: selected.length > 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
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
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem',
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
                  cursor: 'pointer', fontSize: '0.875rem', color: 'var(--foreground)',
                  background: selected.includes(opt.value) ? 'var(--accent-bg)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!selected.includes(opt.value))
                    (e.currentTarget as HTMLElement).style.background = 'var(--muted)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background =
                    selected.includes(opt.value) ? 'var(--accent-bg)' : 'transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  style={{ accentColor: 'var(--primary)', width: '14px', height: '14px', flexShrink: 0 }}
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

export default function NewTicketForm({ defaultTicketNumber, engineerId, documentations, partners, popZones, issueTopics, solutionTopics, engineers }: Props) {
  const router = useRouter()
  const [ticketNumber, setTicketNumber] = useState(defaultTicketNumber)
  const [editingId, setEditingId] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fetchingNumber, setFetchingNumber] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('NOT_YET_STARTED')

  async function handleEngineerChange(id: string) {
    setFetchingNumber(true)
    try {
      const res = await fetch(`/api/tickets/next-number?engineerId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setTicketNumber(data.ticketNumber)
      }
    } finally {
      setFetchingNumber(false)
    }
  }
  const [savedTicket, setSavedTicket] = useState<{ id: string; number: string; engineerName: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const [estimatedEnd, setEstimatedEnd] = useState(() => {
    // Default to 3 working days from today
    const d = new Date()
    let added = 0
    while (added < 3) {
      d.setDate(d.getDate() + 1)
      const day = d.getDay()
      if (day !== 0 && day !== 6) added++
    }
    return d.toISOString().split('T')[0]
  })

  function addWorkingDays(dateStr: string, days: number): string {
    const d = new Date(dateStr)
    let added = 0
    while (added < days) {
      d.setDate(d.getDate() + 1)
      const day = d.getDay()
      if (day !== 0 && day !== 6) added++
    }
    return d.toISOString().split('T')[0]
  }

  function handleStartDateChange(value: string) {
    if (value) setEstimatedEnd(addWorkingDays(value, 3))
    else setEstimatedEnd('')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const body = Object.fromEntries(fd.entries())
    body.ticketNumber = ticketNumber

    const isDone = body.status === 'DONE' || body.status === 'DONE_BY_L2'
    const isOnHold = body.status === 'ON_HOLD'

    if (isDone && !body.issueTopic) { setError('Issue Topic is required when status is Done.'); return }
    if (isDone && !body.actualEnd) { setError('Actual End date is required when status is Done.'); return }
    if (isDone && (!body.documentationStatus || body.documentationStatus === 'UNKNOWN')) { setError('Documentation Status is required when status is Done.'); return }
    if (isOnHold && !(body.description as string)?.trim()) { setError('Description is required to justify why the ticket is On Hold.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed') }
      const ticket = await res.json()
      const engineer = engineers.find(eng => eng.id === (body.engineerId as string))
      setSavedTicket({ id: ticket.id, number: ticket.ticketNumber, engineerName: engineer?.name ?? 'LLD Support' })
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  function getEmailText(ticketNum: string, engineerName: string) {
    return `Hello,

Thank you for contacting LLD Support.

We have received your issue report and will begin processing it as soon as possible.

Ticket Number: ${ticketNum} (Please include this in any future correspondence regarding this issue)
Response Time: Our team aims to respond within 3 business days.
Next Steps: Please do not send additional emails unless you have new relevant information. We will contact you if further details are required.

If there are critical updates or you need to escalate the issue, reply with "[URGENT]" in the subject line, and our team will prioritize your request accordingly.

Best regards,
${engineerName}

LLD Support Team`
  }

  async function handleCopy() {
    if (!savedTicket) return
    const text = getEmailText(savedTicket.number, savedTicket.engineerName)
    try {
      // Works on HTTPS / localhost
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback for HTTP on local network
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const popZoneOpts = popZones.map(z => ({ value: z, label: z }))
  const issueTopicOpts = issueTopics.map(t => ({ value: t, label: t }))
  const solutionTopicOpts = solutionTopics.map(t => ({ value: t, label: t }))
  const documentationOpts = documentations.map(d => ({ value: d.id, label: d.title + (d.section ? ` — ${d.section}` : '') }))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>New Ticket</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Fill in the details to log a new support ticket</p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: 'var(--destructive)', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 01 — Basic info */}
        <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent-fg)' }}>01</span>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Basic info</h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Who, when, and what kind</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Ticket ID" required>
              <div className="flex gap-2">
                {editingId ? (
                  <Input value={ticketNumber} onChange={e => setTicketNumber(e.target.value)} autoFocus />
                ) : (
                  <div className="flex-1 px-3 py-2 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                    {ticketNumber}
                  </div>
                )}
                <button type="button" onClick={() => setEditingId(!editingId)}
                  className="px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5"
                  style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  {editingId ? 'Done' : 'Edit ID'}
                </button>
              </div>
            </Field>

            <Field label="Start Date" required>
              <Input type="date" name="startDate" defaultValue={today} required
                onChange={e => handleStartDateChange(e.target.value)} />
            </Field>

            <Field label="Engineer" required>
              <select name="engineerId" defaultValue={engineerId} required
                style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', width: '100%', outline: 'none', cursor: 'pointer', opacity: fetchingNumber ? 0.6 : 1 }}
                onChange={e => handleEngineerChange(e.target.value)}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}>
                {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </Field>

            <Field label="Category" required>
              <Select name="category" defaultValue="CATEGORY_1" required>
                <option value="CATEGORY_1">Category 1</option>
                <option value="CATEGORY_2">Category 2</option>
                <option value="CATEGORY_3">Category 3</option>
              </Select>
            </Field>

            <Field label="Issue Type" required>
              <Select name="issueType" defaultValue="MARLIN_ISSUE" required>
                <option value="MARLIN_ISSUE">Marlin issue</option>
                <option value="COMSOF_ISSUE">Comsof issue</option>
              </Select>
            </Field>

            <Field label="Urgency">
              <Select name="urgency" defaultValue="LOW">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
            </Field>

            <Field label="Status" required>
              <Select name="status" defaultValue="NOT_YET_STARTED" required
                onChange={e => setSelectedStatus((e as any).target.value)}>
                <option value="NOT_YET_STARTED">Not yet started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="ON_HOLD">On hold</option>
                <option value="DONE">Done</option>
                <option value="DONE_BY_L2">Done by L2</option>
                <option value="ESCALATED_TO_L2">Escalated to L2</option>
              </Select>
            </Field>

            <Field label="Estimated End">
              <Input type="date" name="estimatedEnd" value={estimatedEnd}
                onChange={e => setEstimatedEnd((e as any).target.value)} />
            </Field>

            <Field label={`Actual End${(selectedStatus === 'DONE' || selectedStatus === 'DONE_BY_L2') ? ' *' : ''}`}>
              <Input type="date" name="actualEnd" />
              {(selectedStatus === 'DONE' || selectedStatus === 'DONE_BY_L2') && (
                <p style={{ fontSize: '11px', color: 'var(--destructive)', marginTop: '3px' }}>Required when status is Done</p>
              )}
            </Field>
          </div>
        </div>

        {/* Section 02 — Location & Partners */}
        <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent-fg)' }}>02</span>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Location & Partners</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="POP Zone" required>
              <MultiSelect name="popZone" options={popZoneOpts} placeholder="Select zones…" />
            </Field>
            <Field label="Design Partner" required>
              <Select name="designPartner" required defaultValue="">
                <option value="" disabled>Select partner…</option>
                {partners.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Subcontractor">
              <Select name="subcontractor" defaultValue="">
                <option value="">None</option>
                {partners.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
          </div>
        </div>

        {/* Section 03 — Issue & Solution */}
        <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent-fg)' }}>03</span>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Issue & Solution</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label={`Issue Topic${(selectedStatus === 'DONE' || selectedStatus === 'DONE_BY_L2') ? ' *' : ''}`}>
              <MultiSelect name="issueTopic" options={issueTopicOpts} placeholder="Select issue topics…" />
              {(selectedStatus === 'DONE' || selectedStatus === 'DONE_BY_L2') && (
                <p style={{ fontSize: '11px', color: 'var(--destructive)', marginTop: '3px' }}>Required when status is Done</p>
              )}
            </Field>

            <Field label="Solution Topic">
              <MultiSelect name="solutionTopic" options={solutionTopicOpts} placeholder="Select solution topics…" />
            </Field>

            <div className="col-span-2">
              <Field label="Description" required>
                <Textarea name="description" required placeholder={selectedStatus === 'ON_HOLD' ? 'Required: explain why this ticket is on hold…' : 'Describe the issue in detail…'} />
                {selectedStatus === 'ON_HOLD' && (
                  <p style={{ fontSize: '11px', color: 'var(--destructive)', marginTop: '3px' }}>Required to justify why the ticket is On Hold</p>
                )}
              </Field>
            </div>

            <Field label="Can user solve it?">
              <Select name="canUserSolve" defaultValue="NO">
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </Select>
            </Field>

            <Field label={`Documentation${(selectedStatus === 'DONE' || selectedStatus === 'DONE_BY_L2') ? ' *' : ''}`}>
              <Select name="documentationStatus" defaultValue="ALREADY_EXISTS">
                <option value="ALREADY_EXISTS">Already exists</option>
                <option value="NOT_NEEDED">Not needed</option>
                <option value="WILL_CREATE">Will create</option>
                <option value="CREATED">Created</option>
              </Select>
            </Field>

            <div className="col-span-2">
              <Field label="Documentation (Knowledge Base)">
                <MultiSelect name="documentationIds" options={documentationOpts} placeholder="Select documentation links…" />
              </Field>
            </div>

          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ background: loading ? 'var(--border)' : 'var(--primary)', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving…' : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Save ticket
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success modal — copy email */}
      {savedTicket && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}
        >
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px 32px', maxWidth: '560px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Ticket saved — {savedTicket.number}</h2>
                <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '2px' }}>Copy the confirmation email below to send to the user.</p>
              </div>
            </div>

            <pre style={{
              background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '8px',
              padding: '14px 16px', fontSize: '12.5px', lineHeight: 1.7, color: 'var(--foreground)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '280px', overflowY: 'auto',
              fontFamily: 'inherit', margin: '0 0 16px',
            }}>
              {getEmailText(savedTicket.number, savedTicket.engineerName)}
            </pre>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => router.push(`/tickets/${savedTicket.id}`)}
                style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--foreground)', cursor: 'pointer' }}
              >
                Go to ticket
              </button>
              <button
                onClick={handleCopy}
                style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: copied ? '#16a34a' : 'var(--primary)', border: 'none', color: '#fff', cursor: 'pointer', minWidth: '120px' }}
              >
                {copied ? '✓ Copied!' : 'Copy email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
