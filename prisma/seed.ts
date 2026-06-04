import { PrismaClient, Role, TicketStatus, Urgency, Category, IssueType, CanUserSolve, DocumentationStatus } from '@prisma/client'
import * as XLSX from 'xlsx'
import bcrypt from 'bcryptjs'
import path from 'path'

const prisma = new PrismaClient()

// ── Map helpers ────────────────────────────────────────────────────────────
function mapStatus(s: string | undefined): TicketStatus {
  const v = (s ?? '').trim().toLowerCase()
  if (v === 'done by l2')         return 'DONE_BY_L2'
  if (v === 'escalated to l2')    return 'ESCALATED_TO_L2'
  if (v === 'on hold')            return 'ON_HOLD'
  if (v === 'in progress')        return 'IN_PROGRESS'
  if (v === 'not yet started')    return 'NOT_YET_STARTED'
  return 'DONE'
}

function mapUrgency(u: string | undefined): Urgency {
  const v = (u ?? '').trim().toLowerCase()
  if (v === 'low')    return 'LOW'
  if (v === 'medium') return 'MEDIUM'
  if (v === 'high')   return 'HIGH'
  return 'NOT_SPECIFIED'
}

function mapCategory(c: string | undefined): Category {
  const v = (c ?? '').trim().toLowerCase()
  if (v === 'category 2') return 'CATEGORY_2'
  if (v === 'category 3') return 'CATEGORY_3'
  return 'CATEGORY_1'
}

function mapIssueType(t: string | undefined): IssueType {
  const v = (t ?? '').trim().toLowerCase()
  if (v === 'comsof issue') return 'COMSOF_ISSUE'
  return 'MARLIN_ISSUE'
}

function mapCanUserSolve(v: string | undefined): CanUserSolve {
  const s = (v ?? '').trim().toLowerCase()
  if (s === 'yes')       return 'YES'
  if (s === 'partially') return 'PARTIALLY'
  if (s === 'unknown')   return 'UNKNOWN'
  return 'NO'
}

function mapDocStatus(v: string | undefined): DocumentationStatus {
  const s = (v ?? '').trim().toLowerCase()
  if (s === 'already exists') return 'ALREADY_EXISTS'
  if (s === 'not needed')     return 'NOT_NEEDED'
  if (s === 'will create')    return 'WILL_CREATE'
  if (s === 'created')        return 'CREATED'
  return 'UNKNOWN'
}

function parseDate(v: any): Date | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  if (typeof v === 'number') {
    // Excel serial date
    const d = new Date(Math.round((v - 25569) * 86400 * 1000))
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? null : d
}

// ── Engineers — derive from the unique engineer names in data ──────────────
const ENGINEER_PREFIXES: Record<string, number> = {
  Abdellah: 3,
  Brahim:   1,
  Mohamed:  6,
  Younesse: 2,
  Hamza:    4,
  Musa:     5,
}

async function main() {
  console.log('🌱 Starting seed...')

  // ── 1. Create engineers ──────────────────────────────────────────────────
  const password = await bcrypt.hash('Ticketflow2024!', 10)
  const adminPassword = await bcrypt.hash('Admin2024!', 10)

  const engineerRecords: Record<string, string> = {}

  // Admin account
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mdesignsolutions.be' },
    update: {},
    create: { name: 'Admin', email: 'admin@mdesignsolutions.be', password: adminPassword, role: Role.ADMIN },
  })
  console.log('✓ Admin user created')

  // Engineers
  for (const [name, prefix] of Object.entries(ENGINEER_PREFIXES)) {
    const email = `${name.toLowerCase()}@mdesignsolutions.be`
    const user = await prisma.user.upsert({
      where: { email },
      update: { engineerPrefix: prefix },
      create: { name, email, password, role: Role.ENGINEER, engineerPrefix: prefix },
    })
    engineerRecords[name] = user.id
  }
  console.log('✓ Engineers created')

  // ── 2. Read Excel ────────────────────────────────────────────────────────
  const xlsxPath = path.resolve(__dirname, 'data_tickets_clean.xlsx')
  const wb = XLSX.readFile(xlsxPath, { cellDates: true })
  const ws = wb.Sheets['Tickets']
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null })
  console.log(`📊 Read ${rows.length} rows from Excel`)

  // ── 3. Seed tickets in batches ───────────────────────────────────────────
  let created = 0, skipped = 0

  for (const row of rows) {
    const ticketNumber = String(row['Title'] ?? '').trim()
    if (!ticketNumber || ticketNumber === '0') { skipped++; continue }

    const engineerName = String(row['Engineer'] ?? '').trim()
    const engineerId = engineerRecords[engineerName] ?? admin.id

    const isValid = row['IsValidTicket'] !== false && row['IsValidTicket'] !== 'FALSE'

    const startDate = parseDate(row['StartDate'])
    if (!startDate) { skipped++; continue }


    try {
      await prisma.ticket.upsert({
        where: { ticketNumber },
        update: {},
        create: {
          ticketNumber,
          startDate,
          estimatedEnd:        parseDate(row['EstimatedEndDate']),
          actualEnd:           parseDate(row['ActualEndDate']),
          category:            mapCategory(row['Category']),
          issueType:           mapIssueType(row['IssueType']),
          urgency:             mapUrgency(row['Urgency']),
          status:              mapStatus(row['Status']),
          popZone:             String(row['POPZone'] ?? ''),
          designPartner:       String(row['DesignPartner'] ?? ''),
          subcontractor:       String(row['Subcontractor'] ?? ''),
          canUserSolve:        mapCanUserSolve(row['CanUserSolve']),
          documentationStatus: mapDocStatus(row['DocumentationStatus']),
          description:         row['Remarks'] ? String(row['Remarks']).slice(0, 1000) : null,
          isValidTicket:       isValid,
          isOutlier:           row['IsOutlier'] === true || row['IsOutlier'] === 'TRUE',

          issueTopic:          row['IssueTopic'] ? String(row['IssueTopic']) : null,
          solutionTopic:       row['SolutionTopic'] ? String(row['SolutionTopic']) : null,
          engineerId,
        },
      })
      created++
    } catch (err: any) {
      console.error(`⚠️  Skip ${ticketNumber}: ${err.message}`)
      skipped++
    }

    if (created % 200 === 0 && created > 0) console.log(`  ...${created} tickets inserted`)
  }

  console.log(`✓ ${created} tickets seeded, ${skipped} skipped`)

  // ── 4. Seed IssueTopic, SolutionTopic, PopZone from Excel ────────────────
  const issueTopicNames = [...new Set(rows.map((r: any) => r['IssueTopic']).filter(Boolean))] as string[]
  for (const name of issueTopicNames.sort()) {
    await prisma.issueTopic.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log(`✓ ${issueTopicNames.length} issue topics seeded`)

  const solutionTopicNames = [...new Set(rows.map((r: any) => r['SolutionTopic']).filter(Boolean))] as string[]
  for (const name of solutionTopicNames.sort()) {
    await prisma.solutionTopic.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log(`✓ ${solutionTopicNames.length} solution topics seeded`)

  const allPopZones = new Set<string>()
  for (const r of rows) {
    const pz = String(r['POPZone'] ?? '').trim()
    if (pz) pz.split(/[,;/|&]/).map((z: string) => z.trim()).filter(Boolean).forEach((z: string) => allPopZones.add(z))
  }
  for (const name of [...allPopZones].sort()) {
    if (name) await prisma.popZone.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log(`✓ ${allPopZones.size} pop zones seeded`)

  const allPartners = new Set<string>()
  for (const r of rows) {
    const dp = String(r['DesignPartner'] ?? '').trim()
    const sc = String(r['Subcontractor'] ?? '').trim()
    if (dp) allPartners.add(dp)
    if (sc) allPartners.add(sc)
  }
  for (const name of [...allPartners].sort()) {
    await prisma.partner.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log(`✓ ${allPartners.size} partners seeded`)

  // ── 5. Seed documentation links (only if none exist) ─────────────────────
  const docCount = await prisma.documentation.count()
  if (docCount === 0) {
    await prisma.documentation.createMany({
      data: [
        { title: 'Fix for \'Move Sheath to Port\' Error in Marlin', order: 1, section: 'Errors & Immediate Fixes', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EbSEaqgg_dxGn2w_bF_9XvwBbuLiPE6IxTA3LnO48Hh-9A?e=S7cGnd' },
        { title: 'Splicing errors and fixes', order: 2, section: 'Errors & Immediate Fixes', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/Edy4XyTxnr5JmdDjhv87gAABdxzC1qeQJWgn7qwWyV6GMw?e=bQBcza' },
        { title: 'Fixing missing or non-existent log files', order: 3, section: 'Errors & Immediate Fixes', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/Ecl2poNtpjpGq7rAeiDajjQBe_TgPWqqKcQnAyhmI5H6BA?e=JsPOiw' },
        { title: 'Fixing Missing Facade Cables After Import in ArcGIS Pro', order: 4, section: 'Errors & Immediate Fixes', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EXh5Q1ie4UNKoJAv8ZEfLWwBtK2NoY91V8ftRxC67YVPpA?e=BtCiAF' },
        { title: 'Issue with duplicated POP Cabinet', order: 5, section: 'Errors & Immediate Fixes', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EeGZCu3u8wZFpw8jtpfwS4IBeKxsCyu2Hzqu5QWgNytoIA?e=Tbe8iA' },
        { title: 'Fixing Missing Handhole Structures and POC Connectivity Issue', order: 6, section: 'Errors & Immediate Fixes', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EZ5g4vmsfSBCq1MHz6QewY8B6uokM3n2RQ2m9cOfjhiY8g?e=CmwGcW' },
        { title: 'Reactivating Feeder Sessions in Marlin', order: 1, section: 'Session & Database Management', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/Ec73xlR1aTtEoaJjknbQGGYB7frOmcYMBAITmuL7h0uJWQ?e=TDSzsv' },
        { title: 'Merging two design sessions', order: 2, section: 'Session & Database Management', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EVcwqocG8SNJkXIQsG5-JUgBEMVkvFKolVPCuByqJ1OWyA?e=wMuwHw' },
        { title: 'Removing a DP and rerouting to the PDP', order: 3, section: 'Session & Database Management', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EfNl8r2KxJZDi_HBXuSWi14BiFHzQ4o4ymTTmouxDnoC0w?e=dEhkgM' },
        { title: 'Documentation to close a session directly from the database', order: 4, section: 'Session & Database Management', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EQPFrjUVicRAsBYn6-keug4B7kcSGo2jPd-Wyb7SV22KFg?e=nlb7UL' },
        { title: 'Automatic PDP splicing', order: 1, section: 'PDP / Splicing Specific', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EcHIH9UFgZpDs6SqfrTYvgcBStixGTUPDvMIeeB7YZu_mA?e=yo0Pe2' },
        { title: 'Changing the splice closure type from the database', order: 2, section: 'PDP / Splicing Specific', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EYacqzSHki5DqXRVV55LdDYBZ6uu6dKndsuGbvcB0mPPIQ?e=hGb8Rn' },
        { title: 'Updating status to Constructed for PDP / DP / POC', order: 3, section: 'PDP / Splicing Specific', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EVYQUaZNEVFJora13EsUO-EBw4qoFjD8buRxncc_Z7fuQQ?e=zrT1eg' },
        { title: 'Documentation For Expanding Boundaries for a design session', order: 1, section: 'Design / Geometry / Boundaries', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/ER4dYQD2aYpJsJTO6qGNUroB2-OcBTULan-v7LAuMDUvXw?e=tKQS5C' },
        { title: 'Documentation For Geometry replacement with known values', order: 2, section: 'Design / Geometry / Boundaries', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/ETVNVtiBazFHo-W5-eWObUABCmYblKf5b3XHHapo5Y2TLw?e=bmceFA' },
        { title: 'Geometry replacement using another session\'s geometry', order: 3, section: 'Design / Geometry / Boundaries', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/ETVNVtiBazFHo-W5-eWObUABCmYblKf5b3XHHapo5Y2TLw?e=bmceFA' },
        { title: 'Documentation to Solve Connection Issue Between Sheath and OSC', order: 1, section: 'Connectivity / Cabling / Hardware', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EVNbTGFuHfNNqgU9zibUFaEBAlkueOROzQW6q2Q3t1Q6rg?e=ijHOlR' },
        { title: 'Documentation for the connection problem between The breakout cable and the Rack', order: 2, section: 'Connectivity / Cabling / Hardware', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EVebH6ob4rxFka8kqQ9RAmEBT_1TddyHw8JVlzSS23eXJA?e=kTlaPe' },
        { title: 'Marlin Sheath & Structure Association Issue – Troubleshooting Guide', order: 3, section: 'Connectivity / Cabling / Hardware', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EUiqJZuXdIVHsXrlRTupznUBFutJ4rW3FXZzkh_iIA4n1w?e=ibGjXt' },
        { title: 'Cut duct issue and Connect Sheath to OSC', order: 4, section: 'Connectivity / Cabling / Hardware', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/IQA7ub33jZQsS5YeI3gYE7PCAVM36P2ldfMJlzvDbSnfi0s?e=cYNA5T' },
        { title: 'Deleting OSCs adding new sheath splicing and creating new routes', order: 1, section: 'Procedures & Documentation', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/ER9V-DNXy8BGksdFszvt9LAByOcH5QFQ9toxMg5xfqrovA?e=pQAjOJ' },
        { title: 'Duct Connection Guide', order: 2, section: 'Procedures & Documentation', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EUWYanBk5ZxJk76W3R3jC4kBSW2QcPi3u_YFuq_-odKt7g?e=tBX2zX' },
        { title: 'Documentation of the statuses of all structures in the design session', order: 3, section: 'Procedures & Documentation', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/Efvg3d9fm-dBtjTqTuirYTUBXR3GChr614g9A7BbF186Fw?e=TmPJgN' },
        { title: 'Export organizer scheme', order: 4, section: 'Procedures & Documentation', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/EWz6PY0K8VlPl0FN1NOHUY0BwD5VsNt91amEVx5h7PnHTg?e=JOo4Op' },
        { title: 'Update OSC Status Documentation', order: 5, section: 'Procedures & Documentation', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/Ed1tBJRDWLFKjghpUow_0_EB0AnO-B6aNYDd06D8IcnKNg?e=QiwAko' },
        { title: 'Email Receipt and Ticket Creation in Ticket Flow', order: 6, section: 'Procedures & Documentation', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/IQCDa72Y3bYOQaJTbrkohgL3AdeDXTxGqczYX4wsfASe7SI?e=EnwlfH' },
        { title: 'AAP On Hold / Off Hold Troubleshooting', order: 7, section: 'Procedures & Documentation', url: 'https://mdesignbv.sharepoint.com/:b:/s/M.Design-WyreSupportTeam/IQDeEwUIXBJKQawY8WbkcT3dAV2k1Q21hOe2OY4Zadyj2ms?e=SsRQrP' },
        { title: 'Comsof workspace troubleshooting', order: 1, section: 'Import / YAML', url: 'https://mdesignbv.sharepoint.com/:w:/s/M.Design-WyreSupportTeam/EQtZn18ofaVEraMcZAz1X2gBaR2-8V1qPgG9lxJhYujxJQ?e=3dCeWR' },
        { title: 'Troubleshooting errors with creating or importing yaml', order: 2, section: 'Import / YAML', url: 'https://mdesignbv.sharepoint.com/:w:/s/M.Design-WyreSupportTeam/ESPoRMlHXNdIgdF7gk86zJYBwB_gSHKcWaWgCOj1-IKG0g?e=68ZBGw' },
        { title: 'LLD work instruction', order: 1, section: 'LLD', url: 'https://mdesignbv-my.sharepoint.com/:b:/g/personal/brahim_amjif_mdesignsolutions_ma/IQAnP4xEnoJlR6M6eB9ETg9vAY7wVXcBXtsxj6Kw2QqmFmA?e=aQ07tO' },
      ],
    })
    console.log('✓ 30 documentation links seeded')
  } else {
    console.log(`✓ Documentation links already present (${docCount}), skipping`)
  }

  console.log('\n🎉 Seed complete!')
  console.log('\nDefault credentials:')
  console.log('  Admin:    admin@mdesignsolutions.be  /  Admin2024!')
  console.log('  Engineer: abdellah@mdesignsolutions.be  /  Ticketflow2024!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
