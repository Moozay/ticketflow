import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type EngineerRow = {
  engineer_id: string
  engineer_name: string
  total: bigint
  done: bigint
  escalated: bigint
  waiting_l2: bigint
  on_hold: bigint
  ongoing: bigint
  not_started: bigint
  cat1: bigint
  cat2: bigint
  cat3: bigint
  avg_days: number | null
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  const now      = new Date()
  const fromDate = from ? new Date(from)             : new Date(now.getFullYear(), 0, 1)
  const toDate   = to   ? new Date(to + 'T23:59:59') : now

  const engRaw = await prisma.$queryRaw<EngineerRow[]>`
    SELECT
      u.id             AS engineer_id,
      u.name           AS engineer_name,
      COUNT(*)::bigint AS total,
      SUM(CASE WHEN t.status::text IN ('DONE','DONE_BY_L2')            THEN 1 ELSE 0 END)::bigint AS done,
      SUM(CASE WHEN t.status::text IN ('ESCALATED_TO_L2','DONE_BY_L2') THEN 1 ELSE 0 END)::bigint AS escalated,
      SUM(CASE WHEN t.status = 'ESCALATED_TO_L2'                       THEN 1 ELSE 0 END)::bigint AS waiting_l2,
      SUM(CASE WHEN t.status = 'ON_HOLD'                               THEN 1 ELSE 0 END)::bigint AS on_hold,
      SUM(CASE WHEN t.status = 'IN_PROGRESS'                           THEN 1 ELSE 0 END)::bigint AS ongoing,
      SUM(CASE WHEN t.status = 'NOT_YET_STARTED'                       THEN 1 ELSE 0 END)::bigint AS not_started,
      SUM(CASE WHEN t.category = 'CATEGORY_1' THEN 1 ELSE 0 END)::bigint AS cat1,
      SUM(CASE WHEN t.category = 'CATEGORY_2' THEN 1 ELSE 0 END)::bigint AS cat2,
      SUM(CASE WHEN t.category = 'CATEGORY_3' THEN 1 ELSE 0 END)::bigint AS cat3,
      ROUND(
        AVG(
          CASE WHEN t.status::text IN ('DONE','DONE_BY_L2') AND t."actualEnd" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (t."actualEnd" - t."startDate")) / 86400.0
          END
        )::numeric, 1
      )::float AS avg_days
    FROM "User" u
    INNER JOIN "Ticket" t ON t."engineerId" = u.id
    WHERE t."isValidTicket" = true
      AND t."archivedAt"   IS NULL
      AND t."startDate"    >= ${fromDate}
      AND t."startDate"    <= ${toDate}
    GROUP BY u.id, u.name
    ORDER BY total DESC
  `

  const byEngineer = engRaw.map(r => {
    const total     = Number(r.total)
    const done      = Number(r.done)
    const escalated = Number(r.escalated)
    return {
      id:            r.engineer_id,
      name:          r.engineer_name,
      total,
      done,
      donePct:       total ? Math.round(done      / total * 100) : 0,
      escalated,
      escalationPct: total ? Math.round(escalated / total * 100) : 0,
      avgDays:       r.avg_days ?? 0,
      cat1:          Number(r.cat1),
      cat2:          Number(r.cat2),
      cat3:          Number(r.cat3),
      onHold:        Number(r.on_hold),
      ongoing:       Number(r.ongoing),
      notStarted:    Number(r.not_started),
      waitingL2:     Number(r.waiting_l2),
    }
  })

  const n          = byEngineer.length
  const grandTotal = byEngineer.reduce((s, e) => s + e.total, 0)
  const withDays   = byEngineer.filter(e => e.avgDays > 0)

  const teamAvgDays    = withDays.length > 0
    ? Math.round(withDays.reduce((s, e) => s + e.avgDays, 0) / withDays.length * 10) / 10
    : 0
  const teamAvgDonePct = n > 0 ? Math.round(byEngineer.reduce((s, e) => s + e.donePct,       0) / n) : 0
  const teamAvgEscPct  = n > 0 ? Math.round(byEngineer.reduce((s, e) => s + e.escalationPct, 0) / n) : 0

  const topByVolume     = byEngineer[0] ?? null
  const topByCompletion = [...byEngineer]
    .filter(e => e.total >= 5)
    .sort((a, b) => b.donePct - a.donePct)[0] ?? null

  return NextResponse.json({
    kpis: {
      activeEngineers:       n,
      avgTicketsPerEngineer: n > 0 ? Math.round(grandTotal / n) : 0,
      topByVolume:           topByVolume?.name     ?? '—',
      topByVolumeCount:      topByVolume?.total    ?? 0,
      topByCompletion:       topByCompletion?.name ?? '—',
      topCompletionPct:      topByCompletion?.donePct ?? 0,
      teamAvgDays,
      teamAvgDonePct,
      teamAvgEscPct,
    },
    byEngineer,
  })
}
