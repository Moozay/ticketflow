import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { formatDate } from '@/lib/utils'
import SolutionActions from './SolutionActions'
import AddSolutionForm from './AddSolutionForm'

export default async function KnowledgeBasePage() {
  const session = await auth()
  const userId = (session?.user as any)?.id

  const solutions = await prisma.solution.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { tickets: true } },
    },
  })

  return (
    <div style={{ padding: '32px', maxWidth: '960px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Knowledge Base</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            {solutions.length} solution{solutions.length !== 1 ? 's' : ''} documented
          </p>
        </div>
        <AddSolutionForm />
      </div>

      {solutions.length === 0 && (
        <div style={{
          padding: '64px 24px',
          textAlign: 'center',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          color: 'var(--muted-foreground)',
          fontSize: '15px',
        }}>
          No solutions yet. Add one to get started.
        </div>
      )}

      {/* Solutions table */}
      {solutions.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                {['Title', 'Category', 'Description', 'Author', 'Used in', 'Created', 'Actions'].map(h => (
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
              {solutions.map((sol, i) => (
                <tr key={sol.id} style={{ borderBottom: i < solutions.length - 1 ? '1px solid var(--border)' : undefined }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--foreground)', maxWidth: '220px' }}>
                    {sol.title}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {sol.category ? (
                      <span style={{
                        display: 'inline-flex',
                        padding: '2px 8px',
                        borderRadius: '5px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: 'var(--accent-bg, var(--muted))',
                        color: 'var(--accent-fg, var(--muted-foreground))',
                      }}>
                        {sol.category}
                      </span>
                    ) : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--muted-foreground)', maxWidth: '280px' }}>
                    {sol.description
                      ? <span title={sol.description}>{sol.description.length > 80 ? sol.description.substring(0, 80) + '…' : sol.description}</span>
                      : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                    {sol.createdBy.name}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--muted-foreground)', textAlign: 'right' }}>
                    {sol._count.tickets}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                    {formatDate(sol.createdAt)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <SolutionActions solution={sol as any} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
