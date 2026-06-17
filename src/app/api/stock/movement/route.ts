import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        part: true,
        from_location: true,
        to_location: true,
        user: true
      },
      orderBy: { performed_at: "desc" }
    });
    return NextResponse.json(movements);
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
      part_id,
      from_location_id,
      to_location_id,
      movement_type,
      quantity,
      reference,
      notes
    } = body;

    if (!part_id || !movement_type || quantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const qty = parseInt(quantity);
    if (qty <= 0 && movement_type !== "ADJUSTMENT") {
      return NextResponse.json({ error: "Quantity must be a positive integer" }, { status: 400 });
    }

    if (movement_type === "ADJUSTMENT" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden - Admin access required for adjustments" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // Resolve the Part's unit
      const otherEntry = await tx.stockEntry.findFirst({ where: { part_id } });
      const unit = otherEntry ? otherEntry.unit : "pcs";

      if (movement_type === "IN") {
        if (!to_location_id) throw new Error("Destination location required for IN");

        const existing = await tx.stockEntry.findUnique({
          where: { part_id_location_id: { part_id, location_id: to_location_id } }
        });

        if (existing) {
          await tx.stockEntry.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + qty }
          });
        } else {
          await tx.stockEntry.create({
            data: { part_id, location_id: to_location_id, quantity: qty, unit }
          });
        }
      } else if (movement_type === "OUT") {
        if (!from_location_id) throw new Error("Source location required for OUT");

        const existing = await tx.stockEntry.findUnique({
          where: { part_id_location_id: { part_id, location_id: from_location_id } }
        });

        if (!existing || existing.quantity < qty) {
          throw new Error("Insufficient stock at the selected location");
        }

        await tx.stockEntry.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity - qty }
        });
      } else if (movement_type === "TRANSFER") {
        if (!from_location_id || !to_location_id) {
          throw new Error("Source and destination locations are required for TRANSFER");
        }

        if (from_location_id === to_location_id) {
          throw new Error("Source and destination locations cannot be the same");
        }

        // Decrement source
        const existingFrom = await tx.stockEntry.findUnique({
          where: { part_id_location_id: { part_id, location_id: from_location_id } }
        });

        if (!existingFrom || existingFrom.quantity < qty) {
          throw new Error("Insufficient stock at the source location");
        }

        await tx.stockEntry.update({
          where: { id: existingFrom.id },
          data: { quantity: existingFrom.quantity - qty }
        });

        // Increment destination
        const existingTo = await tx.stockEntry.findUnique({
          where: { part_id_location_id: { part_id, location_id: to_location_id } }
        });

        if (existingTo) {
          await tx.stockEntry.update({
            where: { id: existingTo.id },
            data: { quantity: existingTo.quantity + qty }
          });
        } else {
          await tx.stockEntry.create({
            data: { part_id, location_id: to_location_id, quantity: qty, unit }
          });
        }
      } else if (movement_type === "ADJUSTMENT") {
        if (!to_location_id) throw new Error("Location required for ADJUSTMENT");

        const existing = await tx.stockEntry.findUnique({
          where: { part_id_location_id: { part_id, location_id: to_location_id } }
        });

        if (existing) {
          await tx.stockEntry.update({
            where: { id: existing.id },
            data: { quantity: qty } // Set absolute quantity
          });
        } else {
          await tx.stockEntry.create({
            data: { part_id, location_id: to_location_id, quantity: qty, unit }
          });
        }
      }

      // Record the movement log
      await tx.stockMovement.create({
        data: {
          part_id,
          from_location_id: from_location_id || null,
          to_location_id: to_location_id || null,
          movement_type,
          quantity: qty,
          reference: reference || null,
          notes: notes || null,
          performed_by: session.user.id
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 400 });
  }
}
