import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const solutions = await prisma.solution.findMany({
    orderBy: { title: 'asc' },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { tickets: true } },
    },
  })

  return NextResponse.json(solutions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const createdById = (session.user as any)?.id
  if (!createdById) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, category } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const solution = await prisma.solution.create({
    data: {
      title: title.trim(),
      description: description?.trim() || undefined,
      category: category?.trim() || undefined,
      createdById,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(solution, { status: 201 })
}
