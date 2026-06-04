import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      engineerPrefix: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, email, password, role, engineerPrefix } = body

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existingEmail) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  if (engineerPrefix != null) {
    const existingPrefix = await prisma.user.findFirst({ where: { engineerPrefix: Number(engineerPrefix) } })
    if (existingPrefix) {
      return NextResponse.json({ error: 'Engineer prefix already in use' }, { status: 409 })
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role ?? 'ENGINEER',
      engineerPrefix: engineerPrefix != null ? Number(engineerPrefix) : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      engineerPrefix: true,
      active: true,
      createdAt: true,
    },
  })

  return NextResponse.json(user, { status: 201 })
}
