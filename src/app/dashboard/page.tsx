import { prisma } from "@/lib/prisma";
import { Package2, AlertTriangle, Layers, Activity, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import OrderDistributionChart from "@/components/dashboard/OrderDistributionChart";
import StockDistributionChart from "@/components/dashboard/StockDistributionChart";

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
    SELECT COUNT(*)::integer as count FROM stock_entries WHERE min_quantity IS NOT NULL AND quantity > 0 AND quantity < min_quantity
  `;
  const lowStockEntries = Number(lowStockEntriesResult[0]?.count || 0);

  // 4. Order Stats
  const pendingOrders = await prisma.trackedOrder.count({
    where: { status: { not: "RECEIVED" } }
  });
  const receivedOrders = await prisma.trackedOrder.count({
    where: { status: "RECEIVED" }
  });

  // 5. Stock Health Status
  const totalStockEntries = await prisma.stockEntry.count();
  const emptyStockEntriesResult = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::integer as count FROM stock_entries WHERE quantity = 0
  `;
  const emptyStockCount = Number(emptyStockEntriesResult[0]?.count || 0);
  const healthyStockCount = totalStockEntries - emptyStockCount - lowStockEntries;

  // 6. Recent Activity
  const recentMovements = await prisma.stockMovement.findMany({
    take: 10,
    orderBy: { performed_at: "desc" },
    include: { part: true, user: true },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-text-primary tracking-wide mb-6 animate-fade-in">Overview</h2>

      {/* Widget Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl flex items-center hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] group animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div className="bg-primary/10 p-4 rounded-xl mr-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
            <Package2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">Total Parts (SKUs)</p>
            <p className="text-3xl font-bold text-text-primary mt-1 font-mono">{totalParts}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] group animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="bg-info/10 p-4 rounded-xl mr-4 group-hover:scale-110 group-hover:bg-info/20 transition-all duration-300">
            <Layers className="w-6 h-6 text-info" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">Total Stock Units</p>
            <p className="text-3xl font-bold text-text-primary mt-1 font-mono">{totalStockUnits}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)] group animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <div className="bg-danger/10 p-4 rounded-xl mr-4 group-hover:scale-110 group-hover:bg-danger/20 transition-all duration-300">
            <AlertTriangle className="w-6 h-6 text-danger" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">Low Stock Alerts</p>
            <p className="text-3xl font-bold text-danger mt-1 font-mono drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">{lowStockEntries}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(234,179,8,0.15)] group animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <div className="bg-warning/10 p-4 rounded-xl mr-4 group-hover:scale-110 group-hover:bg-warning/20 transition-all duration-300">
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">Pending Orders</p>
            <p className="text-3xl font-bold text-warning mt-1 font-mono drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">{pendingOrders}</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] group animate-slide-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
          <div className="bg-success/10 p-4 rounded-xl mr-4 group-hover:scale-110 group-hover:bg-success/20 transition-all duration-300">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">Received Orders</p>
            <p className="text-3xl font-bold text-success mt-1 font-mono">{receivedOrders}</p>
          </div>
        </div>
        
        <div className="glass-card p-6 rounded-2xl flex items-center hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] group border-success/30 animate-slide-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
          <div className="bg-success/10 p-4 rounded-xl mr-4 group-hover:scale-110 group-hover:bg-success/20 transition-all duration-300 relative">
            <div className="absolute inset-0 bg-success/20 blur-md rounded-xl animate-pulse-slow" />
            <Activity className="w-6 h-6 text-success relative z-10" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">System Status</p>
            <p className="text-xl font-bold text-success mt-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">Operational</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="space-y-6 lg:col-span-1">
          {/* Order Distribution Chart */}
          <div className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
            <div className="p-6 border-b border-border/50 bg-surface/30">
              <h3 className="text-lg font-bold text-text-primary">Order Distribution</h3>
            </div>
            <div className="p-6 flex items-center justify-center">
              <OrderDistributionChart received={receivedOrders} pending={pendingOrders} />
            </div>
          </div>

          {/* Stock Distribution Chart */}
          <div className="glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '0.75s', animationFillMode: 'both' }}>
            <div className="p-6 border-b border-border/50 bg-surface/30">
              <h3 className="text-lg font-bold text-text-primary">Stock Health Overview</h3>
            </div>
            <div className="p-6 flex items-center justify-center">
              <StockDistributionChart healthy={healthyStockCount} low={lowStockEntries} empty={emptyStockCount} />
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="glass-card rounded-2xl lg:col-span-2 overflow-hidden animate-slide-up" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
          <div className="p-6 border-b border-border/50 flex justify-between items-center bg-surface/30">
            <h3 className="text-lg font-bold text-text-primary">Recent Activity</h3>
            <Link href="/dashboard/movements" className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline transition-colors">View All</Link>
          </div>
          <div className="p-6">
            {recentMovements.length > 0 ? (
              <ul className="space-y-6">
                {recentMovements.map((movement, i) => (
                  <li key={movement.id} className="flex items-start group animate-fade-in" style={{ animationDelay: `${0.9 + (i * 0.1)}s`, animationFillMode: 'both' }}>
                    <div className="w-3 h-3 mt-1.5 rounded-full bg-primary/50 border border-primary mr-4 flex-shrink-0 group-hover:scale-150 group-hover:bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    <div className="bg-surface/30 p-3 rounded-lg flex-1 border border-border/30 group-hover:border-primary/30 transition-colors duration-300">
                      <p className="text-sm text-text-primary">
                        <span className="font-semibold text-primary uppercase text-xs tracking-wider">{movement.movement_type}</span>: {movement.quantity} units of <span className="font-mono text-xs bg-bg px-2 py-0.5 rounded">{movement.part.name}</span>
                      </p>
                      <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-text-secondary" />
                        by {movement.user.name} <span className="opacity-50 mx-1">•</span> {new Date(movement.performed_at).toLocaleString()}
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
