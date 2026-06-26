"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Package2, Search, Filter, Plus, ArrowLeftRight, Edit, Trash2, Loader2, AlertCircle, ExternalLink, X, MapPin, ChevronRight, FileDown, FileText } from "lucide-react";
import Link from "next/link";

const formatLocationLabel = (label: string) => {
  return label
    .split(" > ")
    .filter(part => !part.toLowerCase().includes("default shelf") && !part.toLowerCase().includes("default bin"))
    .join(" > ");
};

interface LocationItem {
  id: string;
  label: string;
  zone: string;
  rack: string | null;
  shelf: string | null;
  bin: string | null;
}

interface StockEntry {
  id: string;
  quantity: number;
  unit: string;
  min_quantity: number | null;
  location: {
    id: string;
    label: string;
    zone: string;
    rack: string | null;
    shelf: string | null;
    bin: string | null;
  };
}

interface Part {
  id: string;
  name: string;
  part_number: string | null;
  package: string | null;
  comment: string | null;
  datasheet_url: string | null;
  purchase_url: string | null;
  price_per_unit: number | null;
  category: {
    id: string;
    name: string;
    label: string;
  };
  subcategory: {
    id: string;
    name: string;
    label: string;
  } | null;
  hsn_code: {
    id: string;
    code: string;
  };
  stock_entries: StockEntry[];
}

// â”€â”€ Location Entry Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LocationEntryRow({
  entry,
  allLocations,
  onSaved,
}: {
  entry: StockEntry;
  allLocations: LocationItem[];
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [locationMode, setLocationMode] = useState<"existing" | "new">("existing");

  // Existing location fields
  const [selectedLocationId, setSelectedLocationId] = useState(entry.location.id);

  // New location fields
  const [newZone, setNewZone] = useState("");
  const [newRack, setNewRack] = useState("");
  const [newShelf, setNewShelf] = useState("");
  const [newBin, setNewBin] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Shared
  const [minQty, setMinQty] = useState(entry.min_quantity?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setErr("");

    if (locationMode === "new" && !newZone.trim()) {
      setErr("Zone / Area is required for a new location.");
      setSaving(false);
      return;
    }

    try {
      const payload: Record<string, any> = {
        min_quantity: minQty !== "" ? parseInt(minQty) : null
      };

      if (locationMode === "existing") {
        payload.location_id = selectedLocationId;
      } else {
        payload.new_location = {
          zone: newZone.trim(),
          rack: newRack.trim() || null,
          shelf: newShelf.trim() || null,
          bin: newBin.trim() || null,
          description: newDescription.trim() || null
        };
      }

      const res = await fetch(`/api/stock/entry/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      setEditing(false);
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedLocationId(entry.location.id);
    setLocationMode("existing");
    setNewZone(""); setNewRack(""); setNewShelf(""); setNewBin(""); setNewDescription("");
    setMinQty(entry.min_quantity?.toString() ?? "");
    setErr("");
    setEditing(false);
  };

  return (
    <div className="border border-border/60 rounded-lg bg-bg/30 p-3 space-y-2">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold text-text-primary truncate">
              {formatLocationLabel(entry.location.label)}
            </span>
          </div>
          <div className="text-[10px] text-text-secondary font-mono mt-0.5 pl-5">
            ID: {entry.location.id}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 bg-primary/10 text-primary font-mono text-xs rounded font-bold">
            {entry.quantity} {entry.unit}
          </span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 text-text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="Edit location"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Edit fields */}
      {editing && (
        <div className="space-y-3 pt-2 border-t border-border/40">
          {err && (
            <div className="text-danger text-xs bg-danger/10 border border-danger/30 rounded p-2">
              {err}
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLocationMode("existing")}
              className={`flex-1 py-1.5 transition-colors ${
                locationMode === "existing"
                  ? "bg-primary text-bg"
                  : "bg-bg/30 text-text-secondary hover:text-text-primary"
              }`}
            >
              Select Existing
            </button>
            <button
              type="button"
              onClick={() => setLocationMode("new")}
              className={`flex-1 py-1.5 transition-colors ${
                locationMode === "new"
                  ? "bg-primary text-bg"
                  : "bg-bg/30 text-text-secondary hover:text-text-primary"
              }`}
            >
              + Create New
            </button>
          </div>

          {/* Existing Location Selector */}
          {locationMode === "existing" && (
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1">
                Select Location
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full px-2 py-1.5 bg-bg border border-border rounded text-text-primary text-xs focus:outline-none focus:border-primary"
              >
                {allLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {formatLocationLabel(loc.label)} (ID: {loc.id.slice(-6)})
                  </option>
                ))}
              </select>
              {selectedLocationId !== entry.location.id && (
                <p className="text-[10px] text-warning mt-1">
                  âš  This will move all {entry.quantity} {entry.unit} to the new location.
                  For partial moves, use a TRANSFER movement.
                </p>
              )}
            </div>
          )}

          {/* New Location Form */}
          {locationMode === "new" && (
            <div className="space-y-2 bg-bg/20 border border-border/40 rounded-lg p-3">
              <p className="text-[10px] text-text-secondary uppercase font-semibold mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" /> New Location Details
              </p>
              <div>
                <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1">
                  Zone / Area <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  placeholder="e.g. Store, Lab, Shelf-A"
                  className="w-full px-2 py-1.5 bg-bg border border-border rounded text-text-primary text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1">Rack</label>
                  <input
                    type="text"
                    value={newRack}
                    onChange={(e) => setNewRack(e.target.value)}
                    placeholder="e.g. R1"
                    className="w-full px-2 py-1.5 bg-bg border border-border rounded text-text-primary text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1">Shelf</label>
                  <input
                    type="text"
                    value={newShelf}
                    onChange={(e) => setNewShelf(e.target.value)}
                    placeholder="e.g. S2"
                    className="w-full px-2 py-1.5 bg-bg border border-border rounded text-text-primary text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1">Bin</label>
                  <input
                    type="text"
                    value={newBin}
                    onChange={(e) => setNewBin(e.target.value)}
                    placeholder="e.g. B3"
                    className="w-full px-2 py-1.5 bg-bg border border-border rounded text-text-primary text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Top drawer, left side"
                  className="w-full px-2 py-1.5 bg-bg border border-border rounded text-text-primary text-xs focus:outline-none focus:border-primary"
                />
              </div>
              {newZone && (
                <div className="text-[10px] text-text-secondary bg-primary/5 border border-primary/20 rounded px-2 py-1 font-mono">
                  Preview: <span className="text-primary font-bold">
                    {newZone}{newRack ? ` > ${newRack}` : ""}{newShelf ? ` > ${newShelf}` : ""}{newBin ? ` > ${newBin}` : ""}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Min Qty */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase mb-1">
              Min Quantity Alert
            </label>
            <input
              type="number"
              min="0"
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
              placeholder="e.g. 5"
              className="w-full px-2 py-1.5 bg-bg border border-border rounded text-text-primary text-xs focus:outline-none focus:border-primary font-mono"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-dark text-bg font-bold py-1.5 rounded text-xs flex justify-center items-center gap-1 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply Changes"}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="flex-1 border border-border hover:bg-bg/40 text-text-primary py-1.5 rounded text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PartsPage() {
  const { data: session } = useSession();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hsnCodes, setHsnCodes] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<LocationItem[]>([]);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [editTab, setEditTab] = useState<"specs" | "locations">("specs");

  // Specs tab fields
  const [editName, setEditName] = useState("");
  const [editPartNumber, setEditPartNumber] = useState("");
  const [editPackage, setEditPackage] = useState("");
  const [editDatasheetUrl, setEditDatasheetUrl] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editHsnCodeId, setEditHsnCodeId] = useState("");
  const [editPurchaseUrl, setEditPurchaseUrl] = useState("");
  const [editPricePerUnit, setEditPricePerUnit] = useState("");
  const [updating, setUpdating] = useState(false);

  const isViewer = session?.user?.role === "VIEWER";
  const isAdmin = session?.user?.role === "ADMIN";
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const handleDeletePart = async (partId: string) => {
    if (!confirm("Are you sure you want to permanently delete this part and all its stock history?")) return;
    
    try {
      const res = await fetch(`/api/parts/${partId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete part");
      }
      fetchParts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const res = await fetch("/api/export/stock");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SeculogixInStock_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      const { default: jsPDF } = await import("jspdf");

      const res = await fetch("/api/export/report");
      if (!res.ok) throw new Error("Failed to fetch report data");
      const { parts, movements, generatedBy, generatedAt } = await res.json();

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;
      const contentW = pageW - margin * 2;
      const dateStr = new Date(generatedAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });

      const clean = (label: string) =>
        label.split(" > ")
          .filter((p: string) => !p.toLowerCase().includes("default shelf") && !p.toLowerCase().includes("default bin"))
          .join(" > ");

      const addPageHeader = () => {
        doc.setFillColor(20, 20, 20);
        doc.rect(0, 0, pageW, 16, "F");
        doc.setTextColor(230, 160, 30);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.text("SECULOGIX \u2014 InStock Inventory Report", pageW / 2, 10, { align: "center" });
      };

      const writeParagraph = (text: string, y: number, size = 9.5, color: [number,number,number] = [40,40,40]): number => {
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(text, contentW);
        if (y + lines.length * 5.5 > 280) {
          doc.addPage(); addPageHeader(); y = 24;
        }
        doc.text(lines, margin, y);
        return y + lines.length * 5.5 + 3;
      };

      const writeSectionTitle = (title: string, y: number): number => {
        if (y + 14 > 280) { doc.addPage(); addPageHeader(); y = 24; }
        doc.setFontSize(11.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 20);
        doc.text(title, margin, y);
        y += 2;
        doc.setDrawColor(230, 160, 30);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        return y + 7;
      };

      // â”€â”€ Compute stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const totalQty = parts.reduce((s: number, p: any) => s + p.stock_entries.reduce((ss: number, e: any) => ss + e.quantity, 0), 0);
      const inStockParts = parts.filter((p: any) => p.stock_entries.some((e: any) => e.quantity > 0));
      const zeroStockParts = parts.filter((p: any) => p.stock_entries.length === 0 || p.stock_entries.every((e: any) => e.quantity === 0));
      const lowStockParts = parts.filter((p: any) => p.stock_entries.some((e: any) => e.min_quantity !== null && e.quantity < e.min_quantity && e.quantity > 0));
      const totalCost = parts.reduce((s: number, p: any) => {
        if (!p.price_per_unit) return s;
        return s + p.stock_entries.reduce((ss: number, e: any) => ss + e.quantity * p.price_per_unit, 0);
      }, 0);
      const uniqueLocations = new Set<string>();
      for (const p of parts) for (const e of p.stock_entries) uniqueLocations.add(e.location.id);
      const catMap: Record<string, { count: number; qty: number; cost: number }> = {};
      for (const p of parts) {
        const cat = p.category.label;
        if (!catMap[cat]) catMap[cat] = { count: 0, qty: 0, cost: 0 };
        catMap[cat].count++;
        const qty = p.stock_entries.reduce((s: number, e: any) => s + e.quantity, 0);
        catMap[cat].qty += qty;
        if (p.price_per_unit) catMap[cat].cost += qty * p.price_per_unit;
      }
      const inCount = movements.filter((m: any) => m.movement_type === "IN").length;
      const outCount = movements.filter((m: any) => m.movement_type === "OUT").length;
      const transferCount = movements.filter((m: any) => m.movement_type === "TRANSFER").length;
      const adjCount = movements.filter((m: any) => m.movement_type === "ADJUSTMENT").length;

      // â”€â”€ PAGE 1: Cover â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      doc.setFillColor(20, 20, 20);
      doc.rect(0, 0, pageW, 42, "F");
      doc.setTextColor(230, 160, 30);
      doc.setFontSize(26);
      doc.setFont("helvetica", "bold");
      doc.text("SECULOGIX", pageW / 2, 20, { align: "center" });
      doc.setTextColor(210, 210, 210);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("InStock \u2014 Inventory Summary Report", pageW / 2, 30, { align: "center" });
      doc.setTextColor(140, 140, 140);
      doc.setFontSize(8.5);
      doc.text(`Report Date: ${dateStr}   |   Prepared by: ${generatedBy}`, pageW / 2, 38, { align: "center" });

      let y = 54;

      // â”€â”€ SECTION 1: Executive Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      y = writeSectionTitle("1. Executive Summary", y);
      y = writeParagraph(
        `As of ${dateStr}, the SECULOGIX InStock inventory system holds ${parts.length} registered components across ${uniqueLocations.size} storage location(s). Of these, ${inStockParts.length} part(s) are currently in stock with a combined quantity of ${totalQty} unit(s), while ${zeroStockParts.length} part(s) have zero stock available. The estimated total inventory value, based on available price-per-unit records, is \u20B9${totalCost.toFixed(2)}. A total of ${movements.length} stock movement(s) have been recorded in the system to date, comprising ${inCount} receipt(s), ${outCount} dispatch(es), ${transferCount} internal transfer(s), and ${adjCount} adjustment(s).`,
        y
      );

      // â”€â”€ SECTION 2: Category Breakdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      y += 3;
      y = writeSectionTitle("2. Stock Breakdown by Category", y);
      for (const [cat, d] of Object.entries(catMap) as [string, { count: number; qty: number; cost: number }][]) {
        y = writeParagraph(
          `\u2022 ${cat}: ${d.count} part(s) registered, ${d.qty} unit(s) in stock${d.cost > 0 ? `, estimated value \u20B9${d.cost.toFixed(2)}` : ", cost data not available"}.`,
          y, 9.5
        );
      }

      // â”€â”€ SECTION 3: Stock Status & Alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      y += 3;
      y = writeSectionTitle("3. Stock Status & Alerts", y);
      if (lowStockParts.length > 0) {
        y = writeParagraph(`${lowStockParts.length} component(s) have fallen below their minimum quantity threshold and require immediate attention:`, y);
        for (const p of lowStockParts) {
          const entry = p.stock_entries.find((e: any) => e.min_quantity !== null && e.quantity < e.min_quantity);
          y = writeParagraph(`\u2022 ${p.name} \u2014 Current: ${entry?.quantity ?? 0} unit(s) | Minimum required: ${entry?.min_quantity} unit(s) at ${clean(entry?.location?.label ?? "-")}.`, y, 9, [180, 100, 0]);
        }
      } else {
        y = writeParagraph("All stocked components are above their minimum quantity thresholds. No immediate restocking action is required.", y);
      }
      if (zeroStockParts.length > 0) {
        y += 1;
        const names = zeroStockParts.slice(0, 8).map((p: any) => p.name).join(", ") + (zeroStockParts.length > 8 ? ` and ${zeroStockParts.length - 8} more` : "");
        y = writeParagraph(`${zeroStockParts.length} component(s) with zero stock: ${names}.`, y, 9, [170, 50, 50]);
      }

      // â”€â”€ SECTION 4: Movement Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      y += 3;
      y = writeSectionTitle("4. Stock Movement Summary", y);
      y = writeParagraph(
        `${movements.length} stock movement(s) are recorded in total. Breakdown: ${inCount} stock receipt(s) (IN) represent components added to inventory; ${outCount} dispatch(es) (OUT) indicate components issued or removed; ${transferCount} transfer(s) reflect internal location changes; and ${adjCount} adjustment(s) account for audit corrections. These movements form the complete audit trail of all inventory activity.`,
        y
      );

      // â”€â”€ PAGE 2+: Detailed Movement Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      doc.addPage();
      addPageHeader();
      y = 24;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 20, 20);
      doc.text("5. Detailed Stock Movement Log", margin, y);
      y += 2;
      doc.setDrawColor(230, 160, 30);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      const mvWord: Record<string, string> = {
        IN: "received into stock",
        OUT: "dispatched / issued out",
        TRANSFER: "transferred internally",
        ADJUSTMENT: "adjusted by inventory audit"
      };

      if (movements.length === 0) {
        y = writeParagraph("No stock movements have been recorded yet.", y);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 40);

        for (const m of movements) {
          const d = new Date(m.performed_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
          let sentence = "";
          if (m.movement_type === "IN") {
            sentence = `${d}: ${m.quantity} unit(s) of "${m.part.name}" were ${mvWord.IN} at ${m.to_location ? clean(m.to_location.label) : "unknown location"}.`;
          } else if (m.movement_type === "OUT") {
            sentence = `${d}: ${m.quantity} unit(s) of "${m.part.name}" were ${mvWord.OUT} from ${m.from_location ? clean(m.from_location.label) : "unknown location"}.`;
          } else if (m.movement_type === "TRANSFER") {
            sentence = `${d}: ${m.quantity} unit(s) of "${m.part.name}" were ${mvWord.TRANSFER} from ${m.from_location ? clean(m.from_location.label) : "?"} to ${m.to_location ? clean(m.to_location.label) : "?"}.`;
          } else {
            sentence = `${d}: Stock of "${m.part.name}" was ${mvWord.ADJUSTMENT} to ${m.quantity} unit(s) at ${m.to_location ? clean(m.to_location.label) : "?"}.`;
          }
          if (m.reference) sentence += ` Reference: ${m.reference}.`;
          if (m.notes) sentence += ` Notes: ${m.notes}.`;
          sentence += ` \u2014 Performed by ${m.user.name}.`;

          const lines = doc.splitTextToSize(sentence, contentW - 6);
          if (y + lines.length * 5 + 5 > 282) {
            doc.addPage(); addPageHeader(); y = 24;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(40, 40, 40);
          }
          doc.setFillColor(230, 160, 30);
          doc.circle(margin + 1.5, y + 1.5, 1.2, "F");
          doc.text(lines, margin + 5, y);
          y += lines.length * 5 + 4;
        }
      }

      // â”€â”€ Footers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let pg = 1; pg <= totalPages; pg++) {
        doc.setPage(pg);
        doc.setFontSize(7.5);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${pg} of ${totalPages}   |   SECULOGIX InStock   |   ${dateStr}`, pageW / 2, 293, { align: "center" });
      }

      doc.save(`SeculogixInStock_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      console.error("PDF error:", err);
      alert("PDF generation failed: " + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  const fetchParts = async () => {
    try {
      const url = new URL("/api/parts", window.location.origin);
      if (selectedCategory) url.searchParams.append("category", selectedCategory);
      if (searchTerm) url.searchParams.append("search", searchTerm);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch parts");
      const data = await res.json();
      setParts(data);
    } catch (err) {
      setError("Failed to load inventory parts.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHsnCodes = async () => {
    try {
      const res = await fetch("/api/hsn");
      if (res.ok) {
        const data = await res.json();
        setHsnCodes(data);
      }
    } catch (err) {
      console.error("Failed to load HSN codes", err);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations");
      if (res.ok) {
        const data = await res.json();
        setAllLocations(data);
      }
    } catch (err) {
      console.error("Failed to load locations", err);
    }
  };

  useEffect(() => {
    fetchParts();
    fetchHsnCodes();
    fetchLocations();
  }, [selectedCategory, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this part and all its stock records? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/parts/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete part");

      fetchParts();
    } catch (err) {
      alert("Error deleting part.");
    }
  };

  const openEditModal = (part: Part) => {
    setEditPart(part);
    setEditName(part.name);
    setEditPartNumber(part.part_number || "");
    setEditPackage(part.package || "");
    setEditDatasheetUrl(part.datasheet_url || "");
    setEditComment(part.comment === "Imported from spreadsheet" ? "" : (part.comment || ""));
    setEditHsnCodeId(part.hsn_code.id || "");
    setEditPurchaseUrl(part.purchase_url || "");
    setEditPricePerUnit(part.price_per_unit !== null ? part.price_per_unit.toString() : "");
    setEditTab("specs");
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPart) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/parts/${editPart.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          part_number: editPartNumber,
          package: editPackage,
          datasheet_url: editDatasheetUrl,
          purchase_url: editPurchaseUrl || null,
          price_per_unit: editPricePerUnit !== "" ? parseFloat(editPricePerUnit) : null,
          comment: editComment,
          hsn_code_id: editHsnCodeId
        })
      });

      if (!res.ok) throw new Error("Failed to update part");

      setIsEditModalOpen(false);
      fetchParts();
    } catch (err) {
      alert("Error updating part details.");
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryColor = (catName: string) => {
    switch (catName) {
      case "electrical": return "text-warning bg-warning/10 border-warning/20";
      case "electronic": return "text-primary bg-primary/10 border-primary/20";
      case "iot": return "text-info bg-info/10 border-info/20";
      default: return "text-text-secondary bg-surface border-border";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-wide">Inventory Parts</h2>
          <p className="text-sm text-text-secondary">View and manage all registered hardware components</p>
        </div>
        <div className="flex items-center gap-2">
          {!isViewer && (
            <Link
              href="/dashboard/parts/add"
              className="bg-primary hover:bg-primary-dark text-bg font-bold py-2 px-4 rounded text-sm flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Stock Item
            </Link>
          )}
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="border border-border hover:border-primary text-text-secondary hover:text-primary font-semibold py-2 px-4 rounded text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            title="Download full inventory as Excel (3 sheets)"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {exporting ? "Exporting..." : "Export as Excel"}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="border border-border hover:border-danger text-text-secondary hover:text-danger font-semibold py-2 px-4 rounded text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
            title="Download PDF summary report"
          >
            {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {exportingPdf ? "Generating..." : "PDF Report"}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search parts by name, PN, or comments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded text-sm text-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Filter className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-bg border border-border rounded text-sm text-text-primary focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="electrical">Electrical</option>
              <option value="electronic">Electronic</option>
              <option value="iot">IoT</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-danger/10 border border-danger text-danger p-6 m-6 rounded text-sm flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        ) : parts.length === 0 ? (
          <div className="py-24 text-center space-y-2">
            <Package2 className="w-12 h-12 text-text-secondary mx-auto" />
            <p className="text-sm text-text-secondary">No parts found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs uppercase font-semibold bg-[#0A0A0A]">
                  <th className="py-4 px-6">Part Info</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Storage Locations</th>
                  <th className="py-4 px-6 text-right">Total Qty</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm text-text-primary">
                {parts.map((part, index) => {
                  const totalQty = part.stock_entries.reduce((sum, entry) => sum + entry.quantity, 0);
                  const isLowStock = part.stock_entries.some(
                    (entry) => entry.min_quantity !== null && entry.quantity < entry.min_quantity
                  );

                  // zebra striping light black (#1D1D1D) and dark black (#121212)
                  const rowBg = index % 2 === 0 ? "bg-[#141414]" : "bg-[#1C1C1C]";

                  return (
                    <tr key={part.id} className={`${rowBg} hover:bg-bg/40 transition-colors`}>
                      <td className="py-4 px-6 space-y-1">
                        <div className="font-bold text-text-primary">{part.name}</div>
                        {(part.comment && part.comment !== 'Imported from spreadsheet' || part.part_number || part.package || part.datasheet_url || part.purchase_url || part.price_per_unit !== null) && (
                          <div className="flex items-center flex-wrap gap-3 text-xs text-text-secondary">
                            {part.comment && part.comment !== 'Imported from spreadsheet' && (
                              <span className="text-info max-w-[200px] truncate" title={part.comment}>
                                {part.comment}
                              </span>
                            )}
                            {part.part_number && (
                              <span>
                                PN: <span className="font-mono text-primary">{part.part_number}</span>
                              </span>
                            )}
                            {part.package && (
                              <span>
                                Pkg: <span className="font-mono">{part.package}</span>
                              </span>
                            )}
                            {part.datasheet_url && (
                              <a
                                href={part.datasheet_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-info hover:underline flex items-center gap-0.5"
                              >
                                Datasheet <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {part.purchase_url && (
                              <a
                                href={part.purchase_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline flex items-center gap-0.5"
                              >
                                Buy <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {part.price_per_unit !== null && (
                              <span>
                                Price: <span className="font-bold text-success">&#x20B9;{part.price_per_unit.toFixed(2)}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryColor(part.category.name)}`}>
                          {part.category.label}
                          {part.subcategory && ` > ${part.subcategory.label}`}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-2.5">
                          {part.stock_entries.map((entry) => (
                            <div key={entry.id} className="text-xs">
                              <div>
                                <span className="font-semibold text-text-primary">{formatLocationLabel(entry.location.label)}</span>
                                <span className="ml-2 px-1.5 py-0.5 bg-bg/50 rounded text-text-primary font-mono text-[11px]">
                                  {entry.quantity} {entry.unit}
                                </span>
                              </div>
                              <div className="text-[10px] text-text-secondary font-mono mt-0.5">
                                Location ID: {entry.location.id}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold">
                        <span className={isLowStock ? "text-danger" : "text-text-primary"}>
                          {totalQty} {part.stock_entries[0]?.unit || "pcs"}
                        </span>
                        {isLowStock && (
                          <div className="text-[10px] text-danger font-sans font-medium uppercase mt-0.5">Low Stock</div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {!isViewer && (
                            <>
                              <button
                                onClick={() => openEditModal(part)}
                                className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                title="Edit Part"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <Link
                                href="/dashboard/movements"
                                className="p-1.5 text-text-secondary hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                title="Move Stock"
                              >
                                <ArrowLeftRight className="w-4 h-4" />
                              </Link>
                            </>
                          )}
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeletePart(part.id)}
                              className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger/10 rounded transition-colors"
                              title="Delete Part"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Part Modal */}
      {isEditModalOpen && editPart && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex justify-between items-center bg-[#131313] shrink-0">
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Edit: <span className="text-primary truncate max-w-[220px]">{editPart.name}</span>
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border shrink-0 bg-[#131313]">
              <button
                onClick={() => setEditTab("specs")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  editTab === "specs"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Edit className="w-3.5 h-3.5" />
                Specifications
              </button>
              <button
                onClick={() => setEditTab("locations")}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  editTab === "locations"
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Locations
                <span className="text-xs bg-bg/60 px-1.5 py-0.5 rounded-full font-mono">
                  {editPart.stock_entries.length}
                </span>
              </button>
            </div>

            {/* Tab Content â€” scrollable */}
            <div className="overflow-y-auto flex-1">
              {editTab === "specs" && (
                <form onSubmit={handleUpdate} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Part Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Part Number</label>
                      <input
                        type="text"
                        value={editPartNumber}
                        onChange={(e) => setEditPartNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Package</label>
                      <input
                        type="text"
                        value={editPackage}
                        onChange={(e) => setEditPackage(e.target.value)}
                        className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">HSN Code</label>
                    <select
                      value={editHsnCodeId}
                      onChange={(e) => setEditHsnCodeId(e.target.value)}
                      className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                      required
                    >
                      {hsnCodes.map((hsn) => (
                        <option key={hsn.id} value={hsn.id}>
                          {hsn.code} - {hsn.description.substring(0, 40)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Datasheet URL</label>
                    <input
                      type="url"
                      value={editDatasheetUrl}
                      onChange={(e) => setEditDatasheetUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary font-mono text-xs text-info"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Purchase URL / Link</label>
                      <input
                        type="url"
                        value={editPurchaseUrl}
                        onChange={(e) => setEditPurchaseUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary font-mono text-xs text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Price per Unit (INR)</label>
                      <input
                        type="number"
                        step="any"
                        value={editPricePerUnit}
                        onChange={(e) => setEditPricePerUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Comments / Specs</label>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary h-20 resize-none animate-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-border flex justify-end gap-3 bg-[#131313] -mx-6 -mb-6 p-4">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="border border-border hover:bg-bg/40 text-text-primary px-4 py-2 rounded text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="bg-primary hover:bg-primary-dark text-bg font-bold px-5 py-2 rounded text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}

              {editTab === "locations" && (
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-2 bg-info/5 border border-info/20 rounded-lg p-3">
                    <MapPin className="w-4 h-4 text-info shrink-0 mt-0.5" />
                    <div className="text-xs text-text-secondary space-y-0.5">
                      <p className="font-semibold text-info">Location Management</p>
                      <p>You can change where this item is stored. Click the edit icon on any entry below. For partial quantity moves, use the <strong>TRANSFER</strong> movement instead.</p>
                    </div>
                  </div>

                  {editPart.stock_entries.length === 0 ? (
                    <div className="text-center py-10 text-text-secondary text-sm">
                      <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No stock entries for this part.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editPart.stock_entries.map((entry) => (
                        <LocationEntryRow
                          key={entry.id}
                          entry={entry}
                          allLocations={allLocations}
                          onSaved={() => {
                            // Refresh the full parts list and update the modal's part data
                            fetchParts().then(() => {
                              setParts(prev => {
                                const refreshed = prev.find(p => p.id === editPart.id);
                                if (refreshed) setEditPart(refreshed);
                                return prev;
                              });
                            });
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="pt-4 border-t border-border flex justify-end">
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="border border-border hover:bg-bg/40 text-text-primary px-4 py-2 rounded text-sm transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
