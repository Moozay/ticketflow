import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import AddDocLinkForm from './AddDocLinkForm'

type DocRecord = {
  id: string
  title: string
  url: string
  section: string | null
  description: string | null
  order: number
  createdAt: Date
}

function groupBySection(docs: DocRecord[]): Record<string, DocRecord[]> {
  const groups: Record<string, DocRecord[]> = {}
  for (const doc of docs) {
    const key = doc.section ?? 'General'
    if (!groups[key]) groups[key] = []
    groups[key].push(doc)
  }
  return groups
}

const SECTION_COLORS: Record<string, { bg: string; color: string }> = {
  General:     { bg: '#eff6ff', color: '#2563eb' },
  Marlin:      { bg: '#fef3c7', color: '#d97706' },
  Comsof:      { bg: '#f0fdf4', color: '#16a34a' },
  Internal:    { bg: '#f5f3ff', color: '#7c3aed' },
  External:    { bg: '#fef2f2', color: '#dc2626' },
}

function sectionBadge(section: string) {
  const style = SECTION_COLORS[section] ?? { bg: 'var(--muted)', color: 'var(--muted-foreground)' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '5px',
      fontSize: '11px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      background: style.bg,
      color: style.color,
    }}>
      {section}
    </span>
  )
}

export default async function DocumentationPage() {
  const session = await auth()
  const role = (session?.user as any)?.role

  const docs = await prisma.documentation.findMany({
    orderBy: [{ section: 'asc' }, { order: 'asc' }],
  })

  const grouped = groupBySection(docs as DocRecord[])
  const sections = Object.keys(grouped).sort()

  return (
    <div style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
            Documentation
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            {docs.length} link{docs.length !== 1 ? 's' : ''} across {sections.length} section{sections.length !== 1 ? 's' : ''}
          </p>
        </div>

        {(role === 'ADMIN' || role === 'ENGINEER') && <AddDocLinkForm />}
      </div>

      {docs.length === 0 && (
        <div style={{
          padding: '64px 24px',
          textAlign: 'center',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          color: 'var(--muted-foreground)',
          fontSize: '15px',
        }}>
          No documentation links yet.
          {role === 'ADMIN' && ' Use "Add link" to get started.'}
        </div>
      )}

      {/* Sections */}
      {sections.map(section => (
        <div key={section} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
              {section}
            </h2>
            {sectionBadge(section)}
            <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {grouped[section].length} link{grouped[section].length !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {grouped[section].map(doc => (
              <div
                key={doc.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {sectionBadge(section)}
                    <p style={{ fontWeight: 600, fontSize: '15px', color: 'var(--foreground)', margin: '6px 0 0', lineHeight: 1.4 }}>
                      {doc.title}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {(role === 'ADMIN' || role === 'ENGINEER') && (
                      <AddDocLinkForm
                        doc={doc}
                        trigger={
                          <span
                            title="Edit"
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: 'var(--muted)', color: 'var(--muted-foreground)',
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </span>
                        }
                      />
                    )}
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open link"
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'var(--accent-bg, var(--muted))', color: 'var(--accent-fg, var(--primary))',
                        textDecoration: 'none',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                </div>

                {doc.description && (
                  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: 1.6, margin: 0 }}>
                    {doc.description}
                  </p>
                )}

                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {doc.url}
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
