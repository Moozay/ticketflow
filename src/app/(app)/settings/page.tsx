import { prisma } from '@/lib/prisma'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const [issueTopics, popZones, solutionTopics, partners, solutions, docLinks] = await Promise.all([
    prisma.issueTopic.findMany({ orderBy: { name: 'asc' } }),
    prisma.popZone.findMany({ orderBy: { name: 'asc' } }),
    prisma.solutionTopic.findMany({ orderBy: { name: 'asc' } }),
    prisma.partner.findMany({ orderBy: { name: 'asc' } }),
    prisma.solution.findMany({
      orderBy: { title: 'asc' },
      include: { createdBy: { select: { name: true } }, _count: { select: { tickets: true } } },
    }),
    prisma.documentation.findMany({ orderBy: [{ section: 'asc' }, { order: 'asc' }] }),
  ])

  return (
    <SettingsClient
      issueTopics={issueTopics}
      popZones={popZones}
      solutionTopics={solutionTopics}
      partners={partners}
      solutions={solutions as any}
      docLinks={docLinks}
    />
  )
}
