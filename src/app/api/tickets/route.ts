import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const q = searchParams.get('q')
  const status = searchParams.get('status')
  const partner = searchParams.get('partner')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('perPage') ?? '30')))
  const skip = (page - 1) * perPage

  const where: Record<string, unknown> = { isValidTicket: true, archivedAt: null }

  if (q) {
    where.OR = [
      { ticketNumber: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { designPartner: { contains: q, mode: 'insensitive' } },
      { popZone: { contains: q, mode: 'insensitive' } },
      { issueTopic: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (status) where.status = status
  if (partner) where.designPartner = partner

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: { engineer: { select: { id: true, name: true } } },
      orderBy: { startDate: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.ticket.count({ where }),
  ])

  return NextResponse.json({ tickets, total, page, perPage, totalPages: Math.ceil(total / perPage) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const {
    ticketNumber,
    startDate,
    estimatedEnd,
    actualEnd,
    category,
    issueType,
    urgency,
    status,
    popZone,
    designPartner,
    subcontractor,
    description,
    canUserSolve,
    documentationStatus,
    solutionId,
    engineerId,
    isValidTicket,
    isOutlier,
    issueTopic,
    solutionTopic,
    documentationIds,
  } = body

  if (!ticketNumber || !startDate || !category || !issueType || !popZone || !designPartner || !engineerId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if ((status === 'DONE' || status === 'DONE_BY_L2') && !issueTopic) {
    return NextResponse.json({ error: 'Issue Topic is required when status is Done.' }, { status: 400 })
  }
  if ((status === 'DONE' || status === 'DONE_BY_L2') && !actualEnd) {
    return NextResponse.json({ error: 'Actual End date is required when status is Done.' }, { status: 400 })
  }
  if ((status === 'DONE' || status === 'DONE_BY_L2') && (!documentationStatus || documentationStatus === 'UNKNOWN')) {
    return NextResponse.json({ error: 'Documentation Status is required when status is Done.' }, { status: 400 })
  }
  if (status === 'ON_HOLD' && !description?.trim()) {
    return NextResponse.json({ error: 'Description is required to justify why the ticket is On Hold.' }, { status: 400 })
  }

  if (status === 'ESCALATED_TO_L2' && !description?.includes('atlassian.net')) {
    return NextResponse.json({ error: 'A Jira ticket link (atlassian.net) is required in the description when escalating to L2.' }, { status: 400 })
  }

  const docIdList: string[] = documentationIds
    ? String(documentationIds).split(',').map((s: string) => s.trim()).filter(Boolean)
    : []

  try {
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        startDate: new Date(startDate),
        estimatedEnd: estimatedEnd ? new Date(estimatedEnd) : undefined,
        actualEnd: actualEnd ? new Date(actualEnd) : undefined,
        category,
        issueType,
        urgency: urgency ?? 'NOT_SPECIFIED',
        status: status ?? 'NOT_YET_STARTED',
        popZone,
        designPartner,
        subcontractor: subcontractor ?? '',
        description: description ?? undefined,
        canUserSolve: canUserSolve ?? 'NO',
        documentationStatus: documentationStatus ?? 'UNKNOWN',
        solutionId: solutionId || undefined,
        documentations: docIdList.length ? { connect: docIdList.map(id => ({ id })) } : undefined,
        engineerId,
        isValidTicket: isValidTicket ?? true,
        isOutlier: isOutlier ?? false,
        issueTopic: issueTopic ?? undefined,
        solutionTopic: solutionTopic ?? undefined,
      },
      include: { engineer: { select: { id: true, name: true } } },
    })
    return NextResponse.json(ticket, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    if (msg.includes('Unique constraint') && msg.includes('ticketNumber')) {
      return NextResponse.json({ error: 'Ticket number already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
