'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('petemart_orders');
    if (stored) setOrders(JSON.parse(stored));
  }, []);

  const statusColors: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    shipped: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4 opacity-30">📦</div>
        <h1 className="text-2xl font-bold text-pm-text mb-2">No Orders Yet</h1>
        <p className="text-pm-text-secondary mb-6">Your order history will appear here once you place your first order.</p>
        <a href="/" className="inline-block px-6 py-3 bg-pm-primary text-white rounded-lg hover:opacity-90">Start Shopping</a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-pm-text mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order: any) => {
          const itemCount = order.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0;
          return (
            <Link key={order.id} href={`/tracking/${order.id}`} className="block bg-white rounded-xl border border-pm-border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-sm font-bold text-pm-primary">{order.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                  {order.status?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-pm-text-secondary">{itemCount} item(s)</span>
                <span className="text-pm-text-secondary">₹{order.total?.toLocaleString()}</span>
                <span className="text-pm-text-secondary">{new Date(order.created_at).toLocaleDateString('en-IN')}</span>
                {order.estimated_delivery && (
                  <span className="text-pm-mode-a font-medium">Est. delivery: {new Date(order.estimated_delivery).toLocaleDateString('en-IN')}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
