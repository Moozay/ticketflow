import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const items = await prisma.solutionTopic.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const { name, description } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  try {
    const item = await prisma.solutionTopic.create({ data: { name: name.trim(), description: description?.trim() || null } })
    return NextResponse.json(item)
  } catch {
    return NextResponse.json({ error: 'Already exists' }, { status: 409 })
  }
}
