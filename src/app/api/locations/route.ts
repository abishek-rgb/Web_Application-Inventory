import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const locations = await prisma.location.findMany({
      orderBy: [
        { zone: "asc" },
        { rack: "asc" },
        { shelf: "asc" },
        { bin: "asc" }
      ]
    });
    return NextResponse.json(locations);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { zone, rack, shelf, bin, description } = body;

    if (!zone) {
      return NextResponse.json({ error: "Zone is required" }, { status: 400 });
    }

    const computedLabel = `${zone} > ${rack || "Default"} > ${shelf || "Default"} > ${bin || "Default"}`;

    const existing = await prisma.location.findFirst({
      where: { label: computedLabel }
    });

    if (existing) {
      return NextResponse.json({ error: "Location already exists" }, { status: 400 });
    }

    const created = await prisma.location.create({
      data: {
        zone,
        rack: rack || null,
        shelf: shelf || null,
        bin: bin || null,
        label: computedLabel,
        description: description || null
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
