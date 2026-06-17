const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const xlsx = require('xlsx')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  // 1. Create Default Admin User
  const adminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@seculogix.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@seculogix.com',
      password_hash: adminPassword,
      role: 'ADMIN',
    },
  })

  console.log('Created Admin User:', adminUser.email)

  // 2. Create HSN Codes (from Appendix A)
  const hsnCodesData = [
    { code: '8542', description: 'Electronic integrated circuits (ICs, microcontrollers, MCUs)', gst_rate: 18.0 },
    { code: '8541', description: 'Semiconductor devices — diodes, transistors, thyristors', gst_rate: 18.0 },
    { code: '8532', description: 'Electrical capacitors (fixed, variable, trimmer)', gst_rate: 18.0 },
    { code: '8533', description: 'Electrical resistors (fixed, variable, NTC/PTC)', gst_rate: 18.0 },
    { code: '8504', description: 'Transformers, inductors, coils, chokes, power supplies', gst_rate: 18.0 },
    { code: '8536', description: 'Switches, relays, fuses, connectors, junction boxes (low voltage)', gst_rate: 18.0 },
    { code: '8544', description: 'Insulated wires, cables, coaxial cable', gst_rate: 18.0 },
    { code: '8471', description: 'Computers, computing machines, Raspberry Pi, single board computers', gst_rate: 18.0 },
    { code: '8517', description: 'Telephone sets, WiFi routers, IoT communication modules', gst_rate: 18.0 },
    { code: '9026', description: 'Sensors for measuring flow, level, temperature, pressure', gst_rate: 18.0 },
    { code: '8543', description: 'Other electrical machines — IoT gateways, signal generators', gst_rate: 18.0 },
    { code: '8534', description: 'Printed circuit boards (bare PCBs)', gst_rate: 18.0 },
    { code: '3919', description: 'Self-adhesive plates, films, foam tape, kapton tape', gst_rate: 18.0 },
    { code: '3926', description: 'Plastic fittings, standoffs, cable ties, connectors (plastic)', gst_rate: 18.0 },
    { code: '7318', description: 'Screws, bolts, nuts, washers (iron/steel fasteners)', gst_rate: 18.0 },
    { code: 'DEFAULT', description: 'Default General HSN', gst_rate: 18.0 }
  ]

  const defaultHsn = await prisma.hsnCode.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: { code: 'DEFAULT', description: 'Default General HSN', gst_rate: 18.0 }
  })

  for (const hsn of hsnCodesData) {
    await prisma.hsnCode.upsert({
      where: { code: hsn.code },
      update: {},
      create: hsn,
    })
  }

  // 3. Create Categories & Subcategories
  const categoriesData = [
    { name: 'electrical', label: 'Electrical', icon: 'Zap', sort_order: 1 },
    { name: 'electronic', label: 'Electronic', icon: 'Cpu', sort_order: 2 },
    { name: 'iot', label: 'IoT', icon: 'Wifi', sort_order: 3 },
    { name: 'general', label: 'General', icon: 'Box', sort_order: 4 },
  ]

  const categories: Record<string, any> = {}
  for (const cat of categoriesData) {
    const createdCat = await prisma.stockCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
    categories[cat.name] = createdCat
  }

  const subcategoriesData = [
    // Electronic Subcategories
    { category_id: categories['electronic'].id, name: 'module', label: 'Module' },
    { category_id: categories['electronic'].id, name: 'component', label: 'Component' },
    { category_id: categories['electronic'].id, name: 'device', label: 'Device' },

    // Electrical Subcategories
    { category_id: categories['electrical'].id, name: 'module', label: 'Module' },
    { category_id: categories['electrical'].id, name: 'component', label: 'Component' },
    { category_id: categories['electrical'].id, name: 'device', label: 'Device' },

    // IoT Subcategories
    { category_id: categories['iot'].id, name: 'module', label: 'Module' },
    { category_id: categories['iot'].id, name: 'component', label: 'Component' },
    { category_id: categories['iot'].id, name: 'device', label: 'Device' },
  ]

  const subcategories: Record<string, any> = {}
  for (const sub of subcategoriesData) {
    // Only create if not exists under this specific category
    const existing = await prisma.stockSubcategory.findFirst({
      where: {
        name: sub.name,
        category_id: sub.category_id,
      }
    })
    if (!existing) {
        const createdSub = await prisma.stockSubcategory.create({
          data: sub,
        })
        subcategories[`${sub.category_id}-${sub.name}`] = createdSub
    } else {
        subcategories[`${sub.category_id}-${sub.name}`] = existing
    }
  }

  // 4. Parse Excel File for Locations and Parts
  console.log('Parsing spreadsheet...')
  const filePath = path.join(__dirname, '../Untitled spreadsheet.xlsx')
  try {
    const workbook = xlsx.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, blankrows: false })
    
    // We expect rows with location in column A, name in B, spec in C
    for (const row of data) {
      // Excel to JSON maps column headers if first row is header, but we used header: 1 which gives an array of arrays
      if (!Array.isArray(row) || row.length === 0) continue;
      
      const locationStr = row[0]?.toString() || ''
      const partName = row[1]?.toString() || ''
      const spec = row[2]?.toString() || ''

      if (!locationStr.toUpperCase().startsWith('RACK')) continue;
      
      // Determine rack identifier
      const rackName = locationStr.replace('RACK ', '').trim()

      // Ensure location exists
      const locationLabel = `Store > ${rackName} > Default Shelf > Default Bin`
      let location = await prisma.location.findFirst({ where: { label: locationLabel } })
      if (!location) {
        location = await prisma.location.create({
          data: {
            zone: 'Store',
            rack: rackName,
            shelf: 'Default Shelf',
            bin: 'Default Bin',
            label: locationLabel,
          }
        })
      }

      if (partName) {
        // Create Part only if it doesn't exist
        const fullPartName = spec ? `${partName} - ${spec}` : partName
        let part = await prisma.part.findFirst({ where: { name: fullPartName } })
        if (!part) {
          part = await prisma.part.create({
            data: {
              name: fullPartName,
              category_id: categories['general'].id, // Default to general if not sure
              hsn_code_id: defaultHsn.id,
              created_by: adminUser.id,
              comment: 'Imported from spreadsheet',
            }
          })

          // Create Stock Entry
          await prisma.stockEntry.create({
            data: {
              part_id: part.id,
              location_id: location.id,
              quantity: 0, // No quantity specified in spreadsheet, assumed structure only
              unit: 'pcs',
            }
          })
        }
      }
    }
    console.log('Spreadsheet data imported successfully.')
  } catch (error) {
    console.error('Error importing spreadsheet:', (error as any).message)
  }

  // 5. Add full-text search TSVECTOR column and index (PostgreSQL native)
  console.log('Setting up full-text search vector column...')
  try {
    // Add column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE parts ADD COLUMN IF NOT EXISTS search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(part_number, '')), 'B')
      ) STORED;
    `)
    // Create GIN index if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_parts_search ON parts USING GIN (search_vector);
    `)
    console.log('Full-text search configured successfully.')
  } catch (error) {
    console.error('Error configuring full-text search:', (error as any).message)
  }

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
