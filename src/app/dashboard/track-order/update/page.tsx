"use client";

import { useState, useEffect } from "react";
import { Search, Edit, X, Truck, Check, Package, MapPin, Loader2, ExternalLink, CheckCircle } from "lucide-react";

type OrderStatus = "ENROLLED" | "SHIPPED" | "IN_TRANSIT" | "IN_SECURITY" | "RECEIVED";

interface OrderItem {
  id: string;
  component_name: string;
  quantity: number;
  price: number | null;
  is_received: boolean;
}

interface TrackedOrder {
  id: string;
  order_id: string;
  order_date: string;
  purchase_site: string;
  status: OrderStatus;
  security_floor: string | null;
  received_date: string | null;
  received_with_invoice: boolean | null;
  created_at: string;
  creator: {
    name: string;
    email: string;
  };
  items?: OrderItem[];
}

const statusConfig = {
  ENROLLED: { label: "Enrolled", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Package },
  SHIPPED: { label: "Shipped", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Truck },
  IN_TRANSIT: { label: "In Transit", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Truck },
  IN_SECURITY: { label: "In Security", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: MapPin },
  RECEIVED: { label: "Received", color: "bg-success/10 text-success border-success/20", icon: Check }
};

export default function UpdateStatusPage() {
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<TrackedOrder | null>(null);
  const [selectedOrderForItems, setSelectedOrderForItems] = useState<TrackedOrder | null>(null);
  
  const [newStatus, setNewStatus] = useState<OrderStatus>("ENROLLED");
  const [securityFloor, setSecurityFloor] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [receivedWithInvoice, setReceivedWithInvoice] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updatingItems, setUpdatingItems] = useState(false);

  const formatDateTimeMask = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 4) formatted += '/';
      if (i === 8) formatted += ' (';
      if (i === 10) formatted += ':';
      formatted += digits[i];
    }
    if (digits.length >= 12) formatted += ')';
    return formatted.slice(0, 18);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to load orders");
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

  const handleOpenModal = (order: TrackedOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setSecurityFloor(order.security_floor || "");
    const dateToUse = order.received_date ? new Date(order.received_date) : new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    setReceivedDate(`${pad(dateToUse.getDate())}/${pad(dateToUse.getMonth() + 1)}/${dateToUse.getFullYear()} (${pad(dateToUse.getHours())}:${pad(dateToUse.getMinutes())})`);
    setReceivedWithInvoice(order.received_with_invoice || false);
    setUpdateError("");
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    setUpdateError("");

    try {
      const payload: any = { status: newStatus };
      if (newStatus === "IN_SECURITY") {
        if (!securityFloor) throw new Error("Please specify the security floor");
        payload.security_floor = securityFloor;
      } else if (newStatus === "RECEIVED") {
        if (receivedDate.length !== 18) throw new Error("Please enter a complete date and time (DD/MM/YYYY (HH:mm))");
        const [datePart, timePartWithParens] = receivedDate.split(' (');
        const timePart = timePartWithParens.replace(')', '');
        const [day, month, year] = datePart.split('/');
        const [hour, minute] = timePart.split(':');
        
        // Create date in local timezone
        const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
        
        if (isNaN(d.getTime())) {
          throw new Error("Please enter a valid date and time.");
        }
        
        // Send as full ISO string so the server parses it exactly without guessing timezone
        payload.received_date = d.toISOString();

        payload.received_with_invoice = receivedWithInvoice;
      }

      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update status");
      }

      await fetchOrders();
      handleCloseModal();
    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleItemReceived = async (itemId: string, currentStatus: boolean) => {
    if (!selectedOrderForItems) return;
    setUpdatingItems(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrderForItems.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: itemId, is_received: !currentStatus }]
        })
      });
      if (!res.ok) throw new Error("Failed to update item status");
      
      const updatedOrder = await res.json();
      setSelectedOrderForItems(updatedOrder);
      
      // Update the main list too
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingItems(false);
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.purchase_site.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary tracking-wide">Update Order Status</h2>
          <p className="text-sm text-text-secondary">Track orders and double-click to view components.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by Order ID or Site..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-md text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg/50 border-b border-border text-text-secondary">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                <th className="px-6 py-4 font-semibold">Order Date</th>
                <th className="px-6 py-4 font-semibold">Site / Vendor</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                    {search ? "No matching orders found." : "No orders enrolled yet."}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const conf = statusConfig[order.status];
                  const Icon = conf.icon;
                  const formatCustomDate = (dateStr: string) => {
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
                    <tr 
                      key={order.id} 
                      className="hover:bg-bg/40 transition-colors cursor-pointer"
                      onDoubleClick={() => setSelectedOrderForItems(order)}
                    >
                      <td className="px-6 py-4 font-medium text-text-primary">{order.order_id}</td>
                      <td className="px-6 py-4 text-text-secondary">{formatCustomDate(order.order_date)}</td>
                      <td className="px-6 py-4 text-text-secondary">
                        <div className="flex items-center gap-2">
                          {order.purchase_site}
                          {(order as any).order_url && (
                            <a href={(order as any).order_url} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-primary transition-colors" title="View Order Link" onClick={(e) => e.stopPropagation()}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${conf.color}`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {conf.label}
                        </span>
                        {order.status === "IN_SECURITY" && order.security_floor && (
                          <div className="text-xs text-text-secondary mt-1 ml-1">Floor: {order.security_floor}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedOrderForItems(order); }}
                            className="inline-flex items-center px-3 py-1.5 bg-bg/50 border border-border hover:border-info hover:text-info text-text-secondary rounded text-xs font-semibold transition-colors"
                          >
                            <Package className="w-3.5 h-3.5 mr-1.5" />
                            Items
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(order); }}
                            className="inline-flex items-center px-3 py-1.5 bg-bg border border-border hover:border-primary hover:text-primary text-text-secondary rounded text-xs font-semibold transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1.5" />
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Order Status Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">Update Status</h3>
              <button onClick={handleCloseModal} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-6">
              {updateError && (
                <div className="bg-danger/10 border border-danger text-danger p-3 rounded text-sm">
                  {updateError}
                </div>
              )}

              <div className="bg-bg p-3 rounded-md border border-border text-sm mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-text-secondary">Order ID:</span>
                  <span className="font-mono text-text-primary">{selectedOrder.order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Site:</span>
                  <span className="text-text-primary">{selectedOrder.purchase_site}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">New Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                >
                  <option value="ENROLLED">Enrolled</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="IN_SECURITY">In Security</option>
                  <option value="RECEIVED">Received</option>
                </select>
              </div>

              {newStatus === "IN_SECURITY" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Security Floor *</label>
                  <input
                    type="text"
                    value={securityFloor}
                    onChange={(e) => setSecurityFloor(e.target.value)}
                    placeholder="e.g. Ground Floor, 2nd Floor"
                    className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                    required
                  />
                  <p className="text-xs text-text-secondary mt-1">Specify which floor's security has the item.</p>
                </div>
              )}

              {newStatus === "RECEIVED" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-4 border-t border-border pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Date Received *</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY (HH:mm)"
                      value={receivedDate}
                      onChange={(e) => setReceivedDate(formatDateTimeMask(e.target.value))}
                      className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={receivedWithInvoice}
                        onChange={(e) => setReceivedWithInvoice(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-border focus:ring-primary bg-bg"
                      />
                      <span className="text-sm font-medium text-text-primary">Received with Invoice</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-border text-text-primary rounded text-sm hover:bg-bg/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-bg font-bold rounded text-sm transition-colors flex items-center disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Items Modal */}
      {selectedOrderForItems && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrderForItems(null)} />
          <div className="relative bg-surface border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-bg/50">
              <div>
                <h3 className="text-xl font-bold text-text-primary font-mono">{selectedOrderForItems.order_id}</h3>
                <p className="text-sm text-text-secondary mt-1">Partial Delivery Tracking</p>
              </div>
              <button 
                onClick={() => setSelectedOrderForItems(null)}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {!selectedOrderForItems.items || selectedOrderForItems.items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-text-secondary/50 mx-auto mb-3" />
                  <p className="text-text-secondary">No items recorded for this order.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedOrderForItems.items.map((item) => (
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
                onClick={() => setSelectedOrderForItems(null)}
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
