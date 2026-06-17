import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const hsnCodes = await prisma.hsnCode.findMany({
      orderBy: { code: "asc" }
    });
    return NextResponse.json(hsnCodes);
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
    const { code, description, gst_rate } = body;

    if (!code || !description) {
      return NextResponse.json({ error: "Code and description are required" }, { status: 400 });
    }

    const existing = await prisma.hsnCode.findUnique({
      where: { code }
    });

    if (existing) {
      return NextResponse.json({ error: "HSN Code already exists" }, { status: 400 });
    }

    const created = await prisma.hsnCode.create({
      data: {
        code,
        description,
        gst_rate: gst_rate ? parseFloat(gst_rate) : null
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
