import { prisma } from "@/lib/prisma";
import { Package2, AlertTriangle, Layers, Activity } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  // 1. Total Parts (SKUs)
  const totalParts = await prisma.part.count();

  // 2. Total Stock Units
  const stockAgg = await prisma.stockEntry.aggregate({
    _sum: { quantity: true },
  });
  const totalStockUnits = stockAgg._sum.quantity || 0;

  // 3. Low Stock Alerts
  const lowStockEntriesResult = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::integer as count FROM stock_entries WHERE min_quantity IS NOT NULL AND quantity < min_quantity
  `;
  const lowStockEntries = Number(lowStockEntriesResult[0]?.count || 0);

  // 4. Recent Activity
  const recentMovements = await prisma.stockMovement.findMany({
    take: 10,
    orderBy: { performed_at: "desc" },
    include: { part: true, user: true },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary tracking-wide mb-6">Overview</h2>

      {/* Widget Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm flex items-center">
          <div className="bg-primary/10 p-4 rounded-full mr-4">
            <Package2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium">Total Parts (SKUs)</p>
            <p className="text-3xl font-bold text-text-primary mt-1 font-mono">{totalParts}</p>
          </div>
        </div>

        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm flex items-center">
          <div className="bg-info/10 p-4 rounded-full mr-4">
            <Layers className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium">Total Stock Units</p>
            <p className="text-3xl font-bold text-text-primary mt-1 font-mono">{totalStockUnits}</p>
          </div>
        </div>

        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm flex items-center">
          <div className="bg-danger/10 p-4 rounded-full mr-4">
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium">Low Stock Alerts</p>
            <p className="text-3xl font-bold text-danger mt-1 font-mono">{lowStockEntries}</p>
          </div>
        </div>
        
        <div className="bg-surface border border-border p-6 rounded-lg shadow-sm flex items-center">
          <div className="bg-success/10 p-4 rounded-full mr-4">
            <Activity className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium">System Status</p>
            <p className="text-xl font-bold text-success mt-1">Operational</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Activity Timeline */}
        <div className="bg-surface border border-border rounded-lg lg:col-span-2">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-bold text-text-primary">Recent Activity</h3>
            <Link href="/dashboard/movements" className="text-sm text-primary hover:text-primary-dark">View All</Link>
          </div>
          <div className="p-6">
            {recentMovements.length > 0 ? (
              <ul className="space-y-4">
                {recentMovements.map((movement) => (
                  <li key={movement.id} className="flex items-start">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary mr-4 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-text-primary">
                        <span className="font-semibold text-primary">{movement.movement_type}</span>: {movement.quantity} units of <span className="font-mono text-xs">{movement.part.name}</span>
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        by {movement.user.name} at {new Date(movement.performed_at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-secondary">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
