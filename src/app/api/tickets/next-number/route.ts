import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const engineerId = req.nextUrl.searchParams.get('engineerId')
  if (!engineerId) return NextResponse.json({ error: 'engineerId required' }, { status: 400 })

  const engineer = await prisma.user.findUnique({
    where: { id: engineerId },
    select: { engineerPrefix: true },
  })

  if (!engineer?.engineerPrefix) {
    return NextResponse.json({ ticketNumber: '#000001' })
  }

  const prefix = `#${engineer.engineerPrefix}`
  // Use Prisma.raw for the integer position to avoid bigint type mismatch on Neon
  const pos = Prisma.raw(String(prefix.length + 1))

  const result = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(
      CAST(SUBSTRING("ticketNumber" FROM ${pos}) AS INTEGER)
    ) as max
    FROM "Ticket"
    WHERE "ticketNumber" LIKE ${prefix + '%'}
    AND "ticketNumber" ~ ${'^' + prefix.replace('#', '\\#') + '[0-9]+$'}
  `

  const max = result[0]?.max ?? 0
  const next = max + 1
  const ticketNumber = `${prefix}${String(next).padStart(4, '0')}`

  return NextResponse.json({ ticketNumber })
}
