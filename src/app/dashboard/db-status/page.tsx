"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Database, Loader2, AlertCircle, HardDrive, Activity, TableProperties, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

interface TableInfo {
  name: string;
  sizeBytes: number;
}

interface DbStatus {
  sizeBytes: number;
  activeConnections: number;
  topTables: TableInfo[];
  maxSizeBytes: number;
  status: string;
}

export default function DbStatusPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!isSuperAdmin) {
      router.push("/dashboard");
      return;
    }
    fetchStatus();
  }, [sessionStatus, isSuperAdmin, router]);

  const fetchStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/db-status");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch DB status");
      }
      const data = await res.json();
      setDbStatus(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch database information.");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isSuperAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          Database Health & Optimization
        </h1>
        <p className="text-text-secondary mt-2">
          Monitor your Neon PostgreSQL storage limits, connections, and system health.
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger text-danger p-4 rounded-lg mb-8 text-sm flex flex-col gap-2">
          <div className="flex items-center font-semibold">
            <ShieldAlert className="w-5 h-5 mr-2" />
            Database Connection Error Detected
          </div>
          <p className="ml-7 opacity-90">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : dbStatus ? (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-surface border border-border p-6 rounded-xl flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-secondary font-medium">Storage Used</p>
                <h3 className="text-2xl font-bold text-text-primary mt-1">
                  {formatBytes(dbStatus.sizeBytes)}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Out of {formatBytes(dbStatus.maxSizeBytes)} (Free Tier)
                </p>
              </div>
            </div>

            <div className="bg-surface border border-border p-6 rounded-xl flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-secondary/10 rounded-lg text-secondary">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-text-secondary font-medium">Active Connections</p>
                <h3 className="text-2xl font-bold text-text-primary mt-1">
                  {dbStatus.activeConnections}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Current concurrent queries
                </p>
              </div>
            </div>

            <div className={`bg-surface border p-6 rounded-xl flex items-start gap-4 shadow-sm ${
                dbStatus.status === "Connected" ? "border-success/30" : "border-danger/30"
              }`}>
              <div className={`p-3 rounded-lg ${
                dbStatus.status === "Connected" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
              }`}>
                {dbStatus.status === "Connected" ? <Database className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-sm text-text-secondary font-medium">System Status</p>
                <h3 className={`text-2xl font-bold mt-1 ${
                  dbStatus.status === "Connected" ? "text-success" : "text-danger"
                }`}>
                  {dbStatus.status}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {dbStatus.status === "Connected" ? "Healthy & Operational" : "Action Required"}
                </p>
              </div>
            </div>

          </div>

          {/* Storage Progress Bar */}
          <div className="bg-surface border border-border p-8 rounded-xl shadow-sm">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  Capacity Overview
                </h3>
                <p className="text-sm text-text-secondary mt-1">Database space occupied vs free limit</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">
                  {((dbStatus.sizeBytes / dbStatus.maxSizeBytes) * 100).toFixed(2)}%
                </span>
                <span className="text-sm text-text-secondary ml-1">used</span>
              </div>
            </div>
            
            <div className="h-4 w-full bg-bg rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, (dbStatus.sizeBytes / dbStatus.maxSizeBytes) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-secondary mt-3">
              <span>0 MB</span>
              <span>{formatBytes(dbStatus.maxSizeBytes - dbStatus.sizeBytes)} Free Space Remaining</span>
              <span>500 MB Max</span>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <TableProperties className="w-5 h-5 text-secondary" />
                Largest Data Tables
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg/50 border-b border-border text-text-secondary text-sm font-medium">
                    <th className="py-3 px-6">Table Name</th>
                    <th className="py-3 px-6">Size Occupied</th>
                    <th className="py-3 px-6">Percentage of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text-primary">
                  {dbStatus.topTables.map((table, index) => (
                    <tr key={table.name} className="hover:bg-bg/40 transition-colors">
                      <td className="py-3 px-6 font-medium font-mono text-xs">{table.name}</td>
                      <td className="py-3 px-6">{formatBytes(table.sizeBytes)}</td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-bg rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-secondary"
                              style={{ width: `${(table.sizeBytes / dbStatus.sizeBytes) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-text-secondary">
                            {dbStatus.sizeBytes > 0 ? ((table.sizeBytes / dbStatus.sizeBytes) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {dbStatus.topTables.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-text-secondary">
                        No table data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
