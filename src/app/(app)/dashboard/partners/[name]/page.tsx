import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PartnerDetailClient from './PartnerDetailClient'

type MonthRow = { month: string; total: bigint; resolved: bigint }

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const partnerName = decodeURIComponent(name)

  const where = { isValidTicket: true, designPartner: partnerName, archivedAt: null } as const

  const [
    totalTickets,
    resolvedCount,
    escalationCount,
    selfSolvableCount,
    byIssueTopic,
    byStatus,
    byUrgency,
    byCanUserSolve,
    byDocStatus,
    tickets,
    monthlyRaw,
  ] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.ticket.count({ where: { ...where, status: { in: ['DONE', 'DONE_BY_L2'] } } }),
    prisma.ticket.count({ where: { ...where, status: 'ESCALATED_TO_L2' } }),
    prisma.ticket.count({ where: { ...where, canUserSolve: 'YES' } }),
    prisma.ticket.groupBy({
      by: ['issueTopic'], where: { ...where, issueTopic: { not: null } },
      _count: true, orderBy: { _count: { issueTopic: 'desc' } }, take: 20,
    }),
    prisma.ticket.groupBy({ by: ['status'], where, _count: true }),
    prisma.ticket.groupBy({ by: ['urgency'], where, _count: true }),
    prisma.ticket.groupBy({ by: ['canUserSolve'], where, _count: true }),
    prisma.ticket.groupBy({ by: ['documentationStatus'], where, _count: true }),
    prisma.ticket.findMany({
      where,
      orderBy: { startDate: 'desc' },
      select: {
        id: true, ticketNumber: true, startDate: true, actualEnd: true,
        issueTopic: true, status: true, urgency: true,
        canUserSolve: true, description: true,
      },
    }),
    prisma.$queryRaw<MonthRow[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "startDate"), 'Mon YY') as month,
        COUNT(*) as total,
        SUM(CASE WHEN status::text IN ('DONE', 'DONE_BY_L2') THEN 1 ELSE 0 END) as resolved
      FROM "Ticket"
      WHERE "isValidTicket" = true AND "archivedAt" IS NULL AND "designPartner" = ${partnerName}
      GROUP BY DATE_TRUNC('month', "startDate")
      ORDER BY DATE_TRUNC('month', "startDate")
      LIMIT 18
    `,
  ])

  if (totalTickets === 0) notFound()

  const STATUS_LABELS: Record<string, string> = {
    NOT_YET_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', ON_HOLD: 'On Hold',
    DONE: 'Done', DONE_BY_L2: 'Done (L2)', ESCALATED_TO_L2: 'Escalated',
  }
  const URGENCY_ORDER = ['High', 'Medium', 'Low', 'Not Specified']
  const URGENCY_LABELS: Record<string, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }
  const CAN_FIX_LABELS: Record<string, string> = { YES: 'Yes', NO: 'No' }
  const DOC_LABELS: Record<string, string> = {
    ALREADY_EXISTS: 'Already Exists', NOT_NEEDED: 'Not Needed',
    WILL_CREATE: 'Will Create', CREATED: 'Created',
  }

  return (
    <PartnerDetailClient
      partnerName={partnerName}
      stats={{
        totalTickets, resolvedCount, escalationCount, selfSolvableCount,
      }}
      byIssueTopic={byIssueTopic.map(d => ({ name: d.issueTopic ?? 'Other', value: d._count }))}
      byStatus={byStatus.map(d => ({ name: STATUS_LABELS[d.status] ?? d.status, value: d._count }))}
      byUrgency={byUrgency
        .map(d => ({ name: URGENCY_LABELS[d.urgency] ?? d.urgency, value: d._count }))
        .sort((a, b) => URGENCY_ORDER.indexOf(a.name) - URGENCY_ORDER.indexOf(b.name))}
      byCanUserSolve={byCanUserSolve.map(d => ({ name: CAN_FIX_LABELS[d.canUserSolve] ?? d.canUserSolve, value: d._count }))}
      byDocStatus={byDocStatus.map(d => ({ name: DOC_LABELS[d.documentationStatus] ?? d.documentationStatus, value: d._count }))}
      monthlyTrend={monthlyRaw.map(r => ({ month: r.month, total: Number(r.total), resolved: Number(r.resolved) }))}
      tickets={tickets.map(t => ({
        ...t,
        startDate: t.startDate.toISOString(),
        actualEnd: t.actualEnd ? t.actualEnd.toISOString() : null,
      }))}
    />
  )
}
