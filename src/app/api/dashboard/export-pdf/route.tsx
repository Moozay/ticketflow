import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import React from 'react'
import {
  Document, Page, View, Text, StyleSheet, Svg, Path, Line,
  renderToBuffer,
} from '@react-pdf/renderer'

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  gold:    '#5C7CA6',
  mid:     '#6B9080',
  deep:    '#C9A66B',
  dark:    '#C23A2B',
  darker:  '#94A3B8',
  darkest: '#3E5C7E',
  pale:    '#A7BED6',
  lightest:'#D5E0EC',
  fg:      '#1e293b',
  muted:   '#64748b',
  border:  '#e5e5e5',
  bg:      '#fafafa',
  card:    '#ffffff',
  red:     '#C23A2B',
  sidebar: '#111827',
}
const SCALE = [C.gold, C.mid, C.deep, C.dark, C.darker, C.darkest, C.pale, C.lightest, '#7C93AD', '#C0D2E2']

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { padding: 32, fontFamily: 'Helvetica', backgroundColor: C.bg, fontSize: 9, color: C.fg },
  // header
  header: { backgroundColor: C.sidebar, borderRadius: 8, padding: '14 18', marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: {},
  headerTitle: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: C.gold },
  headerSub: { fontSize: 8, color: '#737373', marginTop: 2 },
  headerDate: { fontSize: 7.5, color: '#737373', textAlign: 'right' },
  // section
  sectionWrap: { marginBottom: 22 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.fg, marginBottom: 2 },
  sectionDesc: { fontSize: 7.5, color: C.muted, marginBottom: 6 },
  divider: { borderBottomWidth: 1.5, borderBottomColor: C.border, marginBottom: 10 },
  // kpi
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  kpiCard: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 7, padding: '10 12' },
  kpiLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.7, color: C.muted, marginBottom: 4 },
  kpiValue: { fontSize: 20, fontFamily: 'Helvetica-Bold', lineHeight: 1, marginBottom: 2 },
  kpiSub: { fontSize: 6.5, color: C.muted },
  // chart cards
  chartCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 7, padding: 12, marginBottom: 10 },
  chartTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.fg, marginBottom: 2 },
  chartSub: { fontSize: 7, color: C.muted, marginBottom: 10 },
  // bar chart rows
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  barLabel: { fontSize: 7.5, color: C.muted, paddingRight: 6 },
  barTrack: { flex: 1, height: 11, backgroundColor: C.bg, borderRadius: 2 },
  barFill: { height: 11, borderRadius: 2 },
  barVal: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.fg, paddingLeft: 5, textAlign: 'right' },
  // partner table
  tableHead: { flexDirection: 'row', backgroundColor: C.bg, padding: '5 10', borderBottomWidth: 1, borderBottomColor: C.border },
  tableRow: { flexDirection: 'row', padding: '6 10', borderBottomWidth: 1, borderBottomColor: C.border },
  th: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5, color: C.muted },
  td: { fontSize: 7.5, color: C.fg },
  tdBold: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.fg },
  // 2-col layout
  twoCol: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  // legend
  legendRow: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 4, borderRadius: 1 },
  legendLabel: { fontSize: 7, color: C.muted },
})

// ── Components ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <View style={s.kpiCard}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, { color: accent ?? C.fg }]}>{value}</Text>
      {sub ? <Text style={s.kpiSub}>{sub}</Text> : null}
    </View>
  )
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <View style={s.sectionWrap} wrap={false}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={s.sectionDesc}>{desc}</Text>
      <View style={s.divider} />
    </View>
  )
}

function HBarChart({
  data,
  colors,
  labelWidth = 120,
}: {
  data: Array<{ name: string; value: number }>
  colors: string[]
  labelWidth?: number
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  return (
    <View>
      {data.map((d, i) => {
        const fillPct = Math.round((d.value / maxVal) * 100)
        const label = d.name.length > 20 ? d.name.slice(0, 20) + '…' : d.name
        return (
          <View key={i} style={s.barRow}>
            <Text style={[s.barLabel, { width: labelWidth }]}>{label}</Text>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${fillPct}%`, backgroundColor: colors[i % colors.length] }]} />
            </View>
            <Text style={[s.barVal, { width: 26 }]}>{d.value}</Text>
          </View>
        )
      })}
    </View>
  )
}

function StackedPartnerChart({ data }: { data: Array<{ name: string; canFix: number; cannotFix: number }> }) {
  return (
    <View>
      {data.map((d, i) => {
        const total = d.canFix + d.cannotFix || 1
        const canFixPct = Math.round((d.canFix / total) * 100)
        const label = d.name.length > 22 ? d.name.slice(0, 22) + '…' : d.name
        return (
          <View key={i} style={s.barRow}>
            <Text style={[s.barLabel, { width: 150 }]}>{label}</Text>
            <View style={[s.barTrack, { flexDirection: 'row', overflow: 'hidden' }]}>
              {d.canFix > 0 && (
                <View style={{ width: `${canFixPct}%`, height: 11, backgroundColor: C.gold, borderRadius: 0 }} />
              )}
              {d.cannotFix > 0 && (
                <View style={{ flex: 1, height: 11, backgroundColor: C.darkest }} />
              )}
            </View>
            <Text style={[s.barVal, { width: 40 }]}>{d.canFix}/{total}</Text>
          </View>
        )
      })}
    </View>
  )
}

// SVG area + line chart — labels rendered as positioned Views around the SVG
function TrendChart({ data }: { data: Array<{ month: string; total: number; resolved: number }> }) {
  if (data.length < 2) return null

  const W = 490, H = 110
  const PT = 8, PB = 0, PL = 0, PR = 0
  const chartW = W - PL - PR
  const chartH = H - PT - PB

  const maxVal = Math.max(...data.map(d => d.total), 1)
  const n = data.length
  const px = (i: number) => PL + (i / (n - 1)) * chartW
  const py = (v: number) => PT + (1 - v / maxVal) * chartH
  const bottom = PT + chartH

  const makeLine = (pts: Array<[number, number]>) =>
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const makeArea = (pts: Array<[number, number]>) => {
    const line = makeLine(pts)
    return `${line} L${pts[n - 1][0].toFixed(1)},${bottom} L${pts[0][0].toFixed(1)},${bottom} Z`
  }

  const totalPts = data.map((d, i) => [px(i), py(d.total)] as [number, number])
  const resolvedPts = data.map((d, i) => [px(i), py(d.resolved)] as [number, number])

  // Horizontal grid lines at 25 / 50 / 75 / 100%
  const gridLines = [0.25, 0.5, 0.75, 1.0].map(f => ({ y: py(maxVal * f), val: Math.round(maxVal * f) }))

  // X-axis labels: show ~7 evenly spaced
  const step = Math.max(1, Math.floor(n / 7))
  const xLabels = data
    .map((d, i) => ({ label: d.month, x: px(i), i }))
    .filter(d => d.i % step === 0 || d.i === n - 1)

  return (
    <View>
      {/* Y-axis labels + chart side-by-side */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Y labels (absolute positioning within a fixed-height container) */}
        <View style={{ width: 26, height: H }}>
          {gridLines.map((g, i) => (
            <Text key={i} style={{
              position: 'absolute',
              top: g.y - 3,
              right: 2,
              fontSize: 6,
              color: C.muted,
              textAlign: 'right',
              width: 24,
            }}>
              {g.val}
            </Text>
          ))}
        </View>

        {/* SVG */}
        <Svg width={W} height={H}>
          {/* Grid */}
          {gridLines.map((g, i) => (
            <Line key={i} x1={0} y1={g.y} x2={W} y2={g.y} stroke={C.border} strokeWidth={0.5} />
          ))}
          {/* Total area + line */}
          <Path d={makeArea(totalPts)} fill={C.pale} opacity={0.2} />
          <Path d={makeLine(totalPts)} stroke={C.pale} strokeWidth={1.5} fill="none" />
          {/* Resolved area + line */}
          <Path d={makeArea(resolvedPts)} fill={C.darkest} opacity={0.15} />
          <Path d={makeLine(resolvedPts)} stroke={C.darkest} strokeWidth={1.5} fill="none" />
        </Svg>
      </View>

      {/* X-axis labels */}
      <View style={{ height: 14, marginLeft: 26, position: 'relative' }}>
        {xLabels.map((d, i) => (
          <Text key={i} style={{
            position: 'absolute',
            left: d.x - 9,
            top: 3,
            fontSize: 6.5,
            color: C.muted,
            width: 22,
            textAlign: 'center',
          }}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface PDFData {
  generatedAt: string
  stats: {
    totalTickets: number; resolvedTickets: number; openTickets: number
    notStartedCount: number; onHoldCount: number
    escalationCount: number; selfSolvableCount: number; outlierCount: number
  }
  byIssueTopic: Array<{ name: string; value: number }>
  byPartner: Array<{ name: string; canFix: number; cannotFix: number }>
  partnerSummary: Array<{ name: string; total: number; canFix: number; cannotFix: number; escalations: number }>
  byStatus: Array<{ name: string; value: number }>
  byUrgency: Array<{ name: string; value: number }>
  byCanUserSolve: Array<{ name: string; value: number }>
  byIssueType: Array<{ name: string; value: number }>
  monthlyTrend: Array<{ month: string; total: number; resolved: number }>
}

// ── Document ──────────────────────────────────────────────────────────────────
function DashboardPDF(data: PDFData) {
  const { stats, generatedAt } = data
  const resolutionRate = stats.totalTickets ? Math.round(stats.resolvedTickets / stats.totalTickets * 100) : 0
  const escalationRate = stats.totalTickets ? (stats.escalationCount / stats.totalTickets * 100).toFixed(1) : '0'
  const selfSolvePct = stats.totalTickets ? Math.round(stats.selfSolvableCount / stats.totalTickets * 100) : 0

  const STATUS_COLORS: Record<string, string> = {
    'Not Started': '#CBD5E1', 'In Progress': '#5C7CA6', 'On Hold': '#94A3B8',
    'Done': '#6B9080', 'Done (L2)': '#6B9080', 'Escalated': '#C23A2B',
  }
  const URGENCY_COLORS: Record<string, string> = { 'High': '#C23A2B', 'Medium': '#C9A66B', 'Low': '#94A3B8', 'Not Specified': '#CBD5E1' }

  return (
    <Document title="TicketFlow Dashboard Report" author="TicketFlow" creator="TicketFlow">

      {/* ── PAGE 1: Overview + Partner Analysis ── */}
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerTitle}>TicketFlow</Text>
            <Text style={s.headerSub}>L1 Support — Dashboard Report</Text>
          </View>
          <Text style={s.headerDate}>Generated {generatedAt}</Text>
        </View>

        {/* KPI Row 1 */}
        <View style={s.kpiRow} wrap={false}>
          <KpiCard label="Total Tickets" value={stats.totalTickets.toLocaleString()} />
          <KpiCard label="Resolved" value={`${resolutionRate}%`} sub={`${stats.resolvedTickets.toLocaleString()} tickets`} accent={C.darkest} />
          <KpiCard label="Not Yet Started" value={stats.notStartedCount.toLocaleString()} sub="Awaiting action" accent={C.gold} />
          <KpiCard label="On Hold" value={stats.onHoldCount.toLocaleString()} sub="Paused" accent={C.mid} />
          <KpiCard label="Escalation Rate" value={`${escalationRate}%`} sub={`${stats.escalationCount} escalated`} accent={C.red} />
          <KpiCard label="User Can Fix" value={`${selfSolvePct}%`} sub={`${stats.selfSolvableCount.toLocaleString()} tickets`} accent={C.dark} />
        </View>

        {/* Partner Analysis */}
        <SectionHeader
          title="Partner Analysis"
          desc="Ticket volume per design partner — stacked by user self-service potential (can fix / cannot fix)"
        />

        <View style={s.chartCard} wrap={false}>
          <Text style={s.chartTitle}>Tickets by Design Partner — Can User Fix?</Text>
          <Text style={s.chartSub}>Gold = user can fix · Dark = cannot fix · numbers show can-fix / total</Text>
          {/* Legend */}
          <View style={s.legendRow}>
            {[['User can fix', C.gold], ['Cannot fix', C.darkest]].map(([label, color]) => (
              <View key={label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: color }]} />
                <Text style={s.legendLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <StackedPartnerChart data={data.byPartner.slice(0, 12)} />
        </View>

        {/* Partner Summary Table */}
        <View style={[s.chartCard, { padding: 0 }]} wrap={false}>
          <View style={{ padding: '10 12', borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={s.chartTitle}>Partner Summary</Text>
            <Text style={s.chartSub}>Ranked by total ticket volume</Text>
          </View>
          <View style={s.tableHead}>
            {['Partner', 'Tickets', 'Can Fix', 'Cannot Fix', '% Can Fix', 'Escalations'].map((h, i) => (
              <Text key={h} style={[s.th, { flex: i === 0 ? 2.5 : 1, textAlign: i === 0 ? 'left' : 'right' }]}>{h}</Text>
            ))}
          </View>
          {data.partnerSummary.slice(0, 10).map((p, i) => {
            const canFixPct = p.total ? Math.round(p.canFix / p.total * 100) : 0
            return (
              <View key={p.name} style={[s.tableRow, { backgroundColor: i % 2 === 1 ? C.bg : C.card }]}>
                <Text style={[s.tdBold, { flex: 2.5 }]}>{p.name.length > 28 ? p.name.slice(0, 28) + '…' : p.name}</Text>
                <Text style={[s.tdBold, { flex: 1, textAlign: 'right' }]}>{p.total}</Text>
                <Text style={[s.td, { flex: 1, textAlign: 'right', color: C.dark }]}>{p.canFix}</Text>
                <Text style={[s.td, { flex: 1, textAlign: 'right', color: C.darkest }]}>{p.cannotFix}</Text>
                <Text style={[s.td, { flex: 1, textAlign: 'right' }]}>{canFixPct}%</Text>
                <Text style={[s.td, { flex: 1, textAlign: 'right', color: p.escalations > 0 ? C.red : C.muted, fontFamily: p.escalations > 0 ? 'Helvetica-Bold' : 'Helvetica' }]}>
                  {p.escalations > 0 ? p.escalations : '—'}
                </Text>
              </View>
            )
          })}
        </View>

      </Page>

      {/* ── PAGE 2: Issue Intelligence + Breakdowns + Trend ── */}
      <Page size="A4" style={s.page}>

        {/* Header (smaller repeat) */}
        <View style={[s.header, { padding: '10 18', marginBottom: 16 }]}>
          <Text style={[s.headerTitle, { fontSize: 13 }]}>TicketFlow — Dashboard Report</Text>
          <Text style={s.headerDate}>Page 2  ·  {generatedAt}</Text>
        </View>

        {/* Issue Intelligence */}
        <SectionHeader
          title="Issue Intelligence"
          desc="Most frequently reported issues and user self-service potential"
        />

        <View style={[s.twoCol, { marginBottom: 10 }]} wrap={false}>
          {/* Top Issue Topics */}
          <View style={[s.chartCard, s.col]}>
            <Text style={s.chartTitle}>Top Issue Topics</Text>
            <Text style={s.chartSub}>Most reported issues across all partners</Text>
            <HBarChart
              data={data.byIssueTopic.slice(0, 10)}
              colors={SCALE}
              labelWidth={110}
            />
          </View>

          {/* Can User Solve */}
          <View style={[s.chartCard, s.col]}>
            <Text style={s.chartTitle}>Can User Solve?</Text>
            <Text style={s.chartSub}>Self-service potential breakdown</Text>
            <HBarChart
              data={data.byCanUserSolve}
              colors={[C.darkest, C.gold, C.pale, C.muted]}
              labelWidth={60}
            />
            {/* Stats grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border }}>
              {data.byCanUserSolve.map(d => (
                <View key={d.name} style={{ flexDirection: 'row', justifyContent: 'space-between', width: '47%' }}>
                  <Text style={{ fontSize: 7, color: C.muted }}>{d.name}</Text>
                  <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.fg }}>
                    {d.value} ({stats.totalTickets ? Math.round(d.value / stats.totalTickets * 100) : 0}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Status, Urgency, Issue Type */}
        <SectionHeader
          title="Status & Urgency Breakdown"
          desc="Current state and priority distribution across all tickets"
        />

        <View style={[s.twoCol, { marginBottom: 10 }]} wrap={false}>
          <View style={[s.chartCard, s.col]}>
            <Text style={s.chartTitle}>Ticket Status</Text>
            <Text style={s.chartSub}>Current status of all tickets</Text>
            <HBarChart
              data={data.byStatus}
              colors={data.byStatus.map(d => STATUS_COLORS[d.name] ?? C.gold)}
              labelWidth={80}
            />
          </View>

          <View style={[s.chartCard, s.col]}>
            <Text style={s.chartTitle}>Urgency Distribution</Text>
            <Text style={s.chartSub}>Priority levels across all tickets</Text>
            <HBarChart
              data={data.byUrgency}
              colors={data.byUrgency.map(d => URGENCY_COLORS[d.name] ?? C.gold)}
              labelWidth={80}
            />
            {/* Issue Type below urgency */}
            <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
              <Text style={[s.chartTitle, { marginBottom: 8 }]}>Issue Type</Text>
              {data.byIssueType.map((d, i) => (
                <View key={d.name} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 1, backgroundColor: i === 0 ? C.gold : C.darkest }} />
                    <Text style={{ fontSize: 8, color: C.muted }}>{d.name}</Text>
                  </View>
                  <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.fg }}>
                    {d.value} ({stats.totalTickets ? Math.round(d.value / stats.totalTickets * 100) : 0}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Monthly Trend */}
        <SectionHeader
          title="Monthly Volume Trend"
          desc="Tickets logged and resolved per month over the last 18 months"
        />

        <View style={s.chartCard} wrap={false}>
          <Text style={s.chartTitle}>Ticket Volume & Resolution Over Time</Text>
          {/* Legend */}
          <View style={[s.legendRow, { marginBottom: 10 }]}>
            {[['Total Logged', C.pale], ['Resolved', C.darkest]].map(([label, color]) => (
              <View key={label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: color, width: 12 }]} />
                <Text style={s.legendLabel}>{label}</Text>
              </View>
            ))}
          </View>
          <TrendChart data={data.monthlyTrend} />
        </View>

      </Page>
    </Document>
  )
}

// ── Route handler ─────────────────────────────────────────────────────────────
type MonthRow = { month: string; total: bigint; resolved: bigint }

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    totalTickets, resolvedTickets, openTickets,
    escalationCount, selfSolvableCount, outlierCount,
    notStartedCount, onHoldCount,
    byIssueTopicRaw, byPartnerBreakdownRaw, byPartnerStatusRaw,
    byStatusRaw, byUrgencyRaw, byCanUserSolveRaw, byIssueTypeRaw,
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
    prisma.ticket.groupBy({ by: ['designPartner', 'canUserSolve'], where: { isValidTicket: true, archivedAt: null }, _count: true }),
    prisma.ticket.groupBy({ by: ['designPartner', 'status'], where: { isValidTicket: true, archivedAt: null }, _count: true }),
    prisma.ticket.groupBy({ by: ['status'], where: { isValidTicket: true, archivedAt: null }, _count: true }),
    prisma.ticket.groupBy({ by: ['urgency'], where: { isValidTicket: true, archivedAt: null }, _count: true }),
    prisma.ticket.groupBy({ by: ['canUserSolve'], where: { isValidTicket: true, archivedAt: null }, _count: true }),
    prisma.ticket.groupBy({ by: ['issueType'], where: { isValidTicket: true, archivedAt: null }, _count: true }),
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

  // Build partner breakdown
  const partnerCF: Record<string, { canFix: number; cannotFix: number }> = {}
  for (const row of byPartnerBreakdownRaw) {
    if (!partnerCF[row.designPartner]) partnerCF[row.designPartner] = { canFix: 0, cannotFix: 0 }
    if (row.canUserSolve === 'YES' || row.canUserSolve === 'PARTIALLY') partnerCF[row.designPartner].canFix += row._count
    else partnerCF[row.designPartner].cannotFix += row._count
  }
  const partnerEsc: Record<string, number> = {}
  for (const row of byPartnerStatusRaw) {
    if (row.status === 'ESCALATED_TO_L2') partnerEsc[row.designPartner] = (partnerEsc[row.designPartner] ?? 0) + row._count
  }
  const partnerSummary = Object.entries(partnerCF)
    .map(([name, { canFix, cannotFix }]) => ({ name, total: canFix + cannotFix, canFix, cannotFix, escalations: partnerEsc[name] ?? 0 }))
    .sort((a, b) => b.total - a.total)
  const byPartner = partnerSummary.map(p => ({ name: p.name, canFix: p.canFix, cannotFix: p.cannotFix }))

  const STATUS_LABELS: Record<string, string> = {
    NOT_YET_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', ON_HOLD: 'On Hold',
    DONE: 'Done', DONE_BY_L2: 'Done (L2)', ESCALATED_TO_L2: 'Escalated',
  }
  const URGENCY_ORDER = ['High', 'Medium', 'Low', 'Not Specified']
  const URGENCY_LABELS: Record<string, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }
  const CAN_FIX_LABELS: Record<string, string> = { YES: 'Yes', NO: 'No', UNKNOWN: 'Unknown', PARTIALLY: 'Partially' }

  const pdfData: PDFData = {
    generatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    stats: { totalTickets, resolvedTickets, openTickets, notStartedCount, onHoldCount, escalationCount, selfSolvableCount, outlierCount },
    byIssueTopic: byIssueTopicRaw.map(d => ({ name: d.issueTopic ?? 'Other', value: d._count })),
    byPartner,
    partnerSummary,
    byStatus: byStatusRaw.map(d => ({ name: STATUS_LABELS[d.status] ?? d.status, value: d._count })),
    byUrgency: byUrgencyRaw
      .map(d => ({ name: URGENCY_LABELS[d.urgency] ?? d.urgency, value: d._count }))
      .sort((a, b) => URGENCY_ORDER.indexOf(a.name) - URGENCY_ORDER.indexOf(b.name)),
    byCanUserSolve: byCanUserSolveRaw.map(d => ({ name: CAN_FIX_LABELS[d.canUserSolve] ?? d.canUserSolve, value: d._count })),
    byIssueType: byIssueTypeRaw.map(d => ({ name: d.issueType === 'MARLIN_ISSUE' ? 'Marlin' : 'Comsof', value: d._count })),
    monthlyTrend: monthlyRaw.map(r => ({ month: r.month, total: Number(r.total), resolved: Number(r.resolved) })),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(DashboardPDF, pdfData) as any)
  const timestamp = new Date().toISOString().substring(0, 10)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticketflow-dashboard-${timestamp}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
