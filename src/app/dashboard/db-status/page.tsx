import { Database, HardDrive, Activity, Server, Table as TableIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import DbDistributionChart from "@/components/dashboard/DbDistributionChart";
import { prisma } from "@/lib/prisma";

interface DbStatus {
  sizeBytes: number;
  maxSizeBytes: number;
  activeConnections: number;
  tables: Array<{ name: string; sizeBytes: number }>;
  error?: string;
}

async function getDbStatus(): Promise<DbStatus> {
  const defaultStatus = {
    sizeBytes: 0,
    maxSizeBytes: 524288000, // 500 MB hardcoded for Neon Free Tier
    activeConnections: 0,
    tables: [],
  };

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

    return {
      sizeBytes,
      maxSizeBytes: 524288000,
      activeConnections,
      tables: topTables
    };
  } catch (error) {
    return {
      ...defaultStatus,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default async function DbStatusPage() {
  const dbStatus = await getDbStatus();
  const usagePercentage = Math.min(100, (dbStatus.sizeBytes / dbStatus.maxSizeBytes) * 100);
  const isWarning = usagePercentage > 80;
  const isCritical = usagePercentage > 95;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6 animate-fade-in">
        <Database className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold text-text-primary tracking-wide">Database Health</h2>
      </div>

      {dbStatus.error && (
        <div className="bg-danger/10 border border-danger p-4 rounded-lg flex items-start gap-3 animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <AlertCircle className="w-5 h-5 text-danger mt-0.5" />
          <div>
            <h3 className="text-danger font-semibold">Database Connection Error</h3>
            <p className="text-danger/80 text-sm mt-1">{dbStatus.error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Storage Capacity Card */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-xl group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <HardDrive className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Storage Capacity</h3>
                <p className="text-sm text-text-secondary">Neon Free Tier (500 MB)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-text-primary">{usagePercentage.toFixed(1)}%</p>
              <p className="text-xs text-text-secondary">Used</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="h-4 w-full bg-surface rounded-full overflow-hidden border border-border/50">
              <div 
                className={`h-full transition-all duration-1000 ease-out relative ${isCritical ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-primary'}`}
                style={{ width: `${usagePercentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 blur-sm animate-pulse-slow" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-text-secondary mt-3 font-mono">
              <span>{formatBytes(dbStatus.sizeBytes)}</span>
              <span>{formatBytes(dbStatus.maxSizeBytes)}</span>
            </div>
          </div>
        </div>

        {/* System Health Card */}
        <div className="glass-card p-6 rounded-2xl group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-success/10 p-3 rounded-xl group-hover:scale-110 group-hover:bg-success/20 transition-all duration-300">
              <Activity className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">System Health</h3>
              <p className="text-sm text-text-secondary">Live Metrics</p>
            </div>
          </div>

          <div className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-secondary">
                <Server className="w-4 h-4" />
                <span className="text-sm">Active Connections</span>
              </div>
              <span className="text-lg font-bold font-mono text-text-primary">{dbStatus.activeConnections}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm">Status</span>
              </div>
              <span className="text-sm font-semibold text-success drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                {dbStatus.error ? "Degraded" : "Operational"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Table Distribution Chart */}
        <div className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <div className="p-6 border-b border-border/50 bg-surface/30 flex items-center gap-3">
            <TableIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-text-primary">Data Distribution</h3>
          </div>
          <div className="p-6 flex items-center justify-center">
            <DbDistributionChart tables={dbStatus.tables} />
          </div>
        </div>

        {/* Largest Tables Breakdown */}
        <div className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
          <div className="p-6 border-b border-border/50 bg-surface/30 flex items-center gap-3">
            <TableIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-text-primary">Largest Tables</h3>
          </div>
          <div className="p-0">
            {dbStatus.tables.length > 0 ? (
              <div className="divide-y divide-border/30">
                {dbStatus.tables.slice(0, 5).map((table, i) => (
                  <div key={table.name} className="p-4 flex items-center justify-between hover:bg-surface/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-xs font-mono text-text-secondary group-hover:border-primary/50 group-hover:text-primary transition-colors">
                        {i + 1}
                      </div>
                      <span className="font-medium text-text-primary">{table.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-sm text-text-primary">{formatBytes(table.sizeBytes)}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-24 h-1.5 bg-surface rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary/70 group-hover:bg-primary transition-colors"
                            style={{ width: `${(table.sizeBytes / dbStatus.sizeBytes) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-secondary font-mono w-8 text-right">
                          {((table.sizeBytes / dbStatus.sizeBytes) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-text-secondary text-center">
                No table data available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
