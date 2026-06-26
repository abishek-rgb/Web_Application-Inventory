import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        hsn_code: true,
        stock_entries: {
          include: {
            location: true
          }
        }
      }
    });

    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    return NextResponse.json(part);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden - Read-only access" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, part_number, category_id, subcategory_id, hsn_code_id, package: pkg, comment, datasheet_url, purchase_url, price_per_unit } = body;

    const existingPart = await prisma.part.findUnique({
      where: { id }
    });

    if (!existingPart) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const updated = await prisma.part.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingPart.name,
        part_number: part_number !== undefined ? part_number : existingPart.part_number,
        category_id: category_id !== undefined ? category_id : existingPart.category_id,
        subcategory_id: subcategory_id !== undefined ? subcategory_id : existingPart.subcategory_id,
        hsn_code_id: hsn_code_id !== undefined ? hsn_code_id : existingPart.hsn_code_id,
        package: pkg !== undefined ? pkg : existingPart.package,
        comment: comment !== undefined ? comment : existingPart.comment,
        datasheet_url: datasheet_url !== undefined ? datasheet_url : existingPart.datasheet_url,
        purchase_url: purchase_url !== undefined ? (purchase_url || null) : existingPart.purchase_url,
        price_per_unit: price_per_unit !== undefined ? (price_per_unit !== null && price_per_unit !== "" ? parseFloat(price_per_unit) : null) : existingPart.price_per_unit
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden - Super Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await params;
    
    // Check if part exists
    const part = await prisma.part.findUnique({
      where: { id }
    });

    if (!part) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    // Must delete related records first or use cascading deletes
    await prisma.$transaction([
      prisma.stockEntry.deleteMany({ where: { part_id: id } }),
      prisma.stockMovement.deleteMany({ where: { part_id: id } }),
      prisma.part.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
