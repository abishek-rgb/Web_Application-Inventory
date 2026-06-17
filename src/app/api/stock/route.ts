import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stockEntries = await prisma.stockEntry.findMany({
      include: {
        part: true,
        location: true
      },
      orderBy: { updated_at: "desc" }
    });
    return NextResponse.json(stockEntries);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
