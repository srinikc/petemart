'use client';

import { useState, useEffect } from 'react';
import { getAllMerchants } from '@/lib/data/merchants';
import { getAllProducts } from '@/lib/data/products';

export default function MerchantProductsPage() {
  const [selectedStore, setSelectedStore] = useState('');
  const merchants = getAllMerchants();
  const allProducts = getAllProducts();

  useEffect(() => {
    if (!selectedStore && merchants.length > 0) {
      setSelectedStore(merchants[0].store_id);
    }
  }, [merchants, selectedStore]);

  const currentMerchant = merchants.find(m => m.store_id === selectedStore);
  const merchantProducts = currentMerchant
    ? allProducts.filter(p => p.merchant_slug === currentMerchant.slug)
    : [];

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
            <option key={m.store_id} value={m.store_id}>{m.name} — {m.market} ({allProducts.filter(p => p.merchant_slug === m.slug).length} products)</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-pm-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-pm-background border-b border-pm-border">
              <tr>
                <th className="text-left p-3 font-medium text-pm-text-secondary">Product</th>
                <th className="text-left p-3 font-medium text-pm-text-secondary">Category</th>
                <th className="text-right p-3 font-medium text-pm-text-secondary">Price</th>
                <th className="text-center p-3 font-medium text-pm-text-secondary">Stock</th>
                <th className="text-center p-3 font-medium text-pm-text-secondary">MOQ</th>
                <th className="text-center p-3 font-medium text-pm-text-secondary">Featured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pm-border">
              {merchantProducts.map((p) => (
                <tr key={p.id} className="hover:bg-pm-background/50">
                  <td className="p-3">
                    <p className="font-medium text-pm-text">{p.name}</p>
                    <p className="text-xs text-pm-text-secondary">{p.id}</p>
                  </td>
                  <td className="p-3 text-pm-text-secondary">{p.category}</td>
                  <td className="p-3 text-right font-medium">₹{p.price.toLocaleString()}
                    {p.original_price > p.price && <span className="text-xs text-pm-text-secondary line-through ml-1">₹{p.original_price.toLocaleString()}</span>}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.stock > 10 ? 'bg-green-100 text-green-800' :
                      p.stock > 0 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {p.stock > 10 ? 'in stock' : p.stock > 0 ? 'low stock' : 'out of stock'}
                    </span>
                  </td>
                  <td className="p-3 text-center text-pm-text-secondary">{p.moq} {p.unit}</td>
                  <td className="p-3 text-center">{p.is_featured ? '⭐' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 text-sm text-pm-text-secondary border-t border-pm-border">
          Showing {merchantProducts.length} products
        </div>
      </div>
    </div>
  );
}
