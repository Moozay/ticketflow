import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type WeekRow = { week: number; year: number; cat1: bigint; cat2: bigint; cat3: bigint; total: bigint }
type AvgCatRow = { category: string; avg_days: number | null }
type OverallAvgRow = { avg_days: number | null }

export async function GET(req: NextRequest) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const now = new Date()
  const fromDate = from ? new Date(from) : new Date(now.getFullYear(), 0, 1)
  const toDate = to ? new Date(to + 'T23:59:59') : now

  const [byWeekRaw, avgByCatRaw, overallAvgRaw, catCounts] = await Promise.all([
    // Weekly breakdown by category — ordered by ISO year + week
    prisma.$queryRaw<WeekRow[]>`
      SELECT
        EXTRACT(ISOYEAR FROM "startDate")::int  AS year,
        EXTRACT(WEEK    FROM "startDate")::int  AS week,
        SUM(CASE WHEN category = 'CATEGORY_1' THEN 1 ELSE 0 END)::bigint AS cat1,
        SUM(CASE WHEN category = 'CATEGORY_2' THEN 1 ELSE 0 END)::bigint AS cat2,
        SUM(CASE WHEN category = 'CATEGORY_3' THEN 1 ELSE 0 END)::bigint AS cat3,
        COUNT(*)::bigint AS total
      FROM "Ticket"
      WHERE "isValidTicket" = true
        AND "archivedAt"   IS NULL
        AND "startDate"    >= ${fromDate}
        AND "startDate"    <= ${toDate}
      GROUP BY year, week
      ORDER BY year, week
    `,

    // Avg days to close per category (closed tickets only)
    prisma.$queryRaw<AvgCatRow[]>`
      SELECT
        category,
        ROUND(
          AVG(EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400.0)::numeric, 1
        )::float AS avg_days
      FROM "Ticket"
      WHERE "isValidTicket" = true
        AND "actualEnd"    IS NOT NULL
        AND status::text   IN ('DONE', 'DONE_BY_L2')
        AND "startDate"    >= ${fromDate}
        AND "startDate"    <= ${toDate}
      GROUP BY category
    `,

    // Overall avg days to close
    prisma.$queryRaw<OverallAvgRow[]>`
      SELECT
        ROUND(
          AVG(EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400.0)::numeric, 1
        )::float AS avg_days
      FROM "Ticket"
      WHERE "isValidTicket" = true
        AND "actualEnd"    IS NOT NULL
        AND status::text   IN ('DONE', 'DONE_BY_L2')
        AND "startDate"    >= ${fromDate}
        AND "startDate"    <= ${toDate}
    `,

    // Count per category
    prisma.ticket.groupBy({
      by: ['category'],
      where: { isValidTicket: true, archivedAt: null, startDate: { gte: fromDate, lte: toDate } },
      _count: true,
    }),
  ])

  const totalTickets = catCounts.reduce((s, r) => s + r._count, 0)
  const calendarWeeks = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))
  const avgTicketsPerWeek = Math.round((totalTickets / calendarWeeks) * 10) / 10

  const catAvgMap: Record<string, number> = {}
  for (const r of avgByCatRaw) catAvgMap[r.category] = r.avg_days ?? 0

  const catCountMap: Record<string, number> = {}
  for (const r of catCounts) catCountMap[r.category] = r._count

  const byWeek = byWeekRaw.map(r => ({
    label: `W${r.week}`,
    week: Number(r.week),
    year: Number(r.year),
    cat1: Number(r.cat1),
    cat2: Number(r.cat2),
    cat3: Number(r.cat3),
    total: Number(r.total),
  }))

  return NextResponse.json({
    kpis: {
      totalTickets,
      avgTicketsPerWeek,
      avgDaysToClose: overallAvgRaw[0]?.avg_days ?? 0,
      cat1Count: catCountMap['CATEGORY_1'] ?? 0,
      cat2Count: catCountMap['CATEGORY_2'] ?? 0,
      cat3Count: catCountMap['CATEGORY_3'] ?? 0,
      cat1AvgDays: catAvgMap['CATEGORY_1'] ?? 0,
      cat2AvgDays: catAvgMap['CATEGORY_2'] ?? 0,
      cat3AvgDays: catAvgMap['CATEGORY_3'] ?? 0,
    },
    byWeek,
  })
}
