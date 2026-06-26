import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const field = searchParams.get("field");

  if (!field) {
    return NextResponse.json({ error: "Field parameter is required" }, { status: 400 });
  }

  try {
    let suggestions: string[] = [];

    switch (field) {
      case "part_name":
        const names = await prisma.part.findMany({
          select: { name: true },
          distinct: ["name"],
          orderBy: { name: "asc" }
        });
        suggestions = names.map(n => n.name).filter(Boolean);
        break;

      case "part_number":
        const partNumbers = await prisma.part.findMany({
          select: { part_number: true },
          distinct: ["part_number"],
          orderBy: { part_number: "asc" }
        });
        suggestions = partNumbers.map(n => n.part_number).filter(Boolean) as string[];
        break;

      case "package":
        const packages = await prisma.part.findMany({
          select: { package: true },
          distinct: ["package"],
          orderBy: { package: "asc" }
        });
        suggestions = packages.map(n => n.package).filter(Boolean) as string[];
        break;

      case "purchase_site":
        const sites = await prisma.trackedOrder.findMany({
          select: { purchase_site: true },
          distinct: ["purchase_site"],
          orderBy: { purchase_site: "asc" }
        });
        suggestions = sites.map(n => n.purchase_site).filter(Boolean);
        break;

      case "zone":
        const zones = await prisma.location.findMany({
          select: { zone: true },
          distinct: ["zone"],
          orderBy: { zone: "asc" }
        });
        suggestions = zones.map(n => n.zone).filter(Boolean);
        break;

      // Extract specifications from comments
      case "voltage":
      case "current":
      case "manufacturer":
      case "valSpec":
      case "tolerance":
      case "commProtocol":
      case "frequency":
      case "supplier":
        const allParts = await prisma.part.findMany({
          select: { comment: true },
          where: { comment: { not: null } }
        });
        
        const specMap: Record<string, RegExp> = {
          voltage: /Voltage:\s*([^,\|]+)/i,
          current: /Current:\s*([^,\|]+)/i,
          manufacturer: /Manufacturer:\s*([^,\|]+)/i,
          valSpec: /Value:\s*([^,\|]+)/i,
          tolerance: /Tolerance:\s*([^,\|]+)/i,
          commProtocol: /Protocols:\s*([^,\|]+)/i,
          frequency: /Freq:\s*([^,\|]+)/i,
          supplier: /Supplier:\s*([^,\|]+)/i,
        };
        
        const regex = specMap[field as string];
        const extracted = allParts.map(p => {
          if (!p.comment) return null;
          const match = p.comment.match(regex);
          return match ? match[1].trim() : null;
        }).filter(Boolean) as string[];
        
        suggestions = [...new Set(extracted)].sort();
        break;

      default:
        return NextResponse.json({ error: "Invalid field parameter" }, { status: 400 });
    }

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Failed to fetch suggestions:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
