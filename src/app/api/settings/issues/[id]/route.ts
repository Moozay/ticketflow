import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, description } = await req.json()
  const item = await prisma.issueTopic.update({
    where: { id },
    data: { name: name.trim(), description: description?.trim() || null },
  })
  return NextResponse.json(item)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.issueTopic.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
