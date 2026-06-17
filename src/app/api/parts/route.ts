import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || "";

  try {
    const parts = await prisma.part.findMany({
      where: {
        category: category ? { name: category } : undefined,
        OR: search
          ? [
              { name: { contains: search, mode: "insensitive" } },
              { part_number: { contains: search, mode: "insensitive" } },
              { comment: { contains: search, mode: "insensitive" } }
            ]
          : undefined
      },
      include: {
        category: true,
        subcategory: true,
        hsn_code: true,
        stock_entries: {
          include: {
            location: true
          }
        }
      },
      orderBy: { created_at: "desc" }
    });

    return NextResponse.json(parts);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden - Read-only access" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      part_number,
      category_id,
      subcategory_id,
      hsn_code_id,
      package: pkg,
      comment,
      datasheet_url,
      purchase_url,
      price_per_unit,
      // Location & Stock details
      location_id,
      new_location,
      quantity,
      unit,
      min_quantity
    } = body;

    if (!name || !category_id || !hsn_code_id || !location_id || quantity === undefined || !unit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let finalCategoryId = category_id;
    let finalSubcategoryId = subcategory_id;

    // Check if category_id is name instead of UUID
    if (category_id && !category_id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      const cat = await prisma.stockCategory.findUnique({
        where: { name: category_id }
      });
      if (cat) {
        finalCategoryId = cat.id;
      } else {
        return NextResponse.json({ error: `Category '${category_id}' not found` }, { status: 400 });
      }
    }

    // Check if subcategory_id is name instead of UUID
    if (subcategory_id && !subcategory_id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      const sub = await prisma.stockSubcategory.findFirst({
        where: { name: subcategory_id, category_id: finalCategoryId }
      });
      if (sub) {
        finalSubcategoryId = sub.id;
      }
    }

    // Use a transaction to create the Part, StockEntry, and a StockMovement log
    const result = await prisma.$transaction(async (tx) => {
      let finalLocationId = location_id;

      if (location_id === "new") {
        if (!new_location || !new_location.zone) {
          throw new Error("Missing new location zone specifier");
        }

        const computedLabel = `${new_location.zone} > ${new_location.rack || "Default"} > ${new_location.shelf || "Default"} > ${new_location.bin || "Default"}`;

        let existingLoc = await tx.location.findFirst({
          where: { label: computedLabel }
        });

        if (!existingLoc) {
          existingLoc = await tx.location.create({
            data: {
              zone: new_location.zone,
              rack: new_location.rack || null,
              shelf: new_location.shelf || null,
              bin: new_location.bin || null,
              label: computedLabel,
              description: new_location.description || null
            }
          });
        }
        finalLocationId = existingLoc.id;
      }

      const part = await tx.part.create({
        data: {
          name,
          part_number: part_number || null,
          category_id: finalCategoryId,
          subcategory_id: finalSubcategoryId || null,
          hsn_code_id,
          package: pkg || null,
          comment: comment || null,
          datasheet_url: datasheet_url || null,
          purchase_url: purchase_url || null,
          price_per_unit: price_per_unit !== undefined && price_per_unit !== null && price_per_unit !== "" ? parseFloat(price_per_unit) : null,
          created_by: session.user.id
        }
      });

      const stockEntry = await tx.stockEntry.create({
        data: {
          part_id: part.id,
          location_id: finalLocationId,
          quantity: parseInt(quantity),
          unit,
          min_quantity: min_quantity ? parseInt(min_quantity) : null
        }
      });

      await tx.stockMovement.create({
        data: {
          part_id: part.id,
          to_location_id: finalLocationId,
          movement_type: "IN",
          quantity: parseInt(quantity),
          reference: "Initial Stocking",
          notes: "Added via add stock wizard",
          performed_by: session.user.id
        }
      });

      return { part, stockEntry };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
