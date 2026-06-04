import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name } = await req.json()
  const item = await prisma.partner.update({ where: { id }, data: { name: name.trim() } })
  return NextResponse.json(item)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.partner.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
