"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Truck, CheckCircle } from "lucide-react";

export default function EnrollOrderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [purchaseSite, setPurchaseSite] = useState("");
  const [totalPrice, setTotalPrice] = useState("");

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
  }, []);

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
          The new order has been tracked. You can update its status as it moves through the delivery stages.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              setSuccess(false);
              setOrderId("");
              setOrderDate("");
              setPurchaseSite("");
              setTotalPrice("");
            }}
            className="border border-border hover:bg-bg/40 px-4 py-2 rounded text-sm text-text-primary transition-colors"
          >
            Enroll Another Order
          </button>
          <button
            onClick={() => router.push("/dashboard/track-order/update")}
            className="bg-primary hover:bg-primary-dark text-bg font-bold px-4 py-2 rounded text-sm transition-colors"
          >
            Update Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary tracking-wide">Enroll New Order</h2>
        <p className="text-sm text-text-secondary">Register a new purchase to begin tracking its delivery status.</p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="bg-danger/10 border border-danger text-danger p-3 rounded text-sm">
              {submitError}
            </div>
          )}

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
            <input
              type="text"
              value={purchaseSite}
              onChange={(e) => setPurchaseSite(e.target.value)}
              placeholder="e.g. Amazon, Mouser, DigiKey"
              className="w-full px-3 py-2 bg-bg border border-border rounded text-text-primary text-sm focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Total Price (INR)</label>
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

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary-dark text-bg font-bold px-6 py-2 rounded text-sm transition-colors flex items-center disabled:opacity-50"
            >
              {submitting ? "Enrolling..." : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  Enroll Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
