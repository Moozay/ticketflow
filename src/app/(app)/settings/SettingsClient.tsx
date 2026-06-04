'use client'

import { useState } from 'react'

type Tab = 'issues' | 'popzones' | 'partners' | 'solutions' | 'documentation'

interface NameItem { id: string; name: string }
interface IssueTopic { id: string; name: string; description: string | null }
interface SolutionTopic { id: string; name: string; description: string | null }
interface Solution { id: string; title: string; description: string | null; category: string | null; createdBy: { name: string }; _count: { tickets: number } }
interface DocLink { id: string; title: string; url: string; section: string | null; description: string | null; order: number }

interface Props {
  issueTopics: IssueTopic[]
  popZones: NameItem[]
  partners: NameItem[]
  solutionTopics: SolutionTopic[]
  solutions: Solution[]
  docLinks: DocLink[]
}

const card: React.CSSProperties = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }
const inputStyle: React.CSSProperties = {
  background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--foreground)',
  borderRadius: '0.5rem', padding: '0.4rem 0.75rem', fontSize: '0.875rem', outline: 'none', width: '100%',
}
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
const btnPrimary: React.CSSProperties = {
  background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem',
  padding: '0.4rem 1rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
}
const btnGhost: React.CSSProperties = {
  background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted-foreground)',
  borderRadius: '0.5rem', padding: '0.3rem 0.7rem', fontSize: '0.8rem', cursor: 'pointer',
}
const btnDanger: React.CSSProperties = { ...btnGhost, color: '#ef4444', borderColor: '#fecaca' }

// ── Simple list (Issues / Pop Zones) ────────────────────────────────────────
function SimpleList({ items: init, apiBase }: { items: NameItem[]; apiBase: string }) {
  const [items, setItems] = useState(init)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  async function add() {
    if (!newName.trim()) return
    setAdding(true)
    const res = await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }) })
    if (res.ok) { const item = await res.json(); setItems(s => [...s, item].sort((a, b) => a.name.localeCompare(b.name))) }
    setNewName(''); setAdding(false)
  }

  async function save(id: string) {
    const res = await fetch(`${apiBase}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim() }) })
    if (res.ok) { const item = await res.json(); setItems(s => s.map(x => x.id === id ? item : x).sort((a, b) => a.name.localeCompare(b.name))) }
    setEditId(null)
  }

  async function remove(id: string) {
    if (!confirm('Delete this item?')) return
    const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(s => s.filter(x => x.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Add row */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Add new…"
          style={{ ...inputStyle, flex: 1 }}
          onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        <button onClick={add} disabled={adding || !newName.trim()} style={{ ...btnPrimary, opacity: adding || !newName.trim() ? 0.5 : 1 }}>
          Add
        </button>
      </div>

      {/* List */}
      <div style={card}>
        {items.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>
            No items yet. Add one above.
          </div>
        )}
        {items.map((item, i) => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px',
            borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            {editId === item.id ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && save(item.id)}
                  autoFocus
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
                <button onClick={() => save(item.id)} style={btnPrimary}>Save</button>
                <button onClick={() => setEditId(null)} style={btnGhost}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: '14px', color: 'var(--foreground)' }}>{item.name}</span>
                <button onClick={() => { setEditId(item.id); setEditName(item.name) }} style={btnGhost}>Edit</button>
                <button onClick={() => remove(item.id)} style={btnDanger}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Issue Topics list ────────────────────────────────────────────────────────
function IssueTopicList({ items: init }: { items: IssueTopic[] }) {
  const [items, setItems] = useState(init)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function add() {
    if (!newName.trim()) return
    setAdding(true)
    const res = await fetch('/api/settings/issues', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
    })
    if (res.ok) { const item = await res.json(); setItems(s => [...s, item].sort((a, b) => a.name.localeCompare(b.name))) }
    setNewName(''); setNewDesc(''); setAdding(false)
  }

  async function save(id: string) {
    const res = await fetch(`/api/settings/issues/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
    })
    if (res.ok) { const item = await res.json(); setItems(s => s.map(x => x.id === id ? item : x).sort((a, b) => a.name.localeCompare(b.name))) }
    setEditId(null)
  }

  async function remove(id: string) {
    if (!confirm('Delete this issue topic?')) return
    const res = await fetch(`/api/settings/issues/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(s => s.filter(x => x.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Add form */}
      <div style={{ ...card, padding: '16px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add issue topic</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Topic name…" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
            placeholder="What original issues were combined into this class? (optional)"
            style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={add} disabled={adding || !newName.trim()} style={{ ...btnPrimary, opacity: adding || !newName.trim() ? 0.5 : 1 }}>
              Add topic
            </button>
          </div>
        </div>
      </div>

      {/* Topics list */}
      <div style={card}>
        {items.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>
            No issue topics yet.
          </div>
        )}
        {items.map((item, i) => {
          const isExpanded = expanded === item.id
          return (
            <div key={item.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
              {editId === item.id ? (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
                    placeholder="What original issues were combined into this class?"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => save(item.id)} style={btnPrimary}>Save</button>
                    <button onClick={() => setEditId(null)} style={btnGhost}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', cursor: item.description ? 'pointer' : 'default' }}
                    onClick={() => item.description && setExpanded(isExpanded ? null : item.id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{item.name}</span>
                        {item.description && (
                          <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: 'var(--accent-bg)', color: 'var(--accent-fg)', fontWeight: 600 }}>
                            has definition
                          </span>
                        )}
                      </div>
                      {!isExpanded && item.description && (
                        <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                          {item.description.length > 100 ? item.description.substring(0, 100) + '…' : item.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditId(item.id); setEditName(item.name); setEditDesc(item.description ?? '') }} style={btnGhost}>Edit</button>
                      <button onClick={() => remove(item.id)} style={btnDanger}>Delete</button>
                    </div>
                    {item.description && (
                      <svg
                        style={{ flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'var(--muted-foreground)' }}
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </div>
                  {isExpanded && item.description && (
                    <div style={{ padding: '0 16px 14px 28px' }}>
                      <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'var(--muted)', borderLeft: '3px solid var(--primary)' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)', marginBottom: '6px' }}>
                          Included in this class
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--foreground)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Solution Topics list ─────────────────────────────────────────────────────
function SolutionTopicList({ items: init, solutions: initSols }: { items: SolutionTopic[]; solutions: Solution[] }) {
  const [items, setItems] = useState(init)
  const [solutions] = useState(initSols)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function add() {
    if (!newName.trim()) return
    setAdding(true)
    const res = await fetch('/api/settings/solutiontopics', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
    })
    if (res.ok) { const item = await res.json(); setItems(s => [...s, item].sort((a, b) => a.name.localeCompare(b.name))) }
    setNewName(''); setNewDesc(''); setAdding(false)
  }

  async function save(id: string) {
    const res = await fetch(`/api/settings/solutiontopics/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
    })
    if (res.ok) { const item = await res.json(); setItems(s => s.map(x => x.id === id ? item : x).sort((a, b) => a.name.localeCompare(b.name))) }
    setEditId(null)
  }

  async function remove(id: string) {
    if (!confirm('Delete this topic?')) return
    const res = await fetch(`/api/settings/solutiontopics/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(s => s.filter(x => x.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Add form */}
      <div style={{ ...card, padding: '16px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add solution topic</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Topic name…" style={inputStyle}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)…"
            style={{ ...inputStyle, resize: 'vertical', minHeight: '64px' }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={add} disabled={adding || !newName.trim()} style={{ ...btnPrimary, opacity: adding || !newName.trim() ? 0.5 : 1 }}>
              Add topic
            </button>
          </div>
        </div>
      </div>

      {/* Topics with their solutions */}
      <div style={card}>
        {items.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>
            No solution topics yet.
          </div>
        )}
        {items.map((item, i) => {
          const relatedSols = solutions.filter(s => s.category === item.name)
          const isExpanded = expanded === item.id
          return (
            <div key={item.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
              {editId === item.id ? (
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '64px' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => save(item.id)} style={btnPrimary}>Save</button>
                    <button onClick={() => setEditId(null)} style={btnGhost}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}
                    onClick={() => setExpanded(isExpanded ? null : item.id)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{item.name}</span>
                        {relatedSols.length > 0 && (
                          <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: 'var(--accent-bg)', color: 'var(--accent-fg)', fontWeight: 600 }}>
                            {relatedSols.length}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>{item.description}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditId(item.id); setEditName(item.name); setEditDesc(item.description ?? '') }} style={btnGhost}>Edit</button>
                      <button onClick={() => remove(item.id)} style={btnDanger}>Delete</button>
                    </div>
                    <svg style={{ flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'var(--muted-foreground)' }}
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  {isExpanded && relatedSols.length > 0 && (
                    <div style={{ padding: '0 16px 12px 28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {relatedSols.map(sol => (
                        <div key={sol.id} style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{sol.title}</span>
                            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>Used in {sol._count.tickets} tickets</span>
                          </div>
                          {sol.description && (
                            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                              {sol.description.length > 120 ? sol.description.substring(0, 120) + '…' : sol.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {isExpanded && relatedSols.length === 0 && (
                    <div style={{ padding: '4px 28px 12px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      No KB solutions linked to this topic yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Documentation links list ──────────────────────────────────────────────────
const DOC_SECTIONS = ['General', 'Marlin', 'Comsof', 'Internal', 'External']

function DocLinkList({ items: init }: { items: DocLink[] }) {
  const [items, setItems] = useState(init)
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ title: '', url: '', section: '', description: '', order: '0' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', url: '', section: '', description: '', order: '0' })
  const [addError, setAddError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function setNew(f: string, v: string) { setNewForm(p => ({ ...p, [f]: v })) }
  function setEd(f: string, v: string) { setEditForm(p => ({ ...p, [f]: v })) }

  async function addLink() {
    if (!newForm.title.trim() || !newForm.url.trim()) return
    setSaving(true); setAddError(null)
    try {
      const res = await fetch('/api/documentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newForm.title.trim(), url: newForm.url.trim(),
          section: newForm.section.trim() || null,
          description: newForm.description.trim() || null,
          order: parseInt(newForm.order) || 0,
        }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setAddError(d.error ?? 'Failed to add') }
      else { const item = await res.json(); setItems(s => [...s, item]); setNewForm({ title: '', url: '', section: '', description: '', order: '0' }); setAdding(false) }
    } catch { setAddError('Network error') }
    setSaving(false)
  }

  async function saveLink(id: string) {
    setSaving(true); setEditError(null)
    try {
      const res = await fetch(`/api/documentation/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(), url: editForm.url.trim(),
          section: editForm.section.trim() || null,
          description: editForm.description.trim() || null,
          order: parseInt(editForm.order) || 0,
        }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setEditError(d.error ?? 'Failed to save') }
      else { const item = await res.json(); setItems(s => s.map(x => x.id === id ? item : x)); setEditId(null) }
    } catch { setEditError('Network error') }
    setSaving(false)
  }

  async function removeLink(id: string) {
    if (!confirm('Delete this documentation link?')) return
    const res = await fetch(`/api/documentation/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(s => s.filter(x => x.id !== id))
  }

  const sectionInput = (val: string, onChange: (v: string) => void, id: string) => (
    <>
      <input list={id} value={val} onChange={e => onChange(e.target.value)} placeholder="Section (optional)"
        style={inputStyle}
        onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
      <datalist id={id}>
        {DOC_SECTIONS.map(s => <option key={s} value={s} />)}
      </datalist>
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Add form */}
      {adding ? (
        <div style={{ ...card, padding: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add documentation link</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input value={newForm.title} onChange={e => setNew('title', e.target.value)} placeholder="Title *"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            <input type="url" value={newForm.url} onChange={e => setNew('url', e.target.value)} placeholder="URL * (https://…)"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>{sectionInput(newForm.section, v => setNew('section', v), 'new-sections')}</div>
              <input type="number" min="0" value={newForm.order} onChange={e => setNew('order', e.target.value)}
                placeholder="Order" style={{ ...inputStyle, width: '80px' }}
                onFocus={e => (e.target.style.borderColor = 'var(--primary)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            </div>
            <textarea value={newForm.description} onChange={e => setNew('description', e.target.value)}
              placeholder="Description (optional)…" style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
              onFocus={e => (e.target.style.borderColor = 'var(--primary)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
            {addError && <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', fontSize: '13px' }}>{addError}</div>}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setAdding(false); setAddError(null) }} style={btnGhost}>Cancel</button>
              <button onClick={addLink} disabled={saving || !newForm.title.trim() || !newForm.url.trim()}
                style={{ ...btnPrimary, opacity: saving || !newForm.title.trim() || !newForm.url.trim() ? 0.5 : 1 }}>
                {saving ? 'Adding…' : 'Add link'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <button onClick={() => setAdding(true)} style={btnPrimary}>+ Add link</button>
        </div>
      )}

      {/* List */}
      <div style={card}>
        {items.length === 0 && (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>
            No documentation links yet. Add one above.
          </div>
        )}
        {items.map((item, i) => (
          <div key={item.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
            {editId === item.id ? (
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input value={editForm.title} onChange={e => setEd('title', e.target.value)} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                <input type="url" value={editForm.url} onChange={e => setEd('url', e.target.value)} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>{sectionInput(editForm.section, v => setEd('section', v), 'edit-sections')}</div>
                  <input type="number" min="0" value={editForm.order} onChange={e => setEd('order', e.target.value)}
                    placeholder="Order" style={{ ...inputStyle, width: '80px' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--primary)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                </div>
                <textarea value={editForm.description} onChange={e => setEd('description', e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '60px' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--primary)')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
                {editError && <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', fontSize: '13px' }}>{editError}</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => saveLink(item.id)} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.5 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
                  <button onClick={() => { setEditId(null); setEditError(null) }} style={btnGhost}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{item.title}</span>
                    {item.section && (
                      <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: 'var(--accent-bg)', color: 'var(--accent-fg)', fontWeight: 600 }}>
                        {item.section}
                      </span>
                    )}
                  </div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {item.url}
                  </a>
                  {item.description && (
                    <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px', margin: '2px 0 0' }}>
                      {item.description.length > 120 ? item.description.substring(0, 120) + '…' : item.description}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => {
                    setEditId(item.id)
                    setEditForm({ title: item.title, url: item.url, section: item.section ?? '', description: item.description ?? '', order: String(item.order) })
                    setEditError(null)
                  }} style={btnGhost}>Edit</button>
                  <button onClick={() => removeLink(item.id)} style={btnDanger}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Settings Client ─────────────────────────────────────────────────────
export default function SettingsClient({ issueTopics, popZones, partners, solutionTopics, solutions, docLinks }: Props) {
  const [tab, setTab] = useState<Tab>('issues')

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'issues', label: 'Issues', count: issueTopics.length },
    { id: 'popzones', label: 'Pop Zones', count: popZones.length },
    { id: 'partners', label: 'Partners', count: partners.length },
    { id: 'solutions', label: 'Solutions', count: solutionTopics.length },
    { id: 'documentation', label: 'Documentation', count: docLinks.length },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
          Manage issue topics, pop zones, solution topics, and documentation links
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--primary)' : 'var(--muted-foreground)',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {t.label}
            <span style={{
              fontSize: '11px', padding: '1px 6px', borderRadius: '10px',
              background: tab === t.id ? 'var(--accent-bg)' : 'var(--muted)',
              color: tab === t.id ? 'var(--accent-fg)' : 'var(--muted-foreground)',
              fontWeight: 600,
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'issues' && (
        <IssueTopicList items={issueTopics} />
      )}
      {tab === 'popzones' && (
        <SimpleList items={popZones} apiBase="/api/settings/popzones" />
      )}
      {tab === 'partners' && (
        <SimpleList items={partners} apiBase="/api/settings/partners" />
      )}
      {tab === 'solutions' && (
        <SolutionTopicList items={solutionTopics} solutions={solutions} />
      )}
      {tab === 'documentation' && (
        <DocLinkList items={docLinks} />
      )}
    </div>
  )
}
