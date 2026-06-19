import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parts = await prisma.part.findMany({
      include: {
        category: true,
        subcategory: true,
        hsn_code: true,
        stock_entries: { include: { location: true } }
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }]
    });

    const movements = await prisma.stockMovement.findMany({
      include: {
        part: { include: { category: true } },
        from_location: true,
        to_location: true,
        user: true
      },
      orderBy: { performed_at: "desc" }
    });

    return NextResponse.json({ parts, movements, generatedBy: session.user.name, generatedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
