const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();
const filePath = 'C:\\Users\\Admin\\Downloads\\Resistor pack.xlsx';

async function main() {
  try {
    // 1. Read Excel
    console.log(`Reading Excel file from: ${filePath}`);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`Found ${data.length} rows to import.`);

    // 2. Get a user to act as creator
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error("No users found in database to assign as creator.");
    }
    console.log(`Using user ${user.name} (${user.id}) as creator.`);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // Extract and clean values
      const categoryNameRaw = (row['Category'] || '').toString().trim();
      const subcategoryNameRaw = (row['Subcategory'] || '').toString().trim();
      const partNameRaw = (row['Part Name '] || row['Part Name'] || '').toString().trim();
      const valueSpec = (row['Value / Specification'] || '').toString().trim();
      const partNumber = (row['Part Number'] || '').toString().trim() === '-' ? null : (row['Part Number'] || '').toString().trim();
      const hsnCodeRaw = (row['HSN Code'] || '').toString().trim();
      const packageType = (row['Package'] || '').toString().trim() === '-' ? null : (row['Package'] || '').toString().trim();
      const manufacturer = (row['Manufacturer'] || '').toString().trim() === '-' ? null : (row['Manufacturer'] || '').toString().trim();
      const tolerance = (row['Tolerance %'] || '').toString().trim() === '-' ? null : (row['Tolerance %'] || '').toString().trim();
      const price = parseFloat(row['Price per Unit (INR)']) || 0;
      const locationZone = (row['Location'] || '').toString().trim();
      const locationShelf = (row['Shelf'] || '').toString().trim() === '-' ? null : (row['Shelf'] || '').toString().trim();
      const locationBin = (row['BIN'] || '').toString().trim() === '-' ? null : (row['BIN'] || '').toString().trim();
      const qty = parseInt(row['Initial Quantity '] || row['Initial Quantity'] || 0, 10);
      const minAlert = parseInt(row['Min Alert Threshold'] || 0, 10);
      const unit = (row['Unit '] || row['Unit'] || 'Pcs').toString().trim();
      const notes = (row['Description / Notes'] || '').toString().trim();

      if (!categoryNameRaw || !partNameRaw) continue; // Skip empty rows

      // Format Name
      const finalPartName = `${partNameRaw} ${valueSpec}`.trim();
      
      // Comments
      const commentsArr = [];
      if (manufacturer) commentsArr.push(`Manufacturer: ${manufacturer}`);
      if (tolerance) commentsArr.push(`Tolerance: ${tolerance}%`);
      if (notes && notes !== '-') commentsArr.push(`Notes: ${notes}`);
      const comment = commentsArr.join(', ') || null;

      // 1. HSN Code
      let hsn = null;
      if (hsnCodeRaw) {
        hsn = await prisma.hsnCode.upsert({
          where: { code: hsnCodeRaw },
          update: {},
          create: {
            code: hsnCodeRaw,
            description: `Auto-generated HSN ${hsnCodeRaw}`
          }
        });
      } else {
        // Fallback HSN if none provided
        hsn = await prisma.hsnCode.upsert({
          where: { code: '0000' },
          update: {},
          create: { code: '0000', description: 'Default' }
        });
      }

      // 2. Category
      const catSlug = categoryNameRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const category = await prisma.stockCategory.upsert({
        where: { name: catSlug },
        update: {},
        create: {
          name: catSlug,
          label: categoryNameRaw,
          sort_order: 99
        }
      });

      // 3. Subcategory
      let subcategory = null;
      if (subcategoryNameRaw) {
        // Using findFirst instead of upsert to avoid complex unique constraints if not properly set
        subcategory = await prisma.stockSubcategory.findFirst({
          where: { 
            category_id: category.id,
            name: subcategoryNameRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          }
        });
        if (!subcategory) {
          subcategory = await prisma.stockSubcategory.create({
            data: {
              category_id: category.id,
              name: subcategoryNameRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              label: subcategoryNameRaw
            }
          });
        }
      }

      // 4. Location
      const locLabel = [locationZone, locationShelf, locationBin].filter(Boolean).join('-');
      let location = null;
      if (locationZone && locationZone !== '-') {
        // We'll search by label
        location = await prisma.location.findFirst({
          where: { label: locLabel }
        });
        if (!location) {
          location = await prisma.location.create({
            data: {
              zone: locationZone,
              rack: null,
              shelf: locationShelf,
              bin: locationBin,
              label: locLabel,
              description: 'Imported from Excel'
            }
          });
        }
      }

      // 5. Part
      let part = await prisma.part.create({
        data: {
          name: finalPartName,
          part_number: partNumber,
          category_id: category.id,
          subcategory_id: subcategory ? subcategory.id : null,
          hsn_code_id: hsn.id,
          package: packageType,
          comment: comment,
          price_per_unit: price,
          created_by: user.id
        }
      });

      // 6. Stock Entry
      if (location && qty > 0) {
        await prisma.stockEntry.create({
          data: {
            part_id: part.id,
            location_id: location.id,
            quantity: qty,
            unit: unit,
            min_quantity: minAlert || null
          }
        });
        
        // 7. Initial Stock Movement
        await prisma.stockMovement.create({
          data: {
            part_id: part.id,
            to_location_id: location.id,
            movement_type: 'IN',
            quantity: qty,
            reference: 'Initial Excel Import',
            notes: 'Bulk imported',
            performed_by: user.id
          }
        });
      }

      console.log(`[${i + 1}/${data.length}] Imported: ${finalPartName}`);
    }

    console.log("✅ Import completed successfully!");
  } catch (error) {
    console.error("❌ Error importing:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
