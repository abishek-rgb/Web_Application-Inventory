"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Package, Search, ExternalLink, Loader2, FileText, CheckCircle, XCircle, Trash2, X } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: string;
  component_name: string;
  quantity: number;
  price: number | null;
  is_received: boolean;
}

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
  order_url: string | null;
  creator: {
    name: string;
    email: string;
  };
  items?: OrderItem[];
}

export default function OrderLogsPage() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingItems, setUpdatingItems] = useState(false);

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

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to permanently delete this order log?")) return;
    
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete order");
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleItemReceived = async (itemId: string, currentStatus: boolean) => {
    if (!selectedOrder) return;
    setUpdatingItems(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: itemId, is_received: !currentStatus }]
        })
      });
      if (!res.ok) throw new Error("Failed to update item status");
      
      const updatedOrder = await res.json();
      setSelectedOrder(updatedOrder);
      
      // Update the main list too
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingItems(false);
    }
  };

  const filteredOrders = orders.filter((o: Order) =>
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

  const formatCustomDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(hours)}:${pad(d.getMinutes())} ${ampm}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-wide">Order Logs</h2>
          <p className="text-sm text-text-secondary">Comprehensive history of all tracked orders. Double-click an order to view partial deliveries.</p>
        </div>
        <Link
          href="/dashboard/track-order/enroll"
          className="bg-primary hover:bg-primary-dark text-bg font-bold py-2 px-4 rounded text-sm transition-colors w-full md:w-auto text-center"
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
                  {isSuperAdmin && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm text-text-primary">
                {filteredOrders.map((order: Order, index: number) => {
                  const rowBg = index % 2 === 0 ? "bg-[#141414]" : "bg-[#1C1C1C]";

                  return (
                    <tr 
                      key={order.id} 
                      className={`${rowBg} hover:bg-bg/40 transition-colors cursor-pointer select-none`}
                      onDoubleClick={() => setSelectedOrder(order)}
                      title="Double-click to view order items and partial deliveries"
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-primary font-mono">{order.order_id}</div>
                        <div className="text-sm text-text-secondary mt-1">
                          {formatCustomDate(order.order_date)}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex items-center gap-2">
                          {order.purchase_site}
                          {order.order_url && (
                            <a href={order.order_url} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors" title="View Order Link" onClick={e => e.stopPropagation()}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold">
                        {order.total_price !== null ? (
                          <span className="text-success">&#x20B9;{order.total_price.toFixed(2)}</span>
                        ) : (
                          <span className="text-text-secondary text-xs font-sans font-normal italic">Not recorded</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                            {order.status.replace("_", " ")}
                          </span>
                          {order.status === "RECEIVED" && order.received_with_invoice && (
                            <span title="Invoice Received"><FileText className="w-4 h-4 text-info" /></span>
                          )}
                        </div>
                        {order.status === "RECEIVED" && order.received_date && (
                          <div className="text-sm text-text-secondary mt-1">
                            on {formatCustomDate(order.received_date)}
                          </div>
                        )}
                      </td>
                      {isSuperAdmin && (
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(order.id); }}
                            className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger/10 rounded transition-colors"
                            title="Delete Order Log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-surface border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-bg/50">
              <div>
                <h3 className="text-xl font-bold text-text-primary font-mono">{selectedOrder.order_id}</h3>
                <p className="text-sm text-text-secondary mt-1">Partial Delivery Tracking</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {!selectedOrder.items || selectedOrder.items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-text-secondary/50 mx-auto mb-3" />
                  <p className="text-text-secondary">No items recorded for this order.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        item.is_received ? 'bg-success/5 border-success/30' : 'bg-bg/50 border-border'
                      }`}
                    >
                      <div className="flex-1 pr-4">
                        <h4 className={`font-semibold ${item.is_received ? 'text-success/90' : 'text-text-primary'}`}>
                          {item.component_name}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-text-secondary">Qty: <strong className="text-text-primary">{item.quantity}</strong></span>
                          {item.price !== null && (
                            <span className="text-text-secondary">Price: <strong className="text-text-primary">&#x20B9;{item.price}</strong></span>
                          )}
                        </div>
                      </div>
                      
                      <div className="pl-4 border-l border-border/50">
                        <label className="flex flex-col items-center cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={item.is_received}
                              onChange={() => handleToggleItemReceived(item.id, item.is_received)}
                              disabled={updatingItems}
                            />
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                              item.is_received 
                                ? 'bg-success border-success text-bg' 
                                : 'bg-transparent border-border group-hover:border-primary text-transparent'
                            }`}>
                              {updatingItems ? (
                                <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
                              ) : (
                                <CheckCircle className={`w-5 h-5 ${item.is_received ? 'text-bg' : 'text-transparent'}`} />
                              )}
                            </div>
                          </div>
                          <span className={`text-[10px] uppercase font-bold mt-2 tracking-wider ${
                            item.is_received ? 'text-success' : 'text-text-secondary group-hover:text-primary'
                          }`}>
                            {item.is_received ? 'Received' : 'Mark Recv'}
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-bg/80 border-t border-border/50 text-right">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
