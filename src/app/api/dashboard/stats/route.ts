import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type MonthRow = { month: string; total: bigint; resolved: bigint }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const dateRange = from && to ? { startDate: { gte: new Date(from), lte: new Date(to) } } : {}
  const base = { isValidTicket: true as const, archivedAt: null, ...dateRange }

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
    byStatus,
    byUrgency,
    byCanUserSolve,
    byIssueType,
    byEngineer,
    monthlyRaw,
    engineers,
  ] = await Promise.all([
    prisma.ticket.count({ where: { isValidTicket: true, ...dateRange } }),
    prisma.ticket.count({ where: { isValidTicket: true, status: { in: ['DONE', 'DONE_BY_L2'] }, ...dateRange } }),
    prisma.ticket.count({ where: { isValidTicket: true, status: { notIn: ['DONE', 'DONE_BY_L2'] }, ...dateRange } }),
    prisma.ticket.count({ where: { isValidTicket: true, status: 'ESCALATED_TO_L2', ...dateRange } }),
    prisma.ticket.count({ where: { isValidTicket: true, canUserSolve: 'YES', ...dateRange } }),
    prisma.ticket.count({ where: { isValidTicket: true, isOutlier: true, ...dateRange } }),
    prisma.ticket.count({ where: { isValidTicket: true, status: 'NOT_YET_STARTED', ...dateRange } }),
    prisma.ticket.count({ where: { isValidTicket: true, status: 'ON_HOLD', ...dateRange } }),
    prisma.ticket.groupBy({ by: ['issueTopic'], where: { isValidTicket: true, issueTopic: { not: null }, ...dateRange }, _count: true, orderBy: { _count: { issueTopic: 'desc' } }, take: 15 }),
    prisma.ticket.groupBy({ by: ['designPartner', 'canUserSolve'], where: base, _count: true }),
    prisma.ticket.groupBy({ by: ['designPartner', 'status'], where: base, _count: true }),
    prisma.ticket.groupBy({ by: ['status'], where: base, _count: true }),
    prisma.ticket.groupBy({ by: ['urgency'], where: base, _count: true }),
    prisma.ticket.groupBy({ by: ['canUserSolve'], where: base, _count: true }),
    prisma.ticket.groupBy({ by: ['issueType'], where: base, _count: true }),
    prisma.ticket.groupBy({ by: ['engineerId'], where: base, _count: true, orderBy: { _count: { engineerId: 'desc' } } }),
    from && to
      ? prisma.$queryRaw<MonthRow[]>`
          SELECT TO_CHAR(DATE_TRUNC('month', "startDate"), 'Mon YY') as month,
                 COUNT(*) as total,
                 SUM(CASE WHEN status::text IN ('DONE', 'DONE_BY_L2') THEN 1 ELSE 0 END) as resolved
          FROM "Ticket"
          WHERE "isValidTicket" = true AND "archivedAt" IS NULL
            AND "startDate" >= ${new Date(from)} AND "startDate" <= ${new Date(to)}
          GROUP BY DATE_TRUNC('month', "startDate")
          ORDER BY DATE_TRUNC('month', "startDate")
          LIMIT 18`
      : prisma.$queryRaw<MonthRow[]>`
          SELECT TO_CHAR(DATE_TRUNC('month', "startDate"), 'Mon YY') as month,
                 COUNT(*) as total,
                 SUM(CASE WHEN status::text IN ('DONE', 'DONE_BY_L2') THEN 1 ELSE 0 END) as resolved
          FROM "Ticket"
          WHERE "isValidTicket" = true AND "archivedAt" IS NULL
          GROUP BY DATE_TRUNC('month', "startDate")
          ORDER BY DATE_TRUNC('month', "startDate")
          LIMIT 18`,
    prisma.user.findMany({ select: { id: true, name: true } }),
  ])

  const engineerMap = Object.fromEntries(engineers.map(e => [e.id, e.name]))

  const partnerCF: Record<string, { canFix: number; cannotFix: number }> = {}
  for (const row of byPartnerBreakdown) {
    const key = row.designPartner as string
    if (!partnerCF[key]) partnerCF[key] = { canFix: 0, cannotFix: 0 }
    if (row.canUserSolve === 'YES' || row.canUserSolve === 'PARTIALLY') {
      partnerCF[key].canFix += row._count
    } else {
      partnerCF[key].cannotFix += row._count
    }
  }

  const partnerEsc: Record<string, number> = {}
  for (const row of byPartnerStatusRaw) {
    if (row.status === 'ESCALATED_TO_L2') {
      const key = row.designPartner as string
      partnerEsc[key] = (partnerEsc[key] ?? 0) + row._count
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

  const STATUS_LABELS: Record<string, string> = {
    NOT_YET_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', ON_HOLD: 'On Hold',
    DONE: 'Done', DONE_BY_L2: 'Done (L2)', ESCALATED_TO_L2: 'Escalated',
  }
  const URGENCY_ORDER = ['High', 'Medium', 'Low', 'Not Specified']
  const URGENCY_LABELS: Record<string, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }
  const CAN_FIX_LABELS: Record<string, string> = { YES: 'Yes', NO: 'No' }

  return NextResponse.json({
    stats: {
      totalTickets, resolvedTickets, openTickets,
      notStartedCount, onHoldCount,
      escalationCount, selfSolvableCount, outlierCount,
    },
    byIssueTopic: byIssueTopic.map(d => ({ name: d.issueTopic ?? 'Other', value: d._count })),
    byPartner: partnerSummary.map(p => ({ name: p.name, canFix: p.canFix, cannotFix: p.cannotFix })),
    partnerSummary,
    byStatus: byStatus.map(d => ({ name: STATUS_LABELS[d.status] ?? d.status, value: d._count })),
    byUrgency: byUrgency
      .map(d => ({ name: URGENCY_LABELS[d.urgency as string] ?? String(d.urgency), value: d._count }))
      .sort((a, b) => URGENCY_ORDER.indexOf(a.name) - URGENCY_ORDER.indexOf(b.name)),
    byCanUserSolve: byCanUserSolve.map(d => ({ name: CAN_FIX_LABELS[d.canUserSolve as string] ?? String(d.canUserSolve), value: d._count })),
    byIssueType: byIssueType.map(d => ({ name: d.issueType === 'MARLIN_ISSUE' ? 'Marlin' : 'Comsof', value: d._count })),
    byEngineer: byEngineer.map(d => ({ name: engineerMap[d.engineerId as string] ?? String(d.engineerId), value: d._count })),
    monthlyTrend: monthlyRaw.map(r => ({ month: r.month, total: Number(r.total), resolved: Number(r.resolved) })),
  })
}
