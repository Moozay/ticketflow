import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      engineer: { select: { id: true, name: true, email: true } },
      solution: { select: { id: true, title: true, description: true, category: true } },
      attachments: true,
    },
  })

  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ticket)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Whitelist updatable fields
  const allowed = [
    'ticketNumber', 'startDate', 'estimatedEnd', 'actualEnd', 'category',
    'issueType', 'urgency', 'status', 'popZone', 'designPartner', 'subcontractor',
    'description', 'canUserSolve', 'documentationStatus', 'solutionId',
    'engineerId', 'isValidTicket', 'isOutlier',
    'issueTopic', 'solutionTopic', 'archivedAt',
  ]

  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) {
      if ((key === 'startDate' || key === 'estimatedEnd' || key === 'actualEnd') && body[key]) {
        data[key] = new Date(body[key])
      } else if (key === 'solutionId') {
        data[key] = body[key] || null
      } else {
        data[key] = body[key]
      }
    }
  }


  if (data.status === 'DONE' || data.status === 'DONE_BY_L2') {
    const current = await prisma.ticket.findUnique({ where: { id }, select: { issueTopic: true, actualEnd: true, documentationStatus: true } })
    const issueTopic = (data.issueTopic ?? current?.issueTopic) as string | null
    const actualEnd = data.actualEnd ?? current?.actualEnd
    const docStatus = (data.documentationStatus ?? current?.documentationStatus) as string | null
    if (!issueTopic) return NextResponse.json({ error: 'Issue Topic is required when status is Done.' }, { status: 400 })
    if (!actualEnd) return NextResponse.json({ error: 'Actual End date is required when status is Done.' }, { status: 400 })
    if (!docStatus || docStatus === 'UNKNOWN') return NextResponse.json({ error: 'Documentation Status is required when status is Done.' }, { status: 400 })
  }

  if (data.status === 'ON_HOLD') {
    const current = await prisma.ticket.findUnique({ where: { id }, select: { description: true } })
    const description = (data.description ?? current?.description) as string | null
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required to justify why the ticket is On Hold.' }, { status: 400 })
  }

  if (data.status === 'ESCALATED_TO_L2') {
    const description = data.description as string | undefined
    const existing = description == null
      ? (await prisma.ticket.findUnique({ where: { id }, select: { description: true } }))?.description
      : description
    if (!existing?.includes('atlassian.net')) {
      return NextResponse.json({ error: 'A Jira ticket link (atlassian.net) is required in the description when escalating to L2.' }, { status: 400 })
    }
  }

  if ('documentationIds' in body) {
    const ids: string[] = Array.isArray(body.documentationIds)
      ? body.documentationIds
      : String(body.documentationIds).split(',').map((s: string) => s.trim()).filter(Boolean)
    ;(data as any).documentations = { set: ids.map(id => ({ id })) }
  }

  try {
    const ticket = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        engineer: { select: { id: true, name: true } },
        solution: { select: { id: true, title: true } },
        documentations: { select: { id: true, title: true } },
      },
    })
    return NextResponse.json(ticket)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = (session.user as any)?.role
  if (role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { archivedAt: true } })
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  if (!ticket.archivedAt) return NextResponse.json({ error: 'Ticket must be archived before permanent deletion.' }, { status: 400 })

  try {
    await prisma.ticket.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 })
  }
}
