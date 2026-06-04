import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if ('title' in body) data.title = body.title?.trim()
  if ('description' in body) data.description = body.description?.trim() || null
  if ('category' in body) data.category = body.category?.trim() || null

  if (!data.title) {
    return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
  }

  try {
    const solution = await prisma.solution.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, name: true } } },
    })
    return NextResponse.json(solution)
  } catch {
    return NextResponse.json({ error: 'Solution not found' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    // Unlink tickets before deleting
    await prisma.ticket.updateMany({
      where: { solutionId: id },
      data: { solutionId: null },
    })
    await prisma.solution.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Solution not found' }, { status: 404 })
  }
}
