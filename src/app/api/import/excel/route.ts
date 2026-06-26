import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    // Get a user to act as creator
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No users found in database to assign as creator.' }, { status: 500 });
    }

    let successCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];

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

      // 4. Location - Force everything to Store RB_01 based on user preference
      let location = await prisma.location.findFirst({
        where: { label: 'Store RB_01' }
      });
      if (!location) {
        location = await prisma.location.create({
          data: {
            zone: 'Store RB_01',
            rack: null,
            shelf: null,
            bin: null,
            label: 'Store RB_01',
            description: 'Imported bulk location'
          }
        });
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

      successCount++;
    }

    return NextResponse.json({ message: `Successfully imported ${successCount} components.` });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process Excel file' }, { status: 500 });
  }
}
