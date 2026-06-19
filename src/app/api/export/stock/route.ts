import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all parts with full details
    const parts = await prisma.part.findMany({
      include: {
        category: true,
        subcategory: true,
        hsn_code: true,
        stock_entries: {
          include: { location: true }
        }
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }]
    });

    // Fetch stock movements
    const movements = await prisma.stockMovement.findMany({
      include: {
        part: true,
        from_location: true,
        to_location: true,
        user: true
      },
      orderBy: { performed_at: "desc" },
      take: 500 // last 500 movements
    });

    // ── Sheet 1: Stock Inventory ─────────────────────────────────────────────
    const inventoryRows: any[] = [];

    for (const part of parts) {
      if (part.stock_entries.length === 0) {
        inventoryRows.push({
          "Part Name": part.name,
          "Part Number": part.part_number || "",
          "Category": part.category.label,
          "Sub-Category": part.subcategory?.label || "",
          "Package": part.package || "",
          "HSN Code": part.hsn_code.code,
          "Location Zone": "",
          "Location Label": "No Stock Entry",
          "Location ID": "",
          "Quantity": 0,
          "Unit": "pcs",
          "Min Qty Alert": "",
          "Total Stock (Part)": 0,
          "Price per Unit (₹)": part.price_per_unit ?? "",
          "Purchase Link": part.purchase_url || "",
          "Datasheet": part.datasheet_url || "",
          "Comments": part.comment || ""
        });
      } else {
        const totalQty = part.stock_entries.reduce((s, e) => s + e.quantity, 0);
        for (const entry of part.stock_entries) {
          // Clean location label (remove Default Shelf / Default Bin)
          const cleanLabel = entry.location.label
            .split(" > ")
            .filter(p => !p.toLowerCase().includes("default shelf") && !p.toLowerCase().includes("default bin"))
            .join(" > ");

          inventoryRows.push({
            "Part Name": part.name,
            "Part Number": part.part_number || "",
            "Category": part.category.label,
            "Sub-Category": part.subcategory?.label || "",
            "Package": part.package || "",
            "HSN Code": part.hsn_code.code,
            "Location Zone": entry.location.zone,
            "Location Label": cleanLabel,
            "Location ID": entry.location.id,
            "Quantity": entry.quantity,
            "Unit": entry.unit,
            "Min Qty Alert": entry.min_quantity ?? "",
            "Total Stock (Part)": totalQty,
            "Price per Unit (₹)": part.price_per_unit ?? "",
            "Purchase Link": part.purchase_url || "",
            "Datasheet": part.datasheet_url || "",
            "Comments": part.comment || ""
          });
        }
      }
    }

    // ── Sheet 2: Stock Movements ─────────────────────────────────────────────
    const movementRows = movements.map(m => ({
      "Date": new Date(m.performed_at).toLocaleString("en-IN"),
      "Part Name": m.part.name,
      "Movement Type": m.movement_type,
      "Quantity": m.quantity,
      "From Location": m.from_location?.label || "—",
      "To Location": m.to_location?.label || "—",
      "Reference": m.reference || "",
      "Notes": m.notes || "",
      "Performed By": m.user.name
    }));

    // ── Summary Sheet ────────────────────────────────────────────────────────
    const categoryMap: Record<string, { count: number; totalQty: number }> = {};
    for (const part of parts) {
      const cat = part.category.label;
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, totalQty: 0 };
      categoryMap[cat].count++;
      categoryMap[cat].totalQty += part.stock_entries.reduce((s, e) => s + e.quantity, 0);
    }

    const summaryRows = [
      { "Metric": "Total Parts", "Value": parts.length },
      { "Metric": "Total Stock Entries", "Value": parts.reduce((s, p) => s + p.stock_entries.length, 0) },
      { "Metric": "Total Quantity (All Parts)", "Value": parts.reduce((s, p) => s + p.stock_entries.reduce((ss, e) => ss + e.quantity, 0), 0) },
      { "Metric": "Report Generated On", "Value": new Date().toLocaleString("en-IN") },
      { "Metric": "", "Value": "" },
      { "Metric": "--- By Category ---", "Value": "" },
      ...Object.entries(categoryMap).map(([cat, data]) => ({
        "Metric": `${cat} — Parts`,
        "Value": `${data.count} parts / ${data.totalQty} units`
      }))
    ];

    // ── Build Workbook ───────────────────────────────────────────────────────
    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 35 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    const wsInventory = XLSX.utils.json_to_sheet(inventoryRows);
    wsInventory["!cols"] = [
      { wch: 35 }, { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
      { wch: 10 }, { wch: 12 }, { wch: 28 }, { wch: 38 },
      { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 16 },
      { wch: 16 }, { wch: 40 }, { wch: 40 }, { wch: 35 }
    ];
    XLSX.utils.book_append_sheet(wb, wsInventory, "Stock Inventory");

    const wsMovements = XLSX.utils.json_to_sheet(movementRows);
    wsMovements["!cols"] = [
      { wch: 20 }, { wch: 35 }, { wch: 14 }, { wch: 10 },
      { wch: 28 }, { wch: 28 }, { wch: 18 }, { wch: 30 }, { wch: 18 }
    ];
    XLSX.utils.book_append_sheet(wb, wsMovements, "Stock Movements");

    // ── Return as binary Excel file ──────────────────────────────────────────
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `SeculogixInStock_Report_${dateStr}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buf.length.toString()
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
