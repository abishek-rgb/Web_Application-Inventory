"use client";

import { useState, useEffect } from "react";
import { Package, Search, ExternalLink, Loader2, FileText, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  order_id: string;
  order_date: string;
  purchase_site: string;
  status: string;
  security_floor: string | null;
  received_date: string | null;
  received_with_invoice: boolean | null;
  total_price: number | null;
  creator: {
    name: string;
    email: string;
  };
}

export default function OrderLogsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter((o) =>
    o.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.purchase_site.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ENROLLED": return "bg-bg text-text-secondary border-border";
      case "SHIPPED": return "bg-info/10 text-info border-info/30";
      case "IN_TRANSIT": return "bg-primary/10 text-primary border-primary/30";
      case "IN_SECURITY": return "bg-warning/10 text-warning border-warning/30";
      case "RECEIVED": return "bg-success/10 text-success border-success/30";
      default: return "bg-bg text-text-secondary border-border";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-wide">Order Logs</h2>
          <p className="text-sm text-text-secondary">Comprehensive history of all tracked orders and their statuses.</p>
        </div>
        <Link
          href="/dashboard/track-order/enroll"
          className="bg-primary hover:bg-primary-dark text-bg font-bold py-2 px-4 rounded text-sm transition-colors"
        >
          + Enroll New Order
        </Link>
      </div>

      <div className="bg-surface border border-border p-4 rounded-lg flex gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by Order ID or Purchase Site..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded text-sm text-text-primary focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-danger/10 border border-danger text-danger p-6 m-6 rounded text-sm">
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-24 text-center space-y-2">
            <Package className="w-12 h-12 text-text-secondary mx-auto" />
            <p className="text-sm text-text-secondary">No orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-text-secondary text-xs uppercase font-semibold bg-[#0A0A0A]">
                  <th className="py-4 px-6">Order ID & Date</th>
                  <th className="py-4 px-6">Purchase Site</th>
                  <th className="py-4 px-6 text-right">Price (INR)</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm text-text-primary">
                {filteredOrders.map((order, index) => {
                  const rowBg = index % 2 === 0 ? "bg-[#141414]" : "bg-[#1C1C1C]";
                  
                  return (
                    <tr key={order.id} className={`${rowBg} hover:bg-bg/40 transition-colors`}>
                      <td className="py-4 px-6">
                        <div className="font-bold text-primary font-mono">{order.order_id}</div>
                        <div className="text-xs text-text-secondary mt-1">
                          {new Date(order.order_date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        {order.purchase_site}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold">
                        {order.total_price !== null ? (
                          <span className="text-success">&#x20B9;{order.total_price.toFixed(2)}</span>
                        ) : (
                          <span className="text-text-secondary text-xs font-sans font-normal italic">Not recorded</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                          {order.status.replace("_", " ")}
                        </span>
                        {order.status === "RECEIVED" && order.received_date && (
                          <div className="text-[10px] text-text-secondary mt-1">
                            on {new Date(order.received_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {order.status === "RECEIVED" ? (
                          order.received_with_invoice === true ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded border border-success/20">
                              <CheckCircle className="w-3 h-3" /> Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger bg-danger/10 px-2 py-1 rounded border border-danger/20">
                              <XCircle className="w-3 h-3" /> Missing
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-text-secondary italic">Pending Delivery</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
