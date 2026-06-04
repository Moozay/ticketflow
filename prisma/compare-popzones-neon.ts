import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://neondb_owner:npg_8oTqDEjvbO4e@ep-lingering-wind-abrizq0k.eu-west-2.aws.neon.tech/neondb?sslmode=require' } },
})

async function main() {
  const wb = XLSX.readFile('/app/prisma/popzones.xlsx')
  const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null })
  const excelMap = new Map<string, string>()
  rows.slice(1).forEach(r => {
    const orig = String(r[0]).trim()
    if (orig) excelMap.set(orig.toLowerCase(), orig)
  })

  const dbZones = await prisma.popZone.findMany({ select: { name: true } })
  const dbMap = new Map<string, string>()
  dbZones.forEach(z => dbMap.set(z.name.toLowerCase().trim(), z.name))

  const inDbNotExcel = [...dbMap.keys()].filter(k => !excelMap.has(k)).sort()
  const inExcelNotDb = [...excelMap.keys()].filter(k => !dbMap.has(k)).sort()

  console.log(`Neon DB: ${dbMap.size} | Excel: ${excelMap.size}`)
  console.log(`\nIN DB but NOT in Excel (${inDbNotExcel.length}):`)
  inDbNotExcel.forEach(k => console.log(' ', dbMap.get(k)))
  console.log(`\nIn Excel but NOT in DB (${inExcelNotDb.length}):`)
  inExcelNotDb.forEach(k => console.log(' ', excelMap.get(k)))
}

main().finally(() => prisma.$disconnect())
