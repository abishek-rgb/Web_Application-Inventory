"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MapPin, Plus, Loader2, AlertCircle } from "lucide-react";

interface LocationItem {
  id: string;
  zone: string;
  rack: string | null;
  shelf: string | null;
  bin: string | null;
  label: string;
  description: string | null;
  is_active: boolean;
}

export default function LocationsPage() {
  const { data: session } = useSession();
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [zone, setZone] = useState("");
  const [rack, setRack] = useState("");
  const [shelf, setShelf] = useState("");
  const [bin, setBin] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/locations");
      if (!res.ok) throw new Error("Failed to fetch locations");
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      setError("Failed to load storage locations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone, rack, shelf, bin, description }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create location");
      }

      // Reset form
      setZone("");
      setRack("");
      setShelf("");
      setBin("");
      setDescription("");
      fetchLocations();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-wide">Storage Locations</h2>
        <p className="text-sm text-text-secondary">Manage physical inventory zones, racks, shelves, and bins</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of locations */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary" />
            Location Hierarchy
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger text-danger p-4 rounded text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          ) : locations.length === 0 ? (
            <p className="text-sm text-text-secondary py-6 text-center">No locations configured yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-sm font-medium">
                    <th className="py-3 px-4">Zone</th>
                    <th className="py-3 px-4">Rack</th>
                    <th className="py-3 px-4">Shelf</th>
                    <th className="py-3 px-4">Bin</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text-primary">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-bg/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-primary">{loc.zone}</td>
                      <td className="py-3 px-4 font-mono">{loc.rack || "Default"}</td>
                      <td className="py-3 px-4 font-mono">{loc.shelf || "Default"}</td>
                      <td className="py-3 px-4 font-mono">{loc.bin || "Default"}</td>
                      <td className="py-3 px-4 text-text-secondary text-xs">{loc.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Form (Admin Only) */}
        {isAdmin && (
          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-primary" />
              Add Location
            </h3>

            {formError && (
              <div className="bg-danger/10 border border-danger text-danger p-3 rounded text-sm mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Zone (Required)
                </label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="e.g. Component Lab"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Rack
                </label>
                <input
                  type="text"
                  value={rack}
                  onChange={(e) => setRack(e.target.value)}
                  placeholder="e.g. R-01"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Shelf
                </label>
                <input
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  placeholder="e.g. S-03"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Bin
                </label>
                <input
                  type="text"
                  value={bin}
                  onChange={(e) => setBin(e.target.value)}
                  placeholder="e.g. B-07"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes about this storage area..."
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
                  "Create Location"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
