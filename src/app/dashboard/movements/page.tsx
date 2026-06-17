"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeftRight, Plus, Loader2, AlertCircle, Calendar, User, FileText } from "lucide-react";

interface Part {
  id: string;
  name: string;
  part_number: string | null;
  stock_entries: Array<{
    location: {
      id: string;
      label: string;
    };
    quantity: number;
  }>;
}

interface LocationItem {
  id: string;
  label: string;
}

interface Movement {
  id: string;
  movement_type: "IN" | "OUT" | "TRANSFER" | "ADJUSTMENT";
  quantity: number;
  reference: string | null;
  notes: string | null;
  performed_at: string;
  part: {
    name: string;
  };
  from_location: {
    label: string;
  } | null;
  to_location: {
    label: string;
  } | null;
  user: {
    name: string;
  };
}

export default function MovementsPage() {
  const { data: session } = useSession();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [partId, setPartId] = useState("");
  const [movementType, setMovementType] = useState<"IN" | "OUT" | "TRANSFER" | "ADJUSTMENT">("IN");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";
  const selectedPart = parts.find((p) => p.id === partId);

  const fetchData = async () => {
    try {
      const [moveRes, partsRes, locRes] = await Promise.all([
        fetch("/api/stock/movement"),
        fetch("/api/parts"),
        fetch("/api/locations")
      ]);

      if (!moveRes.ok || !partsRes.ok || !locRes.ok) {
        throw new Error("Failed to load page data");
      }

      const moveData = await moveRes.json();
      const partsData = await partsRes.json();
      const locData = await locRes.json();

      setMovements(moveData);
      setParts(partsData);
      setLocations(locData);
    } catch (err) {
      setError("Failed to load stock movements data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/stock/movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part_id: partId,
          from_location_id: movementType === "OUT" || movementType === "TRANSFER" ? fromLocationId : undefined,
          to_location_id: movementType === "IN" || movementType === "TRANSFER" || movementType === "ADJUSTMENT" ? toLocationId : undefined,
          movement_type: movementType,
          quantity: parseInt(quantity),
          reference,
          notes
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to log movement");
      }

      // Reset Form fields except selections to make repeated entries easy
      setQuantity("1");
      setReference("");
      setNotes("");
      
      // Refresh Lists
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case "IN": return "bg-success/15 text-success border-success/20";
      case "OUT": return "bg-danger/15 text-danger border-danger/20";
      case "TRANSFER": return "bg-info/15 text-info border-info/20";
      case "ADJUSTMENT": return "bg-warning/15 text-warning border-warning/20";
      default: return "bg-surface text-text-secondary border-border";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-wide">Stock Movements</h2>
        <p className="text-sm text-text-secondary">Track IN/OUT/TRANSFER logistics and record physical inventory corrections</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Movements History */}
        <div className="xl:col-span-2 bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
            <ArrowLeftRight className="w-5 h-5 mr-2 text-primary" />
            Audit History Log
          </h3>

          {loading ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger text-danger p-4 rounded text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          ) : movements.length === 0 ? (
            <p className="text-sm text-text-secondary py-12 text-center">No movements recorded yet.</p>
          ) : (
            <div className="overflow-x-auto flex-1 max-h-[600px] overflow-y-auto pr-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-xs uppercase font-semibold">
                    <th className="py-3 px-4">Part</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">From</th>
                    <th className="py-3 px-4">To</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text-primary">
                  {movements.map((move) => (
                    <tr key={move.id} className="hover:bg-bg/20 transition-colors">
                      <td className="py-3 px-4 font-bold">{move.part.name}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getMovementBadge(move.movement_type)}`}>
                          {move.movement_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">{move.quantity}</td>
                      <td className="py-3 px-4 text-xs text-text-secondary">{move.from_location?.label || "—"}</td>
                      <td className="py-3 px-4 text-xs text-text-secondary">{move.to_location?.label || "—"}</td>
                      <td className="py-3 px-4 text-xs space-y-1">
                        <div className="flex items-center text-text-secondary">
                          <User className="w-3.5 h-3.5 mr-1" /> {move.user.name}
                        </div>
                        <div className="flex items-center text-text-secondary">
                          <Calendar className="w-3.5 h-3.5 mr-1" /> {new Date(move.performed_at).toLocaleDateString()}
                        </div>
                        {move.reference && (
                          <div className="flex items-center text-primary font-mono text-[10px]">
                            <FileText className="w-3 h-3 mr-1" /> {move.reference}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Record Movement Form */}
        <div className="bg-surface border border-border rounded-lg p-6 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-primary" />
            Record Movement
          </h3>

          {formError && (
            <div className="bg-danger/10 border border-danger text-danger p-3 rounded text-sm mb-4">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Select Component *</label>
              <select
                value={partId}
                onChange={(e) => {
                  setPartId(e.target.value);
                  setFromLocationId("");
                  setToLocationId("");
                }}
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                required
              >
                <option value="">Choose Part</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.part_number ? `(${p.part_number})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Movement Type *</label>
              <select
                value={movementType}
                onChange={(e) => {
                  setMovementType(e.target.value as any);
                  setFromLocationId("");
                  setToLocationId("");
                }}
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                required
              >
                <option value="IN">IN (Stock Intake / Purchase)</option>
                <option value="OUT">OUT (Material consumption / Scrap)</option>
                <option value="TRANSFER">TRANSFER (Rack change)</option>
                {isAdmin && <option value="ADJUSTMENT">ADJUSTMENT (Audit correction - Admin only)</option>}
              </select>
            </div>

            {/* Source Location (Visible for OUT and TRANSFER) */}
            {(movementType === "OUT" || movementType === "TRANSFER") && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Source Location (Stock Source) *
                </label>
                <select
                  value={fromLocationId}
                  onChange={(e) => setFromLocationId(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary border-danger/30"
                  required
                >
                  <option value="">Select Source Location</option>
                  {selectedPart?.stock_entries.map((entry) => (
                    <option key={entry.location.id} value={entry.location.id}>
                      {entry.location.label} (Current Qty: {entry.quantity})
                    </option>
                  ))}
                  {(!selectedPart || selectedPart.stock_entries.length === 0) && (
                    <option disabled>No stock entries found for this component</option>
                  )}
                </select>
              </div>
            )}

            {/* Destination Location (Visible for IN, TRANSFER, and ADJUSTMENT) */}
            {(movementType === "IN" || movementType === "TRANSFER" || movementType === "ADJUSTMENT") && (
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Destination Location *
                </label>
                <select
                  value={toLocationId}
                  onChange={(e) => setToLocationId(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                {movementType === "ADJUSTMENT" ? "Absolute Stock Value *" : "Quantity *"}
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Reference (e.g. PO, Project ID)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Reference info"
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Notes / Remarks</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for movement..."
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary h-20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary-dark text-bg font-bold py-2 px-4 rounded text-sm flex justify-center items-center transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Post Movement"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
