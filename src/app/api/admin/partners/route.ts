import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type SubcoRow = {
  subcontractor: string
  total: bigint
  done: bigint
  escalated: bigint
  avg_days: number | null
}

type PartnerRow = {
  design_partner: string
  total: bigint
  done: bigint
  avg_days: number | null
}

type MatrixRow = {
  subcontractor: string
  design_partner: string
  count: bigint
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

  const [subcoRaw, partnerRaw, matrixRaw] = await Promise.all([

    // Per-subcontractor metrics
    prisma.$queryRaw<SubcoRow[]>`
      SELECT
        subcontractor,
        COUNT(*)::bigint AS total,
        SUM(CASE WHEN status::text IN ('DONE','DONE_BY_L2')            THEN 1 ELSE 0 END)::bigint AS done,
        SUM(CASE WHEN status::text IN ('ESCALATED_TO_L2','DONE_BY_L2') THEN 1 ELSE 0 END)::bigint AS escalated,
        ROUND(
          AVG(
            CASE WHEN status::text IN ('DONE','DONE_BY_L2') AND "actualEnd" IS NOT NULL
              THEN EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400.0
            END
          )::numeric, 1
        )::float AS avg_days
      FROM "Ticket"
      WHERE "isValidTicket" = true
        AND "archivedAt"   IS NULL
        AND "startDate"    >= ${fromDate}
        AND "startDate"    <= ${toDate}
      GROUP BY subcontractor
      ORDER BY total DESC
    `,

    // Per-design-partner metrics
    prisma.$queryRaw<PartnerRow[]>`
      SELECT
        "designPartner"  AS design_partner,
        COUNT(*)::bigint AS total,
        SUM(CASE WHEN status::text IN ('DONE','DONE_BY_L2') THEN 1 ELSE 0 END)::bigint AS done,
        ROUND(
          AVG(
            CASE WHEN status::text IN ('DONE','DONE_BY_L2') AND "actualEnd" IS NOT NULL
              THEN EXTRACT(EPOCH FROM ("actualEnd" - "startDate")) / 86400.0
            END
          )::numeric, 1
        )::float AS avg_days
      FROM "Ticket"
      WHERE "isValidTicket" = true
        AND "archivedAt"   IS NULL
        AND "startDate"    >= ${fromDate}
        AND "startDate"    <= ${toDate}
      GROUP BY "designPartner"
      ORDER BY total DESC
    `,

    // Cross-table: subcontractor × design partner
    prisma.$queryRaw<MatrixRow[]>`
      SELECT
        subcontractor,
        "designPartner"  AS design_partner,
        COUNT(*)::bigint AS count
      FROM "Ticket"
      WHERE "isValidTicket" = true
        AND "archivedAt"   IS NULL
        AND "startDate"    >= ${fromDate}
        AND "startDate"    <= ${toDate}
      GROUP BY subcontractor, "designPartner"
      ORDER BY count DESC
    `,
  ])

  const bySubcontractor = subcoRaw.map(r => {
    const total     = Number(r.total)
    const done      = Number(r.done)
    const escalated = Number(r.escalated)
    return {
      name:           r.subcontractor?.trim() || '(Blank)',
      total,
      done,
      donePct:        total ? Math.round(done      / total * 100) : 0,
      escalated,
      escalationPct:  total ? Math.round(escalated / total * 100) : 0,
      avgDays:        r.avg_days ?? 0,
    }
  })

  const byDesignPartner = partnerRaw.map(r => {
    const total = Number(r.total)
    const done  = Number(r.done)
    return {
      name:    r.design_partner?.trim() || '(Blank)',
      total,
      done,
      donePct: total ? Math.round(done / total * 100) : 0,
      avgDays: r.avg_days ?? 0,
    }
  })

  const totalSubcos         = new Set(subcoRaw.map(r => r.subcontractor)).size
  const totalDesignPartners = new Set(partnerRaw.map(r => r.design_partner)).size
  const topSubco            = bySubcontractor[0] ?? null
  const grandTotal          = bySubcontractor.reduce((s, r) => s + r.total, 0)
  const avgTicketsPerSubco  = totalSubcos > 0 ? Math.round(grandTotal / totalSubcos) : 0

  return NextResponse.json({
    kpis: {
      totalSubcos,
      totalDesignPartners,
      topSubco:          topSubco?.name  ?? '—',
      topSubcoCount:     topSubco?.total ?? 0,
      avgTicketsPerSubco,
    },
    bySubcontractor,
    byDesignPartner,
    matrix: matrixRaw.map(r => ({
      subco:        r.subcontractor?.trim() || '(Blank)',
      designPartner: r.design_partner?.trim() || '(Blank)',
      count:         Number(r.count),
    })),
  })
}
