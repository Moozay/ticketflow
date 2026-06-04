import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import * as XLSX from 'xlsx'

function formatDate(date: Date | null | undefined): string {
  if (!date) return ''
  return new Date(date).toISOString().substring(0, 10)
}

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tickets = await prisma.ticket.findMany({
    where: { isValidTicket: true, archivedAt: null },
    include: { engineer: { select: { name: true } } },
    orderBy: { startDate: 'desc' },
  })

  const rows = tickets.map(t => ({
    'Ticket Number':        t.ticketNumber,
    'Start Date':           formatDate(t.startDate),
    'Actual End':           formatDate(t.actualEnd),
    'Engineer':             t.engineer.name,
    'Design Partner':       t.designPartner,
    'Subcontractor':        t.subcontractor ?? '',
    'Category':             t.category,
    'Issue Type':           t.issueType,
    'Urgency':              t.urgency,
    'Status':               t.status,
    'POP Zone':             t.popZone,
    'Issue Topic':          t.issueTopic ?? '',
    'Solution Topic':       t.solutionTopic ?? '',
    'Description':          t.description ?? '',
    'Is Resolved':          ['DONE', 'DONE_BY_L2'].includes(t.status) ? 'Yes' : 'No',
    'Can User Solve':       t.canUserSolve,
    'Documentation Status': t.documentationStatus,
    'Is Outlier':           t.isOutlier ? 'Yes' : 'No',
    'Is Escalated':         t.status === 'ESCALATED_TO_L2' ? 'Yes' : 'No',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 20 },
    { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 18 },
    { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 50 },
    { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tickets')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const timestamp = new Date().toISOString().substring(0, 10)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=tickets-export-${timestamp}.xlsx`,
    },
  })
}
