import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.trackedOrder.findMany({
      orderBy: { created_at: "desc" },
      include: {
        creator: {
          select: { name: true, email: true }
        },
        items: true
      }
    });

    return NextResponse.json(orders);
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
    const { order_id, order_date, purchase_site, total_price, order_url, items } = body;

    if (!order_id || !order_date || !purchase_site) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const order = await prisma.trackedOrder.create({
      data: {
        order_id,
        order_date: new Date(order_date),
        purchase_site,
        total_price: total_price ? parseFloat(total_price) : null,
        order_url: order_url || null,
        status: "ENROLLED",
        created_by: session.user.id,
        items: {
          create: items && Array.isArray(items) ? items.map((item: any) => ({
            component_name: item.component_name,
            quantity: item.quantity,
            price: item.price ? parseFloat(item.price) : null
          })) : []
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Order ID already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
