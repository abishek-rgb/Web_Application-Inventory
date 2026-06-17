"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Tag, Plus, Loader2, AlertCircle } from "lucide-react";

interface HsnCode {
  id: string;
  code: string;
  description: string;
  gst_rate: number | null;
}

export default function HsnCodesPage() {
  const { data: session } = useSession();
  const [hsnCodes, setHsnCodes] = useState<HsnCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const isAdmin = session?.user?.role === "ADMIN";

  const fetchHsnCodes = async () => {
    try {
      const res = await fetch("/api/hsn");
      if (!res.ok) throw new Error("Failed to fetch HSN codes");
      const data = await res.json();
      setHsnCodes(data);
    } catch (err) {
      setError("Failed to load HSN codes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHsnCodes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/hsn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, description, gst_rate: gstRate }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create HSN code");
      }

      // Reset form
      setCode("");
      setDescription("");
      setGstRate("");
      fetchHsnCodes();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-wide">HSN Codes</h2>
          <p className="text-sm text-text-secondary">Manage HSN codes and GST rates for stock compliance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table List */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-6 shadow-sm overflow-hidden">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center">
            <Tag className="w-5 h-5 mr-2 text-primary" />
            HSN Master List
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
          ) : hsnCodes.length === 0 ? (
            <p className="text-sm text-text-secondary py-6 text-center">No HSN codes found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-text-secondary text-sm font-medium">
                    <th className="py-3 px-4">HSN Code</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">GST Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text-primary">
                  {hsnCodes.map((hsn) => (
                    <tr key={hsn.id} className="hover:bg-bg/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{hsn.code}</td>
                      <td className="py-3 px-4">{hsn.description}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {hsn.gst_rate !== null ? `${hsn.gst_rate}%` : "—"}
                      </td>
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
              Add HSN Code
            </h3>

            {formError && (
              <div className="bg-danger/10 border border-danger text-danger p-3 rounded text-sm mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  HSN Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 8542"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Commodity description..."
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary h-24 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  placeholder="e.g. 18.00"
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
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
                  "Create HSN Code"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
