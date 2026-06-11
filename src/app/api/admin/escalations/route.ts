import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type MonthRow   = { month: string; month_ts: Date; escalated: bigint; resolved: bigint }
type SubcoRow   = { subcontractor: string; escalated: bigint }
type BucketRow  = { bucket: string; sort_key: number; count: bigint }
type AvgRow     = { avg_days: number | null }

const BUCKET_LABELS: Record<number, string> = {
  1: '≤ 1 day',
  2: '1 – 3 days',
  3: '3 – 7 days',
  4: '7 – 14 days',
  5: '> 14 days',
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (role !== 'ADMIN' && role !== 'EXTERN_PLUS') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  const now       = new Date()
  const fromDate  = from ? new Date(from)              : new Date(now.getFullYear(), 0, 1)
  const toDate    = to   ? new Date(to + 'T23:59:59')  : now

  const [
    totalEscalated,
    stillOpen,
    resolvedByL2,
    avgDaysRaw,
    totalInPeriod,
    monthlyRaw,
    subcoEscRaw,
    subcoTotalRaw,
    bucketsRaw,
  ] = await Promise.all([

    // All escalated tickets (open + resolved) that started in the period
    prisma.ticket.count({
      where: { isValidTicket: true, status: { in: ['ESCALATED_TO_L2', 'DONE_BY_L2'] }, startDate: { gte: fromDate, lte: toDate } },
    }),

    // Still waiting on L2
    prisma.ticket.count({
      where: { isValidTicket: true, status: 'ESCALATED_TO_L2', startDate: { gte: fromDate, lte: toDate } },
    }),

    // Resolved by L2
    prisma.ticket.count({
      where: { isValidTicket: true, status: 'DONE_BY_L2', startDate: { gte: fromDate, lte: toDate } },
    }),

    // Avg calendar days from open to close (DONE_BY_L2 only)
    prisma.$queryRaw<AvgRow[]>`
      SELECT ROUND(
        AVG(EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400.0)::numeric, 1
      )::float AS avg_days
      FROM "Ticket"
      WHERE "isValidTicket" = true
        AND status        = 'DONE_BY_L2'
        AND "actualEnd"  IS NOT NULL
        AND "startDate"  >= ${fromDate}
        AND "startDate"  <= ${toDate}
    `,

    // Total valid tickets in period (for escalation rate)
    prisma.ticket.count({
      where: { isValidTicket: true, archivedAt: null, startDate: { gte: fromDate, lte: toDate } },
    }),

    // Monthly trend — escalated vs resolved per month
    prisma.$queryRaw<MonthRow[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "startDate"), 'Mon ''YY') AS month,
        DATE_TRUNC('month', "startDate")                      AS month_ts,
        COUNT(*)                                              AS escalated,
        SUM(CASE WHEN status = 'DONE_BY_L2' THEN 1 ELSE 0 END) AS resolved
      FROM "Ticket"
      WHERE "isValidTicket" = true
        AND status::text IN ('ESCALATED_TO_L2', 'DONE_BY_L2')
        AND "startDate" >= ${fromDate}
        AND "startDate" <= ${toDate}
      GROUP BY month, month_ts
      ORDER BY month_ts
    `,

    // Escalations per subcontractor
    prisma.$queryRaw<SubcoRow[]>`
      SELECT subcontractor, COUNT(*) AS escalated
      FROM "Ticket"
      WHERE "isValidTicket" = true
        AND status::text IN ('ESCALATED_TO_L2', 'DONE_BY_L2')
        AND "startDate" >= ${fromDate}
        AND "startDate" <= ${toDate}
        AND subcontractor != 'Wyre ( OSC UPDATE )'
      GROUP BY subcontractor
      ORDER BY escalated DESC
    `,

    // Total tickets per subcontractor in period (to compute escalation %)
    prisma.ticket.groupBy({
      by: ['subcontractor'],
      where: { isValidTicket: true, archivedAt: null, startDate: { gte: fromDate, lte: toDate }, subcontractor: { not: 'Wyre ( OSC UPDATE )' } },
      _count: true,
    }),

    // Resolution time buckets (closed escalations only)
    prisma.$queryRaw<BucketRow[]>`
      SELECT
        CASE
          WHEN EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400 <= 1  THEN '≤ 1 day'
          WHEN EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400 <= 3  THEN '1 – 3 days'
          WHEN EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400 <= 7  THEN '3 – 7 days'
          WHEN EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400 <= 14 THEN '7 – 14 days'
          ELSE '> 14 days'
        END                   AS bucket,
        CASE
          WHEN EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400 <= 1  THEN 1
          WHEN EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400 <= 3  THEN 2
          WHEN EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400 <= 7  THEN 3
          WHEN EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400 <= 14 THEN 4
          ELSE 5
        END                   AS sort_key,
        COUNT(*)              AS count
      FROM "Ticket"
      WHERE "isValidTicket" = true
        AND status       = 'DONE_BY_L2'
        AND "actualEnd" IS NOT NULL
        AND "startDate" >= ${fromDate}
        AND "startDate" <= ${toDate}
      GROUP BY bucket, sort_key
      ORDER BY sort_key
    `,
  ])

  // Merge subco escalation counts with totals
  const subcoTotalMap: Record<string, number> = {}
  for (const r of subcoTotalRaw) subcoTotalMap[r.subcontractor] = r._count

  const bySubcontractor = subcoEscRaw.map(r => {
    const esc   = Number(r.escalated)
    const total = subcoTotalMap[r.subcontractor] ?? esc
    return {
      name:      r.subcontractor?.trim() || '(Blank)',
      escalated: esc,
      total,
      pct: total ? Math.round(esc / total * 100) : 100,
    }
  })

  const escalationRate = totalInPeriod
    ? Math.round(totalEscalated / totalInPeriod * 1000) / 10
    : 0

  return NextResponse.json({
    kpis: {
      totalEscalated,
      stillOpen,
      resolvedByL2,
      avgDaysToClose: avgDaysRaw[0]?.avg_days ?? 0,
      escalationRate,
      totalInPeriod,
    },
    monthly: monthlyRaw.map(r => ({
      month:    r.month,
      escalated: Number(r.escalated),
      resolved:  Number(r.resolved),
    })),
    bySubcontractor,
    resolutionBuckets: bucketsRaw.map(r => ({
      range: r.bucket,
      count: Number(r.count),
      sort:  Number(r.sort_key),
    })),
  })
}
