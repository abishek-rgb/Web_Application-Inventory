import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden - Super Admin access required" }, { status: 403 });
  }

  try {
    // Total DB Size
    const sizeResult: any[] = await prisma.$queryRaw`SELECT pg_database_size(current_database()) as size_bytes`;
    const sizeBytes = sizeResult[0]?.size_bytes ? Number(sizeResult[0].size_bytes) : 0;

    // Active Connections
    const connectionsResult: any[] = await prisma.$queryRaw`SELECT count(*) as active_connections FROM pg_stat_activity`;
    const activeConnections = connectionsResult[0]?.active_connections ? Number(connectionsResult[0].active_connections) : 0;

    // Top 5 Largest Tables
    const tablesResult: any[] = await prisma.$queryRaw`
      SELECT relname as table_name, pg_total_relation_size(relid) as size_bytes
      FROM pg_catalog.pg_statio_user_tables 
      ORDER BY pg_total_relation_size(relid) DESC 
      LIMIT 5
    `;

    const topTables = tablesResult.map((t) => ({
      name: t.table_name,
      sizeBytes: Number(t.size_bytes),
    }));

    return NextResponse.json({
      sizeBytes,
      activeConnections,
      topTables,
      maxSizeBytes: 524288000, // 500 MB hardcoded for Neon Free Tier
      status: "Connected"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, status: "Error" }, { status: 500 });
  }
}
