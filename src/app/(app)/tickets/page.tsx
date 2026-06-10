import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Suspense } from 'react'
import TicketsFilterSaver from './TicketsFilterSaver'
import QuickStatusEdit from './QuickStatusEdit'

const STATUS_STYLES: Record<string, string> = {
  DONE:             'bg-emerald-50 text-emerald-700 ring-emerald-200',
  DONE_BY_L2:       'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ESCALATED_TO_L2:  'bg-amber-50 text-amber-700 ring-amber-200',
  IN_PROGRESS:      'bg-blue-50 text-blue-600 ring-blue-200',
  ON_HOLD:          'bg-slate-100 text-slate-500 ring-transparent',
  NOT_YET_STARTED:  'bg-neutral-100 text-neutral-500 ring-transparent',
}

const URGENCY_STYLES: Record<string, string> = {
  HIGH:          'bg-red-50 text-red-600 ring-red-200',
  MEDIUM:        'bg-amber-50 text-amber-700 ring-amber-200',
  LOW:           'bg-slate-100 text-slate-500 ring-transparent',
  NOT_SPECIFIED: 'bg-neutral-100 text-neutral-500 ring-transparent',
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${className}`}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; partner?: string; urgency?: string; canUserSolve?: string; engineerFilter?: string; issueTopic?: string; subcontractor?: string; partnerUnknown?: string; mine?: string; sort?: string; dir?: string; page?: string }>
}) {
  const params = await searchParams
  const session = await auth()
  const engineerId = (session?.user as any)?.id
  const userRole = (session?.user as any)?.role
  const isAdmin = userRole === 'ADMIN'

  // If engineer and no engineerFilter set, default to their own tickets
  const hasAnyFilter = !!(params.q || params.status || params.partner || params.urgency ||
    params.canUserSolve || params.engineerFilter || params.issueTopic ||
    params.subcontractor || params.partnerUnknown || params.sort)
  // 'all' = explicit "show all engineers"; undefined/absent = default to own for engineers
  const effectiveEngineerId = params.engineerFilter === 'all'
    ? undefined
    : (!isAdmin && !params.engineerFilter)
      ? engineerId
      : params.engineerFilter || undefined

  const page = parseInt(params.page ?? '1')
  const perPage = 30
  const skip = (page - 1) * perPage

  const base = { isValidTicket: true, archivedAt: null }
  const myBase = isAdmin ? base : { ...base, engineerId }
  // When a correction filter is active and user is engineer, scope to their own tickets
  const correctionActive = !!(params.issueTopic || params.canUserSolve || params.partnerUnknown)
  const where: any = { ...base, ...(correctionActive && !isAdmin && params.mine === '1' ? { engineerId } : {}) }
  if (params.q) {
    where.OR = [
      { ticketNumber: { contains: params.q, mode: 'insensitive' } },
      { description: { contains: params.q, mode: 'insensitive' } },
      { designPartner: { contains: params.q, mode: 'insensitive' } },
      { popZone: { contains: params.q, mode: 'insensitive' } },
    ]
  }
  if (params.status) where.status = params.status
  if (params.partner) where.designPartner = params.partner
  if (params.urgency) where.urgency = params.urgency
  if (params.canUserSolve) where.canUserSolve = params.canUserSolve
  if (effectiveEngineerId) where.engineerId = effectiveEngineerId
  if (params.issueTopic) where.issueTopic = { contains: params.issueTopic, mode: 'insensitive' }
  if (params.subcontractor) where.subcontractor = params.subcontractor
  if (params.partnerUnknown) where.OR = [{ designPartner: 'Unknown' }, { subcontractor: 'Unknown' }]

  const [tickets, total, partners, issueTopics, engineers, issueOther, canFixUnknown, partnerUnknown] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: { engineer: { select: { name: true } } },
      orderBy: params.sort === 'ticketNumber'
        ? { ticketNumber: (params.dir === 'asc' ? 'asc' : 'desc') }
        : { startDate: (params.dir === 'asc' ? 'asc' : 'desc') },
      skip,
      take: perPage,
    }),
    prisma.ticket.count({ where }),
    prisma.ticket.groupBy({ by: ['designPartner'], _count: true, orderBy: { _count: { designPartner: 'desc' } }, take: 30 }),
    prisma.issueTopic.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
    prisma.user.findMany({ where: { active: true, role: 'ENGINEER' }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.ticket.count({ where: { ...myBase, issueTopic: 'Other' } }),
    prisma.ticket.count({ where: { ...myBase, canUserSolve: 'UNKNOWN' } }),
    prisma.ticket.count({ where: { ...myBase, OR: [{ designPartner: 'Unknown' }, { subcontractor: 'Unknown' }] } }),
  ])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="p-8 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>Tickets</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {total.toLocaleString()} tickets total
          </p>
        </div>
        <Link href="/tickets/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--primary)', color: '#fff' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New ticket
        </Link>
      </div>

      {/* Data quality quick-filters */}
      {(issueOther > 0 || canFixUnknown > 0 || partnerUnknown > 0) && (
        <div className="mb-4 p-3 rounded-lg flex flex-wrap gap-2 items-center" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
          <span className="text-xs mr-1" style={{ color: '#92400e', fontWeight: 700 }}>Needs correction:</span>
          {issueOther > 0 && (
            <Link href="/tickets?issueTopic=Other&mine=1" className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: params.issueTopic === 'Other' && params.mine === '1' ? '#d97706' : '#fff', color: params.issueTopic === 'Other' && params.mine === '1' ? '#fff' : '#92400e', border: '1px solid #f59e0b', textDecoration: 'none' }}>
              Issue topic: Other ({issueOther.toLocaleString()})
            </Link>
          )}
          {canFixUnknown > 0 && (
            <Link href="/tickets?canUserSolve=UNKNOWN&mine=1" className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: params.canUserSolve === 'UNKNOWN' && params.mine === '1' ? '#d97706' : '#fff', color: params.canUserSolve === 'UNKNOWN' && params.mine === '1' ? '#fff' : '#92400e', border: '1px solid #f59e0b', textDecoration: 'none' }}>
              Can fix: Unknown ({canFixUnknown.toLocaleString()})
            </Link>
          )}
          {partnerUnknown > 0 && (
            <Link href="/tickets?partnerUnknown=1&mine=1" className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: params.partnerUnknown === '1' && params.mine === '1' ? '#d97706' : '#fff', color: params.partnerUnknown === '1' && params.mine === '1' ? '#fff' : '#92400e', border: '1px solid #f59e0b', textDecoration: 'none' }}>
              Partner / Subcontractor: Unknown ({partnerUnknown.toLocaleString()})
            </Link>
          )}
        </div>
      )}

      {/* Filters */}
      <form method="GET" className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted-foreground)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input name="q" defaultValue={params.q} placeholder="Search tickets…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
        </div>
        <select name="status" defaultValue={params.status ?? ''}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', colorScheme: 'light' }}>
          <option value="">All statuses</option>
          {['NOT_YET_STARTED','IN_PROGRESS','ON_HOLD','DONE','DONE_BY_L2','ESCALATED_TO_L2'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select name="partner" defaultValue={params.partner ?? ''}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', colorScheme: 'light' }}>
          <option value="">All partners</option>
          {partners.map(p => <option key={p.designPartner} value={p.designPartner}>{p.designPartner}</option>)}
        </select>
        <select name="urgency" defaultValue={params.urgency ?? ''}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', colorScheme: 'light' }}>
          <option value="">All urgencies</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <select name="canUserSolve" defaultValue={params.canUserSolve ?? ''}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', colorScheme: 'light' }}>
          <option value="">Can user solve (all)</option>
          <option value="YES">Yes</option>
          <option value="NO">No</option>
        </select>
        <select name="issueTopic" defaultValue={params.issueTopic ?? ''}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', colorScheme: 'light' }}>
          <option value="">All issue topics</option>
          {issueTopics.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
        </select>
        <select name="engineerFilter" defaultValue={effectiveEngineerId ?? ''}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)', colorScheme: 'light' }}>
          <option value="all">All engineers</option>
          {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <button type="submit" className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-[#f5f5f5]"
          style={{ background: 'var(--card)', color: '#525252', border: '1px solid var(--border)' }}>
          Filter
        </button>
        {hasAnyFilter && (
          <Link href={isAdmin ? '/tickets' : `/tickets?engineerFilter=${engineerId}`}
            className="px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Clear
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[
                { label: 'Ticket', key: 'ticketNumber' },
                { label: 'Engineer', key: null },
                { label: 'Partner', key: null },
                { label: 'Issue Topic', key: null },
                { label: 'Status', key: null },
                { label: 'Urgency', key: null },
                { label: 'Start Date', key: 'startDate' },
                { label: '', key: null },
              ].map(({ label, key }) => {
                const isActive = (params.sort ?? 'startDate') === (key ?? '')
                const nextDir = isActive && params.dir !== 'asc' ? 'asc' : 'desc'
                const arrow = isActive ? (params.dir === 'asc' ? ' ↑' : ' ↓') : ''
                return (
                  <th key={label} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    style={{ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)', background: 'var(--muted)', whiteSpace: 'nowrap', cursor: key ? 'pointer' : 'default' }}>
                    {key ? (
                      <Link href={`/tickets?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([,v]) => v) as [string,string][]), sort: key, dir: nextDir, page: '1' })}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}>
                        {label}{arrow}
                      </Link>
                    ) : label}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {tickets.map((t, i) => (
              <tr key={t.id}
                style={{ borderBottom: i < tickets.length - 1 ? '1px solid var(--border)' : undefined }}
                className="hover:bg-[#fafafa] transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/tickets/${t.id}`} className="font-medium hover:underline"
                    style={{ color: 'var(--primary)' }}>
                    {t.ticketNumber}
                  </Link>
                  {t.description && <p className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: 'var(--muted-foreground)' }}>{t.description}</p>}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{t.engineer.name}</td>
                <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>{t.designPartner}</td>
                <td className="px-4 py-3">
                  {t.issueTopic ? (
                    <span className="text-xs px-2 py-0.5 rounded-md"
                      style={{ background: 'var(--accent-bg)', color: 'var(--accent-fg)' }}>
                      {t.issueTopic}
                    </span>
                  ) : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge label={t.status} className={STATUS_STYLES[t.status] ?? STATUS_STYLES.NOT_YET_STARTED} />
                </td>
                <td className="px-4 py-3">
                  <Badge label={t.urgency} className={URGENCY_STYLES[t.urgency] ?? URGENCY_STYLES.NOT_SPECIFIED} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                  {formatDate(t.startDate)}
                </td>
                <td className="px-4 py-3">
                  <QuickStatusEdit
                    ticket={{ id: t.id, ticketNumber: t.ticketNumber, status: t.status, issueTopic: t.issueTopic ?? null, actualEnd: t.actualEnd ?? null, documentationStatus: t.documentationStatus, description: t.description ?? null }}
                    issueTopics={issueTopics.map(i => i.name)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tickets.length === 0 && (
          <div className="py-16 text-center" style={{ color: 'var(--muted-foreground)' }}>
            No tickets found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/tickets?${new URLSearchParams(Object.fromEntries(Object.entries({ ...params, page: String(page - 1) }).filter(([,v]) => v) as [string,string][]))}`}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/tickets?${new URLSearchParams(Object.fromEntries(Object.entries({ ...params, page: String(page + 1) }).filter(([,v]) => v) as [string,string][]))}`}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{ background: 'var(--primary)', color: '#fff' }}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <TicketsFilterSaver isAdmin={isAdmin} engineerId={engineerId} />
      </Suspense>
    </div>
  )
}
