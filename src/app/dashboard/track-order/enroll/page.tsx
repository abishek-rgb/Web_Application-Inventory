"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Truck, CheckCircle, Trash2, Plus, ExternalLink } from "lucide-react";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";

interface OrderItemInput {
  component_name: string;
  quantity: number;
  price: number;
}

export default function EnrollOrderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [purchaseSite, setPurchaseSite] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [orderUrl, setOrderUrl] = useState("");
  
  const [items, setItems] = useState<OrderItemInput[]>([]);

  const [siteSuggestions, setSiteSuggestions] = useState<string[]>([]);

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

  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    setOrderDate(`${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} (${pad(now.getHours())}:${pad(now.getMinutes())})`);

    fetch("/api/suggestions?field=purchase_site")
      .then(res => res.json())
      .then(data => setSiteSuggestions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const updateItem = (index: number, field: keyof OrderItemInput, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems([...items, { component_name: "", quantity: 1, price: 0 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    if (orderDate.length !== 18) {
      setSubmitError("Please enter a complete date and time (DD/MM/YYYY (HH:mm))");
      setSubmitting(false);
      return;
    }
    const [datePart, timePartWithParens] = orderDate.split(' (');
    const timePart = timePartWithParens.replace(')', '');
    const [day, month, year] = datePart.split('/');
    const parsedDate = `${year}-${month}-${day}T${timePart}:00`;
    
    if (isNaN(new Date(parsedDate).getTime())) {
      setSubmitError("Please enter a valid date and time.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          order_date: parsedDate,
          purchase_site: purchaseSite,
          total_price: totalPrice ? parseFloat(totalPrice) : null,
          order_url: orderUrl || null,
          items: items // Send the items array to the backend
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to enroll order");
      }

      setSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-surface border border-border rounded-lg p-8 max-w-xl mx-auto text-center space-y-6 mt-12">
        <CheckCircle className="w-16 h-16 text-success mx-auto" />
        <h2 className="text-2xl font-bold text-text-primary">Order Enrolled Successfully</h2>
        <p className="text-sm text-text-secondary">
          The new order has been tracked. You can update its status and mark individual items as received.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setSuccess(false);
              setOrderId("");
              setOrderDate("");
              setPurchaseSite("");
              setTotalPrice("");
              setOrderUrl("");
              setItems([]);
            }}
            className="border border-border hover:bg-bg/40 px-4 py-2 rounded text-sm text-text-primary transition-colors"
          >
            Enroll Another Order
          </button>
          <button
            onClick={() => router.push("/dashboard/track-order/logs")}
            className="bg-primary hover:bg-primary-dark text-bg font-bold px-4 py-2 rounded text-sm transition-colors"
          >
            View Order Logs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-wide">Enroll New Order</h2>
        <p className="text-sm text-text-secondary">Register a new purchase and track its components.</p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {submitError && (
            <div className="bg-danger/10 border border-danger text-danger p-3 rounded text-sm">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Order ID *</label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. ORD-12345"
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Order Date *</label>
              <input
                type="text"
                placeholder="DD/MM/YYYY (HH:mm)"
                value={orderDate}
                onChange={(e) => setOrderDate(formatDateTimeMask(e.target.value))}
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Purchase Site / Vendor *</label>
              <AutocompleteInput
                value={purchaseSite}
                onChangeText={setPurchaseSite}
                suggestions={siteSuggestions}
                placeholder="e.g. Amazon, Mouser, DigiKey"
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Order Link (Optional)</label>
              <input
                type="url"
                value={orderUrl}
                onChange={(e) => setOrderUrl(e.target.value)}
                placeholder="e.g. https://www.robu.in/product/..."
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-text-primary">Order Components</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-primary hover:text-primary-dark text-sm font-medium flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Manual Item
              </button>
            </div>
            
            {items.length === 0 ? (
              <div className="text-center p-8 bg-bg/50 border border-dashed border-border rounded-lg text-text-secondary text-sm">
                No components added yet. Click "Add Manual Item" to track individual parts for this order.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-bg/30 p-3 border border-white/5 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={item.component_name}
                        onChange={(e) => updateItem(index, 'component_name', e.target.value)}
                        placeholder="Component Name"
                        className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="w-full md:w-24">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        placeholder="Qty"
                        className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                        required
                      />
                    </div>
                    <div className="w-full md:w-32">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        placeholder="Price (₹)"
                        className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-danger hover:bg-danger/10 rounded transition-colors self-end md:self-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border pt-6 flex flex-col items-end">
            <div className="w-full md:w-64 mb-6">
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Total Order Price (INR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="e.g. 1500.50"
                className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-dark text-bg font-bold px-8 py-3 rounded-lg transition-colors flex items-center disabled:opacity-50"
            >
              {submitting ? "Enrolling..." : (
                <>
                  <Truck className="w-5 h-5 mr-2" />
                  Complete Enrollment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
