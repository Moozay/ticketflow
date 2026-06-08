'use client'

import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import ExportMenu from './ExportMenu'

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  gold:    '#d4a853',
  mid:     '#b8934a',
  deep:    '#a07d3e',
  dark:    '#8a6b34',
  darker:  '#735a2b',
  darkest: '#5c4822',
  pale:    '#e0bc6a',
  lightest:'#f0d8a0',
}

const BROWN_SCALE = [C.gold, C.mid, C.deep, C.dark, C.darker, C.darkest, C.pale, C.lightest, '#c49840', '#4a3a1c']

// ─── Types ────────────────────────────────────────────────────────────────────
interface PartnerSummary {
  name: string; total: number; canFix: number; cannotFix: number
  escalations: number
}
interface Props {
  stats: {
    totalTickets: number; resolvedTickets: number; openTickets: number
    notStartedCount: number; onHoldCount: number
    escalationCount: number; selfSolvableCount: number; outlierCount: number
  }
  byIssueTopic: { name: string; value: number }[]
  byPartner: { name: string; canFix: number; cannotFix: number }[]
  partnerSummary: PartnerSummary[]
  byStatus: { name: string; value: number }[]
  byUrgency: { name: string; value: number }[]
  byCanUserSolve: { name: string; value: number }[]
  byIssueType: { name: string; value: number }[]
  byEngineer: { name: string; value: number }[]
  monthlyTrend: { month: string; total: number; resolved: number }[]
}

// ─── Shared components ────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '32px', fontWeight: 700, color: accent ?? 'var(--foreground)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '6px' }}>{sub}</p>}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '36px' }}>
      <div style={{ marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid var(--border)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '2px' }}>{title}</h2>
        <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>{description}</p>
      </div>
      {children}
    </div>
  )
}

function ChartCard({ title, sub, children, full }: { title: string; sub?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px',
      padding: '20px', gridColumn: full ? '1 / -1' : undefined,
    }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', marginBottom: sub ? '2px' : '16px' }}>{title}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>{sub}</p>}
      {children}
    </div>
  )
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: '6px', background: 'var(--muted)', borderRadius: '3px', width: '60px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
    </div>
  )
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────
const SimpleTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--sidebar-bg)', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}>
      <p style={{ fontWeight: 600, marginBottom: '2px' }}>{label}</p>
      <p style={{ color: C.gold }}>{payload[0].value.toLocaleString()} tickets</p>
    </div>
  )
}

const StackedPartnerTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const canFix = payload.find((p: any) => p.dataKey === 'canFix')?.value ?? 0
  const cannotFix = payload.find((p: any) => p.dataKey === 'cannotFix')?.value ?? 0
  const total = canFix + cannotFix
  return (
    <div style={{ background: 'var(--sidebar-bg)', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', minWidth: '180px' }}>
      <p style={{ fontWeight: 700, marginBottom: '8px', maxWidth: '200px' }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
        <span style={{ color: C.gold }}>● User can fix</span>
        <span style={{ fontWeight: 600 }}>{canFix} ({total ? Math.round(canFix / total * 100) : 0}%)</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span style={{ color: C.pale }}>● Cannot fix</span>
        <span style={{ fontWeight: 600 }}>{cannotFix} ({total ? Math.round(cannotFix / total * 100) : 0}%)</span>
      </div>
    </div>
  )
}

const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.find((p: any) => p.dataKey === 'total')?.value ?? 0
  const resolved = payload.find((p: any) => p.dataKey === 'resolved')?.value ?? 0
  return (
    <div style={{ background: 'var(--sidebar-bg)', color: '#fff', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
      <p style={{ fontWeight: 700, marginBottom: '6px' }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
        <span style={{ color: C.pale }}>Total</span>
        <span style={{ fontWeight: 600 }}>{total}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
        <span style={{ color: C.gold }}>Resolved</span>
        <span style={{ fontWeight: 600 }}>{resolved}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
        <span style={{ color: '#aaa' }}>Rate</span>
        <span style={{ fontWeight: 600 }}>{total ? Math.round(resolved / total * 100) : 0}%</span>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardClient({
  stats, byIssueTopic, byPartner, partnerSummary,
  byStatus, byUrgency, byCanUserSolve, byIssueType,
  byEngineer, monthlyTrend,
}: Props) {
  const router = useRouter()
  const resolutionRate = stats.totalTickets ? Math.round(stats.resolvedTickets / stats.totalTickets * 100) : 0
  const escalationRate = stats.totalTickets ? (stats.escalationCount / stats.totalTickets * 100).toFixed(1) : '0'
  const selfSolvePct = stats.totalTickets ? Math.round(stats.selfSolvableCount / stats.totalTickets * 100) : 0

  const STATUS_COLORS: Record<string, string> = {
    'Not Started': C.lightest, 'In Progress': C.gold, 'On Hold': C.mid,
    'Done': C.darkest, 'Done (L2)': C.darker, 'Escalated': '#8b0000',
  }
  const URGENCY_COLORS: Record<string, string> = {
    'High': C.darkest, 'Medium': C.dark, 'Low': C.gold,
  }
  const CAN_FIX_COLORS: Record<string, string> = {
    'Yes': C.darkest, 'No': C.gold,
  }

  const axisStyle = { fontSize: 11, fill: 'var(--muted-foreground)' }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '4px' }}>Dashboard</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted-foreground)' }}>
            Comprehensive analysis of ticket activity, user self-service potential, and resolution performance
          </p>
        </div>
        <ExportMenu />
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '36px' }}>
        <KpiCard label="Total Tickets" value={stats.totalTickets.toLocaleString()} />
        <KpiCard label="Resolved" value={`${resolutionRate}%`} sub={`${stats.resolvedTickets.toLocaleString()} tickets`} accent={C.darkest} />
        <KpiCard label="Not Yet Started" value={stats.notStartedCount.toLocaleString()} sub="Awaiting action" accent={C.gold} />
        <KpiCard label="On Hold" value={stats.onHoldCount.toLocaleString()} sub="Paused tickets" accent={C.mid} />
        <KpiCard label="Escalation Rate" value={`${escalationRate}%`} sub={`${stats.escalationCount} escalated`} accent="#8b0000" />
        <KpiCard label="User Can Fix" value={`${selfSolvePct}%`} sub={`${stats.selfSolvableCount.toLocaleString()} tickets`} accent={C.dark} />
      </div>

      {/* ── 1. Partner Analysis ── */}
      <Section
        title="Partner Analysis"
        description="Ticket volume per design partner broken down by user self-service potential"
      >
        {/* Stacked bar */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>Tickets by Design Partner — Can User Fix?</p>
            <div style={{ display: 'flex', gap: '20px' }}>
              {[['User can fix', C.gold], ['Cannot fix', C.darkest]].map(([label, color]) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: color as string, display: 'inline-block' }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={byPartner.length * 34 + 20}>
            <BarChart
              layout="vertical"
              data={byPartner}
              margin={{ left: 4, right: 40, top: 4, bottom: 4 }}
              style={{ cursor: 'pointer' }}
              onClick={(data: any) => {
                if (data?.activeLabel) router.push(`/dashboard/partners/${encodeURIComponent(data.activeLabel)}`)
              }}
            >
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={axisStyle} width={140} axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 20) + '…' : v} />
              <Tooltip content={<StackedPartnerTooltip />} cursor={{ fill: 'var(--muted)' }} />
              <Bar dataKey="canFix" stackId="a" fill={C.gold} radius={[0, 0, 0, 0]} name="Can fix" />
              <Bar dataKey="cannotFix" stackId="a" fill={C.darkest} radius={[0, 4, 4, 0]} name="Cannot fix" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Partner summary table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>Partner Summary</p>
            <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>Ranked by total ticket volume</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--muted)' }}>
                  {['Partner', 'Tickets', 'Can Fix', 'Cannot Fix', '% Can Fix', 'Escalations'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Partner' ? 'left' : 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partnerSummary.map((p, i) => {
                  const canFixPct = p.total ? Math.round(p.canFix / p.total * 100) : 0
                  const escPct = p.total ? (p.escalations / p.total * 100).toFixed(1) : '0'
                  return (
                    <tr key={p.name} style={{ borderBottom: i < partnerSummary.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 1 ? 'var(--muted)' : 'transparent' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--foreground)' }}>
                        <a
                          href={`/dashboard/partners/${encodeURIComponent(p.name)}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'inherit', textDecoration: 'none' }}
                        >
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: BROWN_SCALE[i % BROWN_SCALE.length], flexShrink: 0 }} />
                          <span style={{ borderBottom: `1px solid ${C.gold}` }}>{p.name}</span>
                        </a>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--foreground)' }}>{p.total.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: C.dark }}>{p.canFix.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: C.darkest }}>{p.cannotFix.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          <MiniBar pct={canFixPct} color={C.gold} />
                          <span style={{ fontWeight: 600, color: 'var(--foreground)', minWidth: '30px' }}>{canFixPct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{ color: p.escalations > 0 ? '#8b0000' : 'var(--muted-foreground)', fontWeight: p.escalations > 0 ? 700 : 400 }}>
                          {p.escalations > 0 ? `${p.escalations} (${escPct}%)` : '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ── 2. Issue Intelligence ── */}
      <Section
        title="Issue Intelligence"
        description="What are users reporting? Which issues can they solve themselves — a direct measure of self-service and training opportunity."
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <ChartCard title="Top Issue Topics" sub="Most frequently reported issues across all partners">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart layout="vertical" data={byIssueTopic} margin={{ left: 4, right: 40, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={axisStyle} width={150} axisLine={false} tickLine={false}
                  tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 22) + '…' : v} />
                <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {byIssueTopic.map((_, i) => <Cell key={i} fill={BROWN_SCALE[i % BROWN_SCALE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Can User Solve?" sub="Self-service potential">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart layout="vertical" data={byCanUserSolve} margin={{ left: 4, right: 60, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ ...axisStyle, fontWeight: 600 }} width={70} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {byCanUserSolve.map((d) => <Cell key={d.name} fill={CAN_FIX_COLORS[d.name] ?? C.gold} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {byCanUserSolve.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: CAN_FIX_COLORS[d.name] ?? C.gold, flexShrink: 0 }} />
                    {d.name}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                    {d.value} <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>({stats.totalTickets ? Math.round(d.value / stats.totalTickets * 100) : 0}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </Section>

      {/* ── 3. Monthly Trend ── */}
      <Section
        title="Monthly Volume Trend"
        description="Total tickets logged and tickets resolved per month."
      >
        <ChartCard title="Ticket Volume & Resolution Over Time" sub="Shaded area = total logged  |  Line = resolved">
          <div style={{ display: 'flex', gap: '24px', marginBottom: '8px' }}>
            {[['Total Logged', C.pale], ['Resolved', C.darkest]].map(([label, color]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                <span style={{ width: 12, height: 4, borderRadius: 2, background: color as string, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyTrend} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.pale} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.pale} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.darkest} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={C.darkest} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: C.gold, strokeWidth: 1 }} />
              <Area type="monotone" dataKey="total" stroke={C.pale} strokeWidth={2} fill="url(#totalGrad)" dot={false} />
              <Area type="monotone" dataKey="resolved" stroke={C.darkest} strokeWidth={2} fill="url(#resolvedGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </Section>

      {/* ── 4. Status & Urgency ── */}
      <Section
        title="Status & Urgency Breakdown"
        description="Current state of all open and closed tickets, and how urgency levels are distributed across the portfolio."
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <ChartCard title="Ticket Status" sub="Current status of all tickets">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={byStatus} margin={{ left: 4, right: 50, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={axisStyle} width={90} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {byStatus.map(d => <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? C.gold} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Urgency Distribution" sub="Priority levels across all tickets">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={byUrgency} margin={{ left: 4, right: 50, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={axisStyle} width={90} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {byUrgency.map(d => <Cell key={d.name} fill={URGENCY_COLORS[d.name] ?? C.gold} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Issue Type" sub="Marlin vs Comsof issue origin">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart layout="vertical" data={byIssueType} margin={{ left: 4, right: 50, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ ...axisStyle, fontWeight: 600 }} width={70} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  <Cell fill={C.gold} />
                  <Cell fill={C.darkest} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {byIssueType.map(d => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>{d.name}</span>
                  <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>
                    {d.value} <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>({stats.totalTickets ? Math.round(d.value / stats.totalTickets * 100) : 0}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </Section>


    </div>
  )
}
