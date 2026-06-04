import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

async function main() {
  const wb = XLSX.readFile('/app/prisma/popzones.xlsx')
  const rows: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: null })
  // Normalise to lowercase + trim for comparison
  const excelZones = new Map<string, string>() // lowercase → original
  rows.slice(1).forEach(r => {
    const orig = String(r[0]).trim()
    if (orig) excelZones.set(orig.toLowerCase(), orig)
  })

  const dbZones = await prisma.popZone.findMany({ select: { name: true } })
  const dbMap = new Map<string, string>() // lowercase → original
  dbZones.forEach(z => dbMap.set(z.name.toLowerCase().trim(), z.name))

  const inDbNotExcel = [...dbMap.keys()].filter(k => !excelZones.has(k)).sort()
  const inExcelNotDb = [...excelZones.keys()].filter(k => !dbMap.has(k)).sort()

  console.log(`DB: ${dbMap.size} | Excel: ${excelZones.size}`)
  console.log(`\n✅ IN DB but NOT in Excel (${inDbNotExcel.length}) — DB value:`)
  inDbNotExcel.forEach(k => console.log(' ', dbMap.get(k)))
  console.log(`\n❌ In Excel but NOT in DB (${inExcelNotDb.length}):`)
  inExcelNotDb.forEach(k => console.log(' ', excelZones.get(k)))
}

main().finally(() => prisma.$disconnect())
