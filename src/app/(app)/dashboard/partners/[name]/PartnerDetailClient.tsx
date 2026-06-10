'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import { formatDate } from '@/lib/utils'

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  gold: '#5C7CA6', mid: '#6B9080', deep: '#C9A66B', dark: '#C23A2B',
  darker: '#94A3B8', darkest: '#3E5C7E', pale: '#A7BED6', lightest: '#D5E0EC',
}
const SCALE = [C.gold, C.mid, C.deep, C.dark, C.darker, C.darkest, C.pale, C.lightest, '#7C93AD', '#C0D2E2']

const STATUS_COLORS: Record<string, string> = {
  'Not Started': '#CBD5E1', 'In Progress': '#5C7CA6', 'On Hold': '#94A3B8',
  'Done': '#6B9080', 'Done (L2)': '#6B9080', 'Escalated': '#C23A2B',
}
const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  NOT_YET_STARTED: { bg: '#f5f5f5', color: '#737373' },
  IN_PROGRESS:     { bg: '#eff6ff', color: '#2563eb' },
  ON_HOLD:         { bg: '#f1f5f9', color: '#64748b' },
  DONE:            { bg: '#ecfdf5', color: '#047857' },
  DONE_BY_L2:      { bg: '#ecfdf5', color: '#047857' },
  ESCALATED_TO_L2: { bg: '#fffbeb', color: '#b45309' },
}
const URGENCY_BADGE: Record<string, { bg: string; color: string }> = {
  HIGH:          { bg: '#fef2f2', color: '#dc2626' },
  MEDIUM:        { bg: '#fffbeb', color: '#b45309' },
  LOW:           { bg: '#f1f5f9', color: '#64748b' },
  NOT_SPECIFIED: { bg: '#f5f5f5', color: '#737373' },
}
const URGENCY_COLORS: Record<string, string> = {
  'High': '#C23A2B', 'Medium': '#C9A66B', 'Low': '#94A3B8', 'Not Specified': '#CBD5E1',
}
const CAN_FIX_COLORS: Record<string, string> = {
  'Yes': '#6B9080', 'Partially': '#C9A66B', 'No': '#C23A2B', 'Unknown': '#CBD5E1',
}
const DOC_COLORS: Record<string, string> = {
  'Already Exists': C.darkest, 'Created': C.darker, 'Will Create': C.deep,
  'Not Needed': C.mid, 'Unknown': C.lightest,
}
const STATUS_LABEL: Record<string, string> = {
  NOT_YET_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', ON_HOLD: 'On Hold',
  DONE: 'Done', DONE_BY_L2: 'Done (L2)', ESCALATED_TO_L2: 'Escalated',
}
const CAN_FIX_LABEL: Record<string, string> = {
  YES: 'Yes', NO: 'No',
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Ticket {
  id: string; ticketNumber: string; startDate: string; actualEnd: string | null
  issueTopic: string | null; status: string; urgency: string
  canUserSolve: string; description: string | null
}
interface Props {
  isExtern?: boolean
  partnerName: string
  stats: {
    totalTickets: number; resolvedCount: number; escalationCount: number
    selfSolvableCount: number
  }
  byIssueTopic: { name: string; value: number }[]
  byStatus: { name: string; value: number }[]
  byUrgency: { name: string; value: number }[]
  byCanUserSolve: { name: string; value: number }[]
  byDocStatus: { name: string; value: number }[]
  monthlyTrend: { month: string; total: number; resolved: number }[]
  tickets: Ticket[]
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, highlight }: {
  label: string; value: string | number; sub?: string; accent?: string; highlight?: boolean
}) {
  return (
    <div style={{
      background: highlight ? C.darkest : 'var(--card)',
      border: `1px solid ${highlight ? C.darker : 'var(--border)'}`,
      borderRadius: '12px', padding: '20px 22px',
    }}>
      <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: highlight ? C.pale : 'var(--muted-foreground)', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '30px', fontWeight: 700, color: highlight ? '#fff' : (accent ?? 'var(--foreground)'), lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: highlight ? C.gold : 'var(--muted-foreground)', marginTop: '6px' }}>{sub}</p>}
    </div>
  )
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', marginBottom: sub ? '2px' : '16px' }}>{title}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '16px' }}>{sub}</p>}
      {children}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: '2px solid var(--border)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '2px' }}>{title}</h2>
        <p style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{description}</p>
      </div>
      {children}
    </div>
  )
}

function Badge({ label, style }: { label: string; style: { bg: string; color: string } }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '5px',
      fontSize: '11px', fontWeight: 600, background: style.bg, color: style.color, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────
const SimpleTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: '0 4px 14px rgba(15,23,42,0.10)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px' }}>
      <p style={{ fontWeight: 600, marginBottom: '2px' }}>{label}</p>
      <p style={{ color: C.gold }}>{payload[0].value.toLocaleString()} tickets</p>
    </div>
  )
}

const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const total = payload.find((p: any) => p.dataKey === 'total')?.value ?? 0
  const resolved = payload.find((p: any) => p.dataKey === 'resolved')?.value ?? 0
  return (
    <div style={{ background: '#fff', color: 'var(--foreground)', border: '1px solid var(--border)', boxShadow: '0 4px 14px rgba(15,23,42,0.10)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
      <p style={{ fontWeight: 700, marginBottom: '6px' }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
        <span style={{ color: C.pale }}>Total</span><span style={{ fontWeight: 600 }}>{total}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
        <span style={{ color: C.gold }}>Resolved</span><span style={{ fontWeight: 600 }}>{resolved}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
        <span style={{ color: 'var(--muted-foreground)' }}>Rate</span>
        <span style={{ fontWeight: 600 }}>{total ? Math.round(resolved / total * 100) : 0}%</span>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PartnerDetailClient({
  isExtern, partnerName, stats, byIssueTopic, byStatus, byUrgency,
  byCanUserSolve, byDocStatus, monthlyTrend, tickets,
}: Props) {
  const resolutionRate = stats.totalTickets ? Math.round(stats.resolvedCount / stats.totalTickets * 100) : 0
  const escalationRate = stats.totalTickets ? (stats.escalationCount / stats.totalTickets * 100).toFixed(1) : '0'
  const selfSolvePct = stats.totalTickets ? Math.round(stats.selfSolvableCount / stats.totalTickets * 100) : 0

  const [canFixFilter, setCanFixFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL')
  const filteredTickets = canFixFilter === 'ALL' ? tickets : tickets.filter(t => t.canUserSolve === canFixFilter)

  const axisStyle = { fontSize: 11, fill: 'var(--muted-foreground)' }


  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--muted-foreground)', textDecoration: 'none', marginBottom: '12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Partner Report</p>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)' }}>{partnerName}</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
            {stats.totalTickets.toLocaleString()} total tickets · All time
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '32px' }}>
        <KpiCard label="Total Tickets" value={stats.totalTickets.toLocaleString()} highlight />
        <KpiCard label="Resolution Rate" value={`${resolutionRate}%`} sub={`${stats.resolvedCount.toLocaleString()} resolved`} accent={C.dark} />
        <KpiCard label="Escalations" value={stats.escalationCount} sub={`${escalationRate}% escalation rate`} accent={stats.escalationCount > 0 ? '#C23A2B' : C.dark} />
        <KpiCard label="User Can Fix" value={`${selfSolvePct}%`} sub={`${stats.selfSolvableCount.toLocaleString()} tickets`} accent={C.mid} />
      </div>


      {/* Issue Distribution */}
      <Section
        title="Issue Distribution"
        description="Most frequently submitted issue topics from this partner — ranked by volume"
      >
        <ChartCard title={`Top Issue Topics — ${partnerName}`} sub="Horizontal bar = ticket count per issue topic">
          <ResponsiveContainer width="100%" height={byIssueTopic.length * 32 + 20}>
            <BarChart layout="vertical" data={byIssueTopic} margin={{ left: 4, right: 50, top: 4, bottom: 4 }}>
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={axisStyle} width={160} axisLine={false} tickLine={false}
                tickFormatter={(v: string) => v.length > 25 ? v.slice(0, 25) + '…' : v} />
              <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'var(--muted)' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {byIssueTopic.map((_, i) => <Cell key={i} fill={SCALE[i % SCALE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Section>

      {/* Can User Solve + Status */}
      <Section
        title="Self-Service Potential & Status"
        description="Can users resolve these issues without engineer involvement? And what is the current resolution status?"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <ChartCard title="Can User Solve?" sub="Training & documentation opportunity breakdown">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart layout="vertical" data={byCanUserSolve} margin={{ left: 4, right: 60, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ ...axisStyle, fontWeight: 600 }} width={70} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {byCanUserSolve.map(d => <Cell key={d.name} fill={CAN_FIX_COLORS[d.name] ?? C.gold} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
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

          <ChartCard title="Ticket Status" sub="Current resolution state of all tickets">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart layout="vertical" data={byStatus} margin={{ left: 4, right: 60, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={axisStyle} width={90} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'var(--muted)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {byStatus.map(d => <Cell key={d.name} fill={STATUS_COLORS[d.name] ?? C.gold} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </Section>

      {/* Monthly Trend */}
      <Section
        title="Monthly Volume Trend"
        description="Ticket submission and resolution over time — identify peaks, seasonal patterns, and improvement trends."
      >
        <ChartCard title="Monthly Tickets — Total vs Resolved" sub="Shaded area = total logged  |  Filled area = resolved">
          <div style={{ display: 'flex', gap: '24px', marginBottom: '8px' }}>
            {[['Total Logged', C.pale], ['Resolved', C.darkest]].map(([label, color]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                <span style={{ width: 12, height: 4, borderRadius: 2, background: color as string, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyTrend} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="pTotalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.pale} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={C.pale} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pResolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.darkest} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={C.darkest} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: C.gold, strokeWidth: 1 }} />
              <Area type="monotone" dataKey="total" stroke={C.pale} strokeWidth={2} fill="url(#pTotalGrad)" dot={false} />
              <Area type="monotone" dataKey="resolved" stroke={C.darkest} strokeWidth={2} fill="url(#pResolvedGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </Section>

      {/* Ticket List */}
      <Section
        title={`All Tickets (${filteredTickets.length}${canFixFilter !== 'ALL' ? ` of ${tickets.length}` : ''})`}
        description="Complete ticket list for this partner — click any ticket to view full details"
      >
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {(['ALL', 'YES', 'NO'] as const).map(v => (
            <button
              key={v}
              onClick={() => setCanFixFilter(v)}
              style={{
                padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                border: `1px solid ${canFixFilter === v ? C.gold : 'var(--border)'}`,
                background: canFixFilter === v ? C.gold : 'transparent',
                color: canFixFilter === v ? '#fff' : 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              {v === 'ALL' ? `All (${tickets.length})` : v === 'YES' ? `Can Fix (${tickets.filter(t => t.canUserSolve === 'YES').length})` : `Cannot Fix (${tickets.filter(t => t.canUserSolve === 'NO').length})`}
            </button>
          ))}
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '520px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ background: 'var(--muted)' }}>
                  {['Ticket #', 'Date', 'Issue Topic', 'Status', 'Urgency', 'Can Fix'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontWeight: 700,
                      fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: 'var(--muted-foreground)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t, i) => {
                  const statusStyle = STATUS_BADGE[t.status] ?? STATUS_BADGE.NOT_YET_STARTED
                  const urgencyStyle = URGENCY_BADGE[t.urgency] ?? URGENCY_BADGE.NOT_SPECIFIED
                  return (
                    <tr
                      key={t.id}
                      style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 1 ? 'var(--muted)' : 'transparent' }}
                    >
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {isExtern ? (
                          <span style={{ fontWeight: 700, color: 'var(--foreground)', fontFamily: 'monospace', fontSize: '12px' }}>
                            {t.ticketNumber}
                          </span>
                        ) : (
                          <Link href={`/tickets/${t.id}`} style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', fontFamily: 'monospace', fontSize: '12px' }}>
                            {t.ticketNumber}
                          </Link>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', fontSize: '12px' }}>
                        {formatDate(t.startDate)}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--foreground)', maxWidth: '220px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.issueTopic ?? ''}>
                          {t.issueTopic ?? <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <Badge label={STATUS_LABEL[t.status] ?? t.status} style={statusStyle} />
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <Badge label={t.urgency.replace(/_/g, ' ')} style={urgencyStyle} />
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                        {CAN_FIX_LABEL[t.canUserSolve] ?? t.canUserSolve}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

    </div>
  )
}
