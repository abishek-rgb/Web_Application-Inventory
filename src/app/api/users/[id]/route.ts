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

  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden - Super Admin access required" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, role, is_active } = body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name !== undefined ? name : user.name,
        role: role !== undefined ? role : user.role,
        is_active: is_active !== undefined ? is_active : user.is_active
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true
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

    // Optional: Prevent deleting the currently logged-in user
    if (session.user.id === id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
