"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Package2, Loader2, AlertCircle, BookOpen, Layers } from "lucide-react";

interface Part {
  id: string;
  name: string;
  part_number: string | null;
  package: string | null;
  comment: string | null;
  datasheet_url: string | null;
  category: {
    name: string;
    label: string;
  };
  subcategory: {
    name: string;
    label: string;
  } | null;
  hsn_code: {
    code: string;
  };
  stock_entries: Array<{
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
  }>;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Search request failed");
        const data = await res.json();
        setResults(data);
        // Auto-select first result if details panel is empty
        if (data.length > 0 && !selectedPart) {
          setSelectedPart(data[0]);
        }
      } catch (err) {
        setError("Error fetching search results.");
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-wide">Find Stock Location</h2>
        <p className="text-sm text-text-secondary">Instant search to locate components across all zones and bins</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          placeholder="Search by part name, part number, package type (e.g. 0603)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-lg text-text-primary text-base focus:outline-none focus:border-primary shadow-sm"
          autoFocus
        />
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Results List */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-6 flex flex-col min-h-[400px]">
          <h3 className="text-sm font-semibold text-text-secondary uppercase mb-4 tracking-wider">Search Results</h3>

          {loading ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-danger/10 border border-danger text-danger p-4 rounded text-sm flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-text-secondary space-y-2">
              <Package2 className="w-12 h-12 text-border" />
              <p className="text-sm">
                {query ? "No components found matching your search." : "Type above to search the warehouse catalog."}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[600px] pr-2">
              {results.map((part) => (
                <button
                  key={part.id}
                  onClick={() => setSelectedPart(part)}
                  className={`w-full p-4 rounded-lg border text-left flex justify-between items-center transition-all ${
                    selectedPart?.id === part.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-text-secondary bg-surface"
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-text-primary">{part.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
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
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm bg-bg px-2.5 py-1 rounded border border-border">
                      {part.stock_entries.reduce((sum, e) => sum + e.quantity, 0)} {part.stock_entries[0]?.unit || "pcs"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location Detail Panel */}
        <div className="bg-surface border border-border rounded-lg p-6 flex flex-col h-fit">
          <h3 className="text-sm font-semibold text-text-secondary uppercase mb-4 tracking-wider">Location Breakdown</h3>

          {selectedPart ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-bold text-text-primary">{selectedPart.name}</h4>
                {selectedPart.part_number && (
                  <p className="text-sm text-text-secondary mt-1">
                    Part Number: <span className="font-mono text-primary">{selectedPart.part_number}</span>
                  </p>
                )}
              </div>

              {/* Location Cards */}
              <div className="space-y-4">
                {selectedPart.stock_entries.map((entry) => (
                  <div key={entry.id} className="bg-bg/40 border border-border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <div className="flex items-center text-primary font-bold text-sm">
                        <MapPin className="w-4 h-4 mr-1.5" />
                        {entry.location.zone}
                      </div>
                      <span className="font-mono font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {entry.quantity} {entry.unit}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-bg p-2 rounded">
                        <div className="text-text-secondary font-medium">Rack</div>
                        <div className="text-text-primary font-mono font-semibold mt-1">{entry.location.rack || "Default"}</div>
                      </div>
                      <div className="bg-bg p-2 rounded">
                        <div className="text-text-secondary font-medium">Shelf</div>
                        <div className="text-text-primary font-mono font-semibold mt-1">{entry.location.shelf || "Default"}</div>
                      </div>
                      <div className="bg-bg p-2 rounded">
                        <div className="text-text-secondary font-medium">Bin</div>
                        <div className="text-text-primary font-mono font-semibold mt-1">{entry.location.bin || "Default"}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Metadata details */}
              <div className="pt-4 border-t border-border space-y-2 text-xs">
                {selectedPart.hsn_code && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">HSN Code:</span>
                    <span className="font-mono text-text-primary">{selectedPart.hsn_code.code}</span>
                  </div>
                )}
                {selectedPart.package && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Package Form:</span>
                    <span className="font-mono text-text-primary">{selectedPart.package}</span>
                  </div>
                )}
                {selectedPart.comment && (
                  <div className="pt-2">
                    <span className="text-text-secondary font-semibold block mb-1">Comments:</span>
                    <p className="bg-bg/30 p-2 rounded text-text-primary leading-relaxed">{selectedPart.comment}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-text-secondary space-y-2">
              <Layers className="w-8 h-8 text-border mx-auto" />
              <p className="text-xs">Select a component to view storage placement breakdown.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
