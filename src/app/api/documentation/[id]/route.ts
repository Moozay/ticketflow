import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

async function canManage() {
  const session = await auth()
  if (!session) return false
  const role = (session.user as any)?.role
  return role === 'ADMIN' || role === 'ENGINEER'
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canManage())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { title, url, section, description, order } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!url?.trim()) return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  try { new URL(url) } catch { return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 }) }

  const doc = await prisma.documentation.update({
    where: { id },
    data: {
      title: title.trim(),
      url: url.trim(),
      section: section?.trim() || null,
      description: description?.trim() || null,
      order: typeof order === 'number' ? order : 0,
    },
  })

  return NextResponse.json(doc)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await canManage())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await prisma.documentation.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
