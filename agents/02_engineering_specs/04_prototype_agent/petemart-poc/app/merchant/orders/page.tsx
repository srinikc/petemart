'use client';

import { useState, useEffect } from 'react';
import { getAllMerchants } from '@/lib/data/merchants';
import Link from 'next/link';

export default function MerchantOrdersPage() {
  const [selectedStore, setSelectedStore] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const merchants = getAllMerchants();

  useEffect(() => {
    if (!selectedStore && merchants.length > 0) {
      setSelectedStore(merchants[0].store_id);
    }
  }, [merchants, selectedStore]);

  useEffect(() => {
    const allOrders = JSON.parse(localStorage.getItem('petemart_orders') || '[]');
    const currentMerchant = merchants.find(m => m.store_id === selectedStore);
    if (currentMerchant) {
      const filtered = allOrders.filter((o: any) =>
        o.items?.some((i: any) => i.product?.merchant_slug === currentMerchant.slug)
      );
      setOrders(filtered);
    } else {
      setOrders(allOrders);
    }
  }, [selectedStore, merchants]);

  const currentMerchant = merchants.find(m => m.store_id === selectedStore);

  const statusColors: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    shipped: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div>
      <div className="mb-6">
        <label className="text-sm font-medium text-pm-text block mb-2">Select Store</label>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="w-full md:w-80 px-4 py-2.5 border border-pm-border rounded-lg text-sm"
        >
          {merchants.map((m) => (
            <option key={m.store_id} value={m.store_id}>{m.name} — {m.market}</option>
          ))}
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-pm-border p-12 text-center">
          <p className="text-pm-text-secondary">No orders received yet for {currentMerchant?.name}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const merchantItems = order.items?.filter((i: any) => i.product?.merchant_slug === currentMerchant?.slug) || [];
            const storeTotal = merchantItems.reduce((s: number, i: any) => s + (i.product?.price || 0) * i.quantity, 0);
            return (
              <Link key={order.id} href={`/tracking/${order.id}`} className="block bg-white rounded-xl border border-pm-border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-pm-primary">{order.id}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                    {order.status?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-pm-text-secondary">{order.delivery?.name} — {order.delivery?.phone}</p>
                    <p className="text-pm-text-secondary">{merchantItems.length} item(s) from your store</p>
                  </div>
                  <span className="font-bold text-pm-text">₹{storeTotal.toLocaleString()}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
