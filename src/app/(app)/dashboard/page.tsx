import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

type MonthRow = { month: string; total: bigint; resolved: bigint }

export default async function DashboardPage() {
  const [
    totalTickets,
    resolvedTickets,
    openTickets,
    escalationCount,
    selfSolvableCount,
    outlierCount,
    notStartedCount,
    onHoldCount,
    byIssueTopic,
    byPartnerBreakdown,
    byPartnerStatusRaw,
    bySubcontractorBreakdown,
    byStatus,
    byCanUserSolve,
    byIssueType,
    byEngineer,
    monthlyRaw,
  ] = await Promise.all([
    prisma.ticket.count({ where: { isValidTicket: true, archivedAt: null } }),
    prisma.ticket.count({ where: { isValidTicket: true, status: { in: ['DONE', 'DONE_BY_L2'] } } }),
    prisma.ticket.count({ where: { isValidTicket: true, status: { notIn: ['DONE', 'DONE_BY_L2'] } } }),
    prisma.ticket.count({ where: { isValidTicket: true, status: 'ESCALATED_TO_L2' } }),
    prisma.ticket.count({ where: { isValidTicket: true, canUserSolve: 'YES' } }),
    prisma.ticket.count({ where: { isValidTicket: true, isOutlier: true } }),
    prisma.ticket.count({ where: { isValidTicket: true, status: 'NOT_YET_STARTED' } }),
    prisma.ticket.count({ where: { isValidTicket: true, status: 'ON_HOLD' } }),
    prisma.ticket.groupBy({ by: ['issueTopic'], where: { isValidTicket: true, issueTopic: { not: null } }, _count: true, orderBy: { _count: { issueTopic: 'desc' } }, take: 15 }),
    prisma.ticket.groupBy({ by: ['designPartner', 'canUserSolve'], where: { isValidTicket: true, archivedAt: null, designPartner: { not: 'Wyre ( OSC UPDATE )' } }, _count: true }),
    prisma.ticket.groupBy({ by: ['designPartner', 'status'], where: { isValidTicket: true, archivedAt: null, designPartner: { not: 'Wyre ( OSC UPDATE )' } }, _count: true }),
    prisma.ticket.groupBy({ by: ['subcontractor', 'canUserSolve'], where: { isValidTicket: true, archivedAt: null, subcontractor: { not: 'Wyre ( OSC UPDATE )' } }, _count: true }),
    prisma.ticket.groupBy({ by: ['status'], where: { isValidTicket: true, archivedAt: null }, _count: true }),
    prisma.ticket.groupBy({ by: ['canUserSolve'], where: { isValidTicket: true, archivedAt: null }, _count: true }),
    prisma.ticket.groupBy({ by: ['issueType'], where: { isValidTicket: true, archivedAt: null }, _count: true }),
    prisma.ticket.groupBy({ by: ['engineerId'], where: { isValidTicket: true, archivedAt: null }, _count: true, orderBy: { _count: { engineerId: 'desc' } } }),
    prisma.$queryRaw<MonthRow[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "startDate"), 'Mon YY') as month,
        COUNT(*) as total,
        SUM(CASE WHEN status::text IN ('DONE', 'DONE_BY_L2') THEN 1 ELSE 0 END) as resolved
      FROM "Ticket"
      WHERE "isValidTicket" = true AND "archivedAt" IS NULL
      GROUP BY DATE_TRUNC('month', "startDate")
      ORDER BY DATE_TRUNC('month', "startDate")
      LIMIT 18
    `,
  ])

  // Partner can/cannot fix
  const partnerCF: Record<string, { canFix: number; cannotFix: number }> = {}
  for (const row of byPartnerBreakdown) {
    if (!partnerCF[row.designPartner]) partnerCF[row.designPartner] = { canFix: 0, cannotFix: 0 }
    if (row.canUserSolve === 'YES' || row.canUserSolve === 'PARTIALLY') {
      partnerCF[row.designPartner].canFix += row._count
    } else {
      partnerCF[row.designPartner].cannotFix += row._count
    }
  }

  // Partner escalation counts
  const partnerEsc: Record<string, number> = {}
  for (const row of byPartnerStatusRaw) {
    if (row.status === 'ESCALATED_TO_L2') {
      partnerEsc[row.designPartner] = (partnerEsc[row.designPartner] ?? 0) + row._count
    }
  }

  const partnerSummary = Object.entries(partnerCF)
    .map(([name, { canFix, cannotFix }]) => ({
      name,
      total: canFix + cannotFix,
      canFix,
      cannotFix,
      escalations: partnerEsc[name] ?? 0,
    }))
    .sort((a, b) => b.total - a.total)

  const byPartnerStacked = partnerSummary.map(p => ({ name: p.name, canFix: p.canFix, cannotFix: p.cannotFix }))

  // Subcontractor can/cannot fix
  const subcoCF: Record<string, { canFix: number; cannotFix: number }> = {}
  for (const row of bySubcontractorBreakdown) {
    if (!row.subcontractor) continue
    const key = row.subcontractor
    if (!subcoCF[key]) subcoCF[key] = { canFix: 0, cannotFix: 0 }
    if (row.canUserSolve === 'YES' || row.canUserSolve === 'PARTIALLY') {
      subcoCF[key].canFix += row._count
    } else {
      subcoCF[key].cannotFix += row._count
    }
  }
  const bySubcontractorStacked = Object.entries(subcoCF)
    .map(([name, { canFix, cannotFix }]) => ({ name, canFix, cannotFix }))
    .sort((a, b) => (b.canFix + b.cannotFix) - (a.canFix + a.cannotFix))

  const engineers = await prisma.user.findMany({ select: { id: true, name: true } })
  const engineerMap = Object.fromEntries(engineers.map(e => [e.id, e.name]))

  const STATUS_LABELS: Record<string, string> = {
    NOT_YET_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', ON_HOLD: 'On Hold',
    DONE: 'Done', DONE_BY_L2: 'Done (L2)', ESCALATED_TO_L2: 'Escalated',
  }
  const CAN_FIX_LABELS: Record<string, string> = { YES: 'Yes', NO: 'No' }

  return (
    <DashboardClient
      stats={{
        totalTickets, resolvedTickets, openTickets,
        notStartedCount, onHoldCount,
        escalationCount, selfSolvableCount, outlierCount,
      }}
      byIssueTopic={byIssueTopic.map(d => ({ name: d.issueTopic ?? 'Other', value: d._count }))}
      byPartner={byPartnerStacked}
      bySubcontractor={bySubcontractorStacked}
      partnerSummary={partnerSummary}
      byStatus={byStatus.map(d => ({ name: STATUS_LABELS[d.status] ?? d.status, value: d._count }))}
      byCanUserSolve={byCanUserSolve.map(d => ({ name: CAN_FIX_LABELS[d.canUserSolve] ?? d.canUserSolve, value: d._count }))}
      byIssueType={byIssueType.map(d => ({ name: d.issueType === 'MARLIN_ISSUE' ? 'Marlin' : 'Comsof', value: d._count }))}
      byEngineer={byEngineer.map(d => ({ name: engineerMap[d.engineerId] ?? d.engineerId, value: d._count }))}
      monthlyTrend={monthlyRaw.map(r => ({ month: r.month, total: Number(r.total), resolved: Number(r.resolved) }))}
    />
  )
}
