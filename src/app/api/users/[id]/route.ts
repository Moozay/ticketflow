import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}

  if ('name' in body && body.name?.trim()) data.name = body.name.trim()
  if ('email' in body && body.email?.trim()) data.email = body.email.toLowerCase().trim()
  if ('role' in body) data.role = body.role
  if ('active' in body) data.active = Boolean(body.active)
  if ('engineerPrefix' in body) {
    data.engineerPrefix = body.engineerPrefix != null ? Number(body.engineerPrefix) : null
  }

  if ('password' in body && body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    data.password = await bcrypt.hash(body.password, 12)
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  // Check email uniqueness if changing
  if (data.email) {
    const existing = await prisma.user.findFirst({
      where: { email: data.email as string, NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
  }

  // Check prefix uniqueness if changing
  if (data.engineerPrefix != null) {
    const existing = await prisma.user.findFirst({
      where: { engineerPrefix: data.engineerPrefix as number, NOT: { id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Engineer prefix already in use' }, { status: 409 })
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        engineerPrefix: true,
        active: true,
        updatedAt: true,
      },
    })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
