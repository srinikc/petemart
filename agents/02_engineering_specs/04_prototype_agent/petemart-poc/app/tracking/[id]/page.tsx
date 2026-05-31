'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const trackingSteps = [
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'processing', label: 'Processing', icon: '⚙️' },
  { key: 'shipped', label: 'Shipped', icon: '📦' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
  { key: 'delivered', label: 'Delivered', icon: '📍' },
];

export default function TrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`petemart_order_${orderId}`);
    if (stored) {
      const o = JSON.parse(stored);
      // Simulate progressive status if order was placed "ago"
      const elapsed = Date.now() - new Date(o.created_at).getTime();
      const hoursElapsed = elapsed / (1000 * 60 * 60);
      if (hoursElapsed > 48) o.status = 'delivered';
      else if (hoursElapsed > 36) o.status = 'out_for_delivery';
      else if (hoursElapsed > 24) o.status = 'shipped';
      else if (hoursElapsed > 6) o.status = 'processing';
      setOrder(o);
    }
  }, [orderId]);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4 opacity-30">🔍</div>
        <h1 className="text-2xl font-bold text-pm-text mb-2">Order Not Found</h1>
        <p className="text-pm-text-secondary mb-6">We couldn&apos;t find an order with ID {orderId}.</p>
        <Link href="/orders" className="inline-block px-6 py-3 bg-pm-primary text-white rounded-lg hover:opacity-90">View All Orders</Link>
      </div>
    );
  }

  const currentStepIndex = trackingSteps.findIndex(s => s.key === order.status);
  const isDelivered = order.status === 'delivered';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/orders" className="text-sm text-pm-primary hover:underline mb-4 inline-block">← Back to Orders</Link>

      <div className="bg-white rounded-xl border border-pm-border p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-pm-text">Order {order.id}</h1>
            <p className="text-sm text-pm-text-secondary">Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          {isDelivered ? (
            <span className="px-4 py-2 rounded-full bg-green-100 text-green-800 font-medium text-sm">✅ Delivered</span>
          ) : (
            <span className="px-4 py-2 rounded-full bg-blue-100 text-blue-800 font-medium text-sm">{trackingSteps[currentStepIndex]?.label || order.status}</span>
          )}
        </div>

        {/* Tracking Timeline */}
        <div className="relative mb-8">
          {trackingSteps.map((step, idx) => {
            const isComplete = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={step.key} className="flex items-start gap-4 mb-2 relative">
                {idx < trackingSteps.length - 1 && (
                  <div className={`absolute left-[15px] top-8 w-0.5 h-10 ${idx < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 z-10 ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {isComplete ? step.icon : idx + 1}
                </div>
                <div className="pt-1">
                  <p className={`text-sm font-medium ${isComplete ? 'text-pm-text' : 'text-pm-text-secondary'}`}>{step.label}</p>
                  {isCurrent && (
                    <p className="text-xs text-pm-mode-a mt-0.5">
                      {order.status === 'confirmed' ? 'Your order has been received and is being reviewed.' :
                       order.status === 'processing' ? 'The merchant is preparing your items.' :
                       order.status === 'shipped' ? 'Your package has been dispatched.' :
                       order.status === 'out_for_delivery' ? 'Your delivery partner is on the way!' :
                       'Package delivered successfully.'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery Address */}
        {order.delivery && (
          <div className="border-t border-pm-border pt-4 mb-4">
            <h3 className="font-medium text-pm-text text-sm mb-2">Delivery Address</h3>
            <p className="text-sm text-pm-text-secondary">{order.delivery.name}</p>
            <p className="text-sm text-pm-text-secondary">{order.delivery.address}, {order.delivery.city} — {order.delivery.pincode}</p>
            <p className="text-sm text-pm-text-secondary">📞 {order.delivery.phone}</p>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-pm-border p-6">
        <h2 className="text-lg font-bold text-pm-text mb-4">Items ({order.items?.length || 0})</h2>
        <div className="space-y-3">
          {order.items?.map((item: any) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-pm-background flex items-center justify-center text-lg shrink-0">🛍️</div>
              <div className="flex-1">
                <Link href={`/product/${item.product.id}`} className="text-sm font-medium text-pm-text hover:text-pm-primary">{item.product.name}</Link>
                <p className="text-xs text-pm-text-secondary">×{item.quantity} — ₹{item.product.price?.toLocaleString()} each</p>
              </div>
              <span className="text-sm font-bold">₹{(item.product.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-pm-border mt-4 pt-4 flex justify-between font-bold text-pm-text">
          <span>Total</span>
          <span>₹{order.total?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
