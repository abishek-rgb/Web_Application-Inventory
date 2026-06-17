import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const { location_id, new_location, quantity, min_quantity } = body;

    const existing = await prisma.stockEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Stock entry not found" }, { status: 404 });
    }

    let finalLocationId = location_id ?? existing.location_id;

    // If creating a new location inline
    if (new_location && new_location.zone) {
      const computedLabel = `${new_location.zone} > ${new_location.rack || "Default Rack"} > ${new_location.shelf || "Default Shelf"} > ${new_location.bin || "Default Bin"}`;

      let loc = await prisma.location.findFirst({ where: { label: computedLabel } });
      if (!loc) {
        loc = await prisma.location.create({
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
      finalLocationId = loc.id;
    }

    // If changing location, ensure there's no duplicate entry for the same part at that location
    if (finalLocationId !== existing.location_id) {
      const conflict = await prisma.stockEntry.findUnique({
        where: {
          part_id_location_id: {
            part_id: existing.part_id,
            location_id: finalLocationId
          }
        }
      });
      if (conflict) {
        return NextResponse.json(
          { error: "This part already has a stock entry at the selected location. Use a stock TRANSFER movement instead." },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.stockEntry.update({
      where: { id },
      data: {
        location_id: finalLocationId,
        quantity: quantity !== undefined ? parseInt(quantity) : existing.quantity,
        min_quantity: min_quantity !== undefined
          ? (min_quantity !== null && min_quantity !== "" ? parseInt(min_quantity) : null)
          : existing.min_quantity
      },
      include: {
        location: true
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
