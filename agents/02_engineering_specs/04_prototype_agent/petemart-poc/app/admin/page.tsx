'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllMerchants } from '@/lib/data/merchants';
import { getAllProducts } from '@/lib/data/products';

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'merchants' | 'orders' | 'analytics'>('overview');
  const merchants = getAllMerchants();
  const allProducts = getAllProducts();

  useEffect(() => {
    const stored = localStorage.getItem('petemart_orders');
    if (stored) setOrders(JSON.parse(stored));
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = orders.length;
  const totalProducts = allProducts.length;
  const digitalHigh = merchants.filter(m => m.merchant_digital_readiness.digital_maturity_score >= 3).length;
  const digitalLow = merchants.filter(m => m.merchant_digital_readiness.digital_maturity_score < 3).length;
  const interestHigh = merchants.filter(m => m.merchant_digital_readiness.interest_in_petemart === 'high').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-pm-text">Admin Console</h1>
        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 font-medium">POC Demo</span>
      </div>

      {/* Admin Nav */}
      <nav className="flex gap-1 mb-8 border-b border-pm-border">
        {(['overview', 'merchants', 'orders', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-pm-primary text-pm-primary' : 'border-transparent text-pm-text-secondary hover:text-pm-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Merchants', value: merchants.length, sub: `${digitalHigh} digitally ready`, color: 'text-pm-primary' },
              { label: 'Total Products', value: totalProducts, sub: '273 synthetic SKUs', color: 'text-pm-mode-a' },
              { label: 'Orders Placed', value: totalOrders, sub: `₹${totalRevenue.toLocaleString()} revenue`, color: 'text-pm-mode-b' },
              { label: 'High Interest', value: interestHigh, sub: `${merchants.length - interestHigh} need nurturing`, color: 'text-pm-warning' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-pm-border p-4">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-pm-text mt-1">{stat.label}</p>
                <p className="text-xs text-pm-text-secondary">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Digital Readiness Matrix */}
          <div className="bg-white rounded-xl border border-pm-border p-6 mb-8">
            <h2 className="font-bold text-pm-text mb-4">Merchant Digital Readiness Matrix</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-pm-background border-b border-pm-border">
                  <tr>
                    <th className="text-left p-2 font-medium">Store</th>
                    <th className="text-center p-2 font-medium">Score</th>
                    <th className="text-center p-2 font-medium">Website</th>
                    <th className="text-center p-2 font-medium">Instagram</th>
                    <th className="text-center p-2 font-medium">WhatsApp Biz</th>
                    <th className="text-center p-2 font-medium">Interest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pm-border">
                  {merchants.map((m) => (
                    <tr key={m.store_id} className="hover:bg-pm-background/50">
                      <td className="p-2">
                        <p className="font-medium text-pm-text">{m.name}</p>
                        <p className="text-xs text-pm-text-secondary">{m.market}</p>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} className={n <= m.merchant_digital_readiness.digital_maturity_score ? 'text-pm-primary' : 'text-gray-300'}>●</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-2 text-center">{m.merchant_digital_readiness.has_website ? '✅' : '❌'}</td>
                      <td className="p-2 text-center">{m.merchant_digital_readiness.has_instagram ? '✅' : '❌'}</td>
                      <td className="p-2 text-center">{m.merchant_digital_readiness.has_whatsapp_business ? '✅' : '❌'}</td>
                      <td className="p-2 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          m.merchant_digital_readiness.interest_in_petemart === 'high' ? 'bg-green-100 text-green-800' :
                          m.merchant_digital_readiness.interest_in_petemart === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>{m.merchant_digital_readiness.interest_in_petemart}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'merchants' && (
        <div className="bg-white rounded-xl border border-pm-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-pm-background border-b border-pm-border">
                <tr>
                  <th className="text-left p-3 font-medium">Store ID</th>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Market</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-center p-3 font-medium">Products</th>
                  <th className="text-center p-3 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pm-border">
                {merchants.map((m) => (
                  <tr key={m.store_id} className="hover:bg-pm-background/50">
                    <td className="p-3 text-xs font-mono text-pm-text-secondary">{m.store_id}</td>
                    <td className="p-3"><Link href={`/shop/${m.slug}`} className="font-medium text-pm-text hover:text-pm-primary">{m.name}</Link></td>
                    <td className="p-3 text-pm-text-secondary">{m.market}</td>
                    <td className="p-3 text-pm-text-secondary">{m.subcategory}</td>
                    <td className="p-3 text-pm-text-secondary">{m.phone}</td>
                    <td className="p-3 text-center font-medium">{allProducts.filter(p => p.merchant_slug === m.slug).length}</td>
                    <td className="p-3 text-center">{m.rating} ⭐</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-pm-border p-12 text-center">
              <p className="text-pm-text-secondary">No orders placed yet. Place a test order from the storefront to see it here.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-pm-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-pm-background border-b border-pm-border">
                    <tr>
                      <th className="text-left p-3 font-medium">Order ID</th>
                      <th className="text-left p-3 font-medium">Customer</th>
                      <th className="text-left p-3 font-medium">Items</th>
                      <th className="text-right p-3 font-medium">Total</th>
                      <th className="text-center p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pm-border">
                    {orders.map((o: any) => (
                      <tr key={o.id} className="hover:bg-pm-background/50">
                        <td className="p-3"><Link href={`/tracking/${o.id}`} className="font-mono text-xs font-bold text-pm-primary hover:underline">{o.id}</Link></td>
                        <td className="p-3">
                          <p className="font-medium text-pm-text">{o.delivery?.name}</p>
                          <p className="text-xs text-pm-text-secondary">{o.delivery?.phone}</p>
                        </td>
                        <td className="p-3 text-pm-text-secondary">{o.items?.length || 0} items</td>
                        <td className="p-3 text-right font-medium">₹{o.total?.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">{o.status}</span>
                        </td>
                        <td className="p-3 text-right text-pm-text-secondary text-xs">{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Market Distribution */}
            <div className="bg-white rounded-xl border border-pm-border p-6">
              <h3 className="font-bold text-pm-text mb-4">Market Distribution</h3>
              {['Chickpet', 'Balepet'].map(market => {
                const count = merchants.filter(m => m.market === market).length;
                const pct = (count / merchants.length) * 100;
                return (
                  <div key={market} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-pm-text-secondary">{market}</span>
                      <span className="font-medium">{count} stores</span>
                    </div>
                    <div className="h-2 rounded-full bg-pm-background overflow-hidden">
                      <div className="h-full rounded-full bg-pm-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Digital Readiness Distribution */}
            <div className="bg-white rounded-xl border border-pm-border p-6">
              <h3 className="font-bold text-pm-text mb-4">Digital Maturity</h3>
              {[1, 2, 3, 4, 5].map(score => {
                const count = merchants.filter(m => m.merchant_digital_readiness.digital_maturity_score === score).length;
                const pct = (count / merchants.length) * 100;
                return (
                  <div key={score} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-pm-text-secondary">Score {score}</span>
                      <span className="font-medium">{count} stores</span>
                    </div>
                    <div className="h-2 rounded-full bg-pm-background overflow-hidden">
                      <div className={`h-full rounded-full ${score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-yellow-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interest Levels */}
            <div className="bg-white rounded-xl border border-pm-border p-6">
              <h3 className="font-bold text-pm-text mb-4">Interest in PeteMart</h3>
              {(['high', 'medium', 'low', 'unknown'] as const).map(level => {
                const count = merchants.filter(m => m.merchant_digital_readiness.interest_in_petemart === level).length;
                const pct = (count / merchants.length) * 100;
                return (
                  <div key={level} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-pm-text-secondary capitalize">{level}</span>
                      <span className="font-medium">{count} stores</span>
                    </div>
                    <div className="h-2 rounded-full bg-pm-background overflow-hidden">
                      <div className={`h-full rounded-full ${level === 'high' ? 'bg-green-500' : level === 'medium' ? 'bg-yellow-500' : 'bg-gray-300'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mode Distribution */}
          <div className="bg-white rounded-xl border border-pm-border p-6 mt-6">
            <h3 className="font-bold text-pm-text mb-4">Available Modes per Merchant</h3>
            <div className="space-y-2">
              {merchants.map(m => (
                <div key={m.store_id} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate font-medium">{m.name}</span>
                  <div className="flex gap-2">
                    {m.available_modes.includes('mode_a') && <span className="px-2 py-0.5 rounded text-xs bg-pm-mode-a/10 text-pm-mode-a">🛒 Buy</span>}
                    {m.available_modes.includes('mode_b') && <span className="px-2 py-0.5 rounded text-xs bg-pm-mode-b/10 text-pm-mode-b">💬 WhatsApp</span>}
                    {m.available_modes.includes('mode_c') && <span className="px-2 py-0.5 rounded text-xs bg-pm-mode-c/10 text-pm-mode-c">📍 Visit</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
