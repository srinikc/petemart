'use client';

import { useState, useEffect } from 'react';
import { getAllMerchants } from '@/lib/data/merchants';
import { getAllProducts } from '@/lib/data/products';
import Link from 'next/link';

export default function MerchantDashboardPage() {
  const [selectedStore, setSelectedStore] = useState('');
  const [orderCount, setOrderCount] = useState(0);
  const merchants = getAllMerchants();

  useEffect(() => {
    if (!selectedStore && merchants.length > 0) {
      setSelectedStore(merchants[0].store_id);
    }
  }, [merchants, selectedStore]);

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem('petemart_orders') || '[]');
    const storeOrders = selectedStore
      ? orders.filter((o: any) => o.items?.some((i: any) => i.product?.merchant_slug === merchants.find(m => m.store_id === selectedStore)?.slug))
      : orders;
    setOrderCount(storeOrders.length);
  }, [selectedStore, merchants]);

  const currentMerchant = merchants.find(m => m.store_id === selectedStore);
  const allProducts = getAllProducts();
  const merchantProducts = currentMerchant ? allProducts.filter(p => p.merchant_slug === currentMerchant.slug) : [];

  return (
    <div>
      {/* Store Selector */}
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

      {currentMerchant && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Products', value: merchantProducts.length, color: 'text-pm-primary' },
              { label: 'Active Orders', value: orderCount, color: 'text-pm-mode-b' },
              { label: 'Rating', value: `⭐ ${currentMerchant.rating}`, color: 'text-pm-warning' },
              { label: 'Digital Score', value: `${currentMerchant.merchant_digital_readiness.digital_maturity_score}/5`, color: 'text-pm-text' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-pm-border p-4">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-pm-text-secondary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Digital Readiness */}
          <div className="bg-white rounded-xl border border-pm-border p-6 mb-8">
            <h2 className="font-bold text-pm-text mb-3">Digital Readiness Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-pm-text-secondary">Website:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentMerchant.merchant_digital_readiness.has_website ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {currentMerchant.merchant_digital_readiness.has_website ? '✅ Yes' : '❌ No'}
                </span>
                {currentMerchant.merchant_digital_readiness.website_url && (
                  <a href={currentMerchant.merchant_digital_readiness.website_url!} target="_blank" rel="noopener noreferrer" className="text-pm-primary hover:underline">Visit</a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pm-text-secondary">Instagram:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentMerchant.merchant_digital_readiness.has_instagram ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {currentMerchant.merchant_digital_readiness.has_instagram ? '✅ Yes' : '❌ No'}
                </span>
                {currentMerchant.merchant_digital_readiness.instagram_handle && (
                  <a href={`https://instagram.com/${currentMerchant.merchant_digital_readiness.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="text-pm-primary hover:underline">@{currentMerchant.merchant_digital_readiness.instagram_handle}</a>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pm-text-secondary">WhatsApp Business:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentMerchant.merchant_digital_readiness.has_whatsapp_business ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {currentMerchant.merchant_digital_readiness.has_whatsapp_business ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pm-text-secondary">Interest in PeteMart:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  currentMerchant.merchant_digital_readiness.interest_in_petemart === 'high' ? 'bg-green-100 text-green-800' :
                  currentMerchant.merchant_digital_readiness.interest_in_petemart === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentMerchant.merchant_digital_readiness.interest_in_petemart}
                </span>
              </div>
            </div>
          </div>

          {/* Store Info & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-pm-border p-6">
              <h2 className="font-bold text-pm-text mb-3">Store Details</h2>
              <div className="space-y-2 text-sm">
                <p><span className="text-pm-text-secondary">Category:</span> {currentMerchant.category}</p>
                <p><span className="text-pm-text-secondary">Market:</span> {currentMerchant.market}</p>
                <p><span className="text-pm-text-secondary">Phone:</span> {currentMerchant.phone}</p>
                <p><span className="text-pm-text-secondary">WhatsApp:</span> +91 {currentMerchant.whatsapp_phone}</p>
                <p><span className="text-pm-text-secondary">Delivery Radius:</span> {currentMerchant.delivery_radius_km} km</p>
                <p><span className="text-pm-text-secondary">Languages:</span> {currentMerchant.languages_spoken.join(', ')}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-pm-border p-6">
              <h2 className="font-bold text-pm-text mb-3">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/merchant/products" className="block w-full text-center px-4 py-3 rounded-lg bg-pm-primary text-white text-sm font-medium hover:opacity-90">Manage Products</Link>
                <Link href="/merchant/orders" className="block w-full text-center px-4 py-3 rounded-lg bg-pm-mode-b text-white text-sm font-medium hover:opacity-90">View Orders</Link>
                <a href={`/shop/${currentMerchant.slug}`} className="block w-full text-center px-4 py-3 rounded-lg border border-pm-border text-pm-text text-sm font-medium hover:bg-pm-background">Preview Storefront →</a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
