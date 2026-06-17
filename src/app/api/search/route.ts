import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q) {
    return NextResponse.json([]);
  }

  try {
    const queryWildcard = `%${q}%`;

    // Perform FTS with ILIKE fallback
    const rawParts = await prisma.$queryRaw<any[]>`
      SELECT p.id, p.name, p.part_number as "partNumber", p.package, p.comment, p.datasheet_url as "datasheetUrl",
             c.name as "categoryName", c.label as "categoryLabel",
             s.name as "subcategoryName", s.label as "subcategoryLabel",
             h.code as "hsnCode"
      FROM parts p
      LEFT JOIN stock_categories c ON p.category_id = c.id
      LEFT JOIN stock_subcategories s ON p.subcategory_id = s.id
      LEFT JOIN hsn_codes h ON p.hsn_code_id = h.id
      WHERE p.search_vector @@ websearch_to_tsquery('english', ${q})
         OR p.name ILIKE ${queryWildcard}
         OR p.part_number ILIKE ${queryWildcard}
         OR p.comment ILIKE ${queryWildcard}
         OR p.package ILIKE ${queryWildcard}
      ORDER BY p.name ASC
      LIMIT 50
    `;

    if (rawParts.length === 0) {
      return NextResponse.json([]);
    }

    const partIds = rawParts.map((p) => p.id);

    // Fetch stock entries and locations for these parts
    const stockEntries = await prisma.stockEntry.findMany({
      where: { part_id: { in: partIds } },
      include: { location: true }
    });

    // Format parts to match the frontend expectations
    const formattedParts = rawParts.map((p) => {
      const entries = stockEntries.filter((se) => se.part_id === p.id);
      return {
        id: p.id,
        name: p.name,
        part_number: p.partNumber,
        package: p.package,
        comment: p.comment,
        datasheet_url: p.datasheetUrl,
        category: {
          name: p.categoryName,
          label: p.categoryLabel
        },
        subcategory: p.subcategoryName
          ? {
              name: p.subcategoryName,
              label: p.subcategoryLabel
            }
          : null,
        hsn_code: {
          code: p.hsnCode
        },
        stock_entries: entries.map((entry) => ({
          id: entry.id,
          quantity: entry.quantity,
          unit: entry.unit,
          min_quantity: entry.min_quantity,
          location: {
            id: entry.location.id,
            label: entry.location.label,
            zone: entry.location.zone,
            rack: entry.location.rack,
            shelf: entry.location.shelf,
            bin: entry.location.bin
          }
        }))
      };
    });

    return NextResponse.json(formattedParts);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
