import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import NewTicketForm from './NewTicketForm'

export default async function NewTicketPage() {
  const session = await auth()
  const engineerId = (session?.user as any)?.id

  const [documentations, partners, popZones, issueTopics, solutionTopics, engineers] = await Promise.all([
    prisma.documentation.findMany({ orderBy: [{ section: 'asc' }, { order: 'asc' }], select: { id: true, title: true, section: true } }),
    prisma.partner.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
    prisma.popZone.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
    prisma.issueTopic.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
    prisma.solutionTopic.findMany({ orderBy: { name: 'asc' }, select: { name: true } }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true, engineerPrefix: true } }),
  ])

  // Fetch the correct next number for the logged-in engineer via the same logic
  const engineer = engineers.find(e => e.id === engineerId)
  let defaultTicketNumber = '#000001'
  if (engineer?.engineerPrefix) {
    const prefix = `#${engineer.engineerPrefix}`
    const result = await prisma.$queryRaw<{ max: number | null }[]>`
      SELECT MAX(CAST(SUBSTRING("ticketNumber" FROM ${prefix.length + 1}) AS INTEGER)) as max
      FROM "Ticket"
      WHERE "ticketNumber" LIKE ${prefix + '%'}
      AND "ticketNumber" ~ ${'^' + prefix.replace('#', '\\#') + '[0-9]+$'}
    `
    const max = result[0]?.max ?? 0
    defaultTicketNumber = `${prefix}${String(max + 1).padStart(4, '0')}`
  }

  return (
    <NewTicketForm
      defaultTicketNumber={defaultTicketNumber}
      engineerId={engineerId}
      documentations={documentations}
      partners={partners.map(p => p.name)}
      popZones={popZones.map(p => p.name)}
      issueTopics={issueTopics.map(t => t.name)}
      solutionTopics={solutionTopics.map(t => t.name)}
      engineers={engineers}
    />
  )
}
