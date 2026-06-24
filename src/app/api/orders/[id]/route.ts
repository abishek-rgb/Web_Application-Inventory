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
    const { status, security_floor, received_date, received_with_invoice } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const dataToUpdate: any = { status };

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

    const updatedOrder = await prisma.trackedOrder.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
