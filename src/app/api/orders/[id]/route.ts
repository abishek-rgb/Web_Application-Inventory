import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
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
    const { status, security_floor, received_date, received_with_invoice, items } = body;

    const dataToUpdate: any = {};

    if (status) {
      dataToUpdate.status = status;
      if (status === "IN_SECURITY") {
        if (!security_floor) {
          return NextResponse.json({ error: "Security floor is required when status is IN_SECURITY" }, { status: 400 });
        }
        dataToUpdate.security_floor = security_floor;
      } else if (status === "RECEIVED") {
        if (!received_date || typeof received_with_invoice !== 'boolean') {
          return NextResponse.json({ error: "Received date and invoice status are required when status is RECEIVED" }, { status: 400 });
        }
        dataToUpdate.received_date = new Date(received_date);
        dataToUpdate.received_with_invoice = received_with_invoice;
      }
    }

    if (Object.keys(dataToUpdate).length > 0) {
      await prisma.trackedOrder.update({
        where: { id },
        data: dataToUpdate
      });
    }

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.id && typeof item.is_received === 'boolean') {
          await prisma.trackedOrderItem.update({
            where: { id: item.id },
            data: { is_received: item.is_received }
          });
        }
      }
    }

    const updatedOrder = await prisma.trackedOrder.findUnique({
      where: { id },
      include: { items: true }
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    
    // Explicitly delete all associated items first to prevent foreign key constraint failures
    await prisma.trackedOrderItem.deleteMany({
      where: { tracked_order_id: id }
    });

    // Then delete the order itself
    await prisma.trackedOrder.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
