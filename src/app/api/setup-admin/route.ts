import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const email1 = 'abishek@seculogics.in';
    const email2 = 'abishek@seculogix.in';

    const result = await prisma.user.updateMany({
      where: {
        email: { in: [email1, email2] }
      },
      data: {
        role: 'SUPER_ADMIN'
      }
    });

    return NextResponse.json({ message: "Successfully updated roles to SUPER_ADMIN", count: result.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
