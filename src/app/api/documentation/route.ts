import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const docs = await prisma.documentation.findMany({
    orderBy: [{ section: 'asc' }, { order: 'asc' }],
  })

  return NextResponse.json(docs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as any)?.role
  if (role !== 'ADMIN' && role !== 'ENGINEER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, url, section, description, order } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  const doc = await prisma.documentation.create({
    data: {
      title: title.trim(),
      url: url.trim(),
      section: section?.trim() || null,
      description: description?.trim() || null,
      order: typeof order === 'number' ? order : 0,
    },
  })

  return NextResponse.json(doc, { status: 201 })
}
