import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticketId, fileName, fileUrl, publicId, fileSize, mimeType } = await req.json()
  if (!ticketId || !fileUrl || !publicId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const attachment = await prisma.attachment.create({
    data: { ticketId, fileName, fileUrl, publicId, fileSize, mimeType },
  })

  return NextResponse.json(attachment, { status: 201 })
}
