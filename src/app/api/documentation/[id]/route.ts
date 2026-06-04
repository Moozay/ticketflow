import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}

  if ('title' in body) {
    if (!body.title?.trim()) return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
    data.title = body.title.trim()
  }
  if ('url' in body) {
    if (!body.url?.trim()) return NextResponse.json({ error: 'URL cannot be empty' }, { status: 400 })
    try { new URL(body.url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    data.url = body.url.trim()
  }
  if ('section' in body) data.section = body.section?.trim() || null
  if ('description' in body) data.description = body.description?.trim() || null
  if ('order' in body) data.order = typeof body.order === 'number' ? body.order : parseInt(body.order) || 0

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  try {
    const doc = await prisma.documentation.update({ where: { id }, data })
    return NextResponse.json(doc)
  } catch {
    return NextResponse.json({ error: 'Documentation link not found' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  const { id } = await params

  try {
    await prisma.documentation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Documentation link not found' }, { status: 404 })
  }
}
