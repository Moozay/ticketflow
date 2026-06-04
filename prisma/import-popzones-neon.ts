import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_8oTqDEjvbO4e@ep-lingering-wind-abrizq0k.eu-west-2.aws.neon.tech/neondb?sslmode=require' } },
})

async function main() {
  const wb = XLSX.readFile('/app/prisma/popzones.xlsx')
  const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null })
  const excelZones = rows.slice(1).map(r => String(r[0]).trim()).filter(Boolean)

  const existing = await prisma.popZone.findMany({ select: { name: true } })
  const existingSet = new Set(existing.map(z => z.name.toLowerCase()))

  const toAdd = excelZones.filter(z => !existingSet.has(z.toLowerCase()))

  console.log(`Excel zones: ${excelZones.length} | Already in DB: ${existing.length} | To add: ${toAdd.length}`)

  let added = 0
  for (const name of toAdd) {
    await prisma.popZone.upsert({ where: { name }, update: {}, create: { name } })
    added++
    if (added % 200 === 0) console.log(`  ...${added} added`)
  }

  console.log(`✓ Done. Added ${added} pop zones to Neon.`)
}

main().finally(() => prisma.$disconnect())
