'use client';

import { useState, useEffect } from 'react';
import { getAllMerchants, getAllMarkets, getMerchantsByMarket, generateWhatsAppUrl, generateGoogleMapsUrl, Merchant } from '@/lib/data/merchants';
import { getFeaturedProducts, searchProducts, ProductWithMerchant } from '@/lib/data/products';

export default function HomePage() {
  const markets = getAllMarkets();
  const allMerchants = getAllMerchants();
  const featuredProducts = getFeaturedProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductWithMerchant[]>([]);
  const [activeMarket, setActiveMarket] = useState('');

  useEffect(() => {
    if (searchQuery.length > 1) {
      setSearchResults(searchProducts(searchQuery));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const displayMerchants = activeMarket
    ? getMerchantsByMarket(activeMarket)
    : allMerchants;

  return (
    <div>
      {/* Pete Tapestry Hero */}
      <section className="pete-tapestry text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Bringing Old Bangalore&apos;s <span className="text-[#C8A45C]">Pete Markets</span> to Your Doorstep
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Discover 9 pilot merchants across Chickpet and Balepet. Shop textiles, silk sarees, fresh flowers, bakery treats & more.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search products across 9 Pete stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-xl text-pm-text bg-white/95 backdrop-blur border-2 border-white/30 focus:outline-none focus:border-pm-primary text-base shadow-lg"
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pm-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-pm-border z-50 max-h-96 overflow-y-auto">
                  {searchResults.map((p) => (
                    <a key={p.id} href={`/product/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-pm-background border-b border-pm-border last:border-0">
                      <div className="w-12 h-12 rounded-lg bg-pm-background flex items-center justify-center text-pm-primary font-bold text-xs shrink-0">
                        {p.category.slice(0, 3)}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-pm-text">{p.name}</p>
                        <p className="text-xs text-pm-text-secondary">₹{p.price} — {p.merchant_name} ({p.market})</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Mode Badges Legend */}
            <div className="flex justify-center gap-4 mt-6 text-sm">
              <span className="px-3 py-1 rounded-full bg-[#2E7D32]/20 text-white border border-white/30">🛒 Buy Now</span>
              <span className="px-3 py-1 rounded-full bg-[#25D366]/20 text-white border border-white/30">💬 WhatsApp Enquiry</span>
              <span className="px-3 py-1 rounded-full bg-[#1976D2]/20 text-white border border-white/30">📍 Visit Store</span>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Market */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {markets.map((market) => (
            <button
              key={market.id}
              onClick={() => setActiveMarket(activeMarket === market.slug ? '' : market.slug)}
              className={`text-left p-6 rounded-xl transition-all ${
                activeMarket === market.slug
                  ? 'bg-pm-primary text-white shadow-lg scale-[1.02]'
                  : 'bg-white border border-pm-border hover:shadow-md'
              }`}
            >
              <h3 className="text-xl font-bold mb-1">{market.name}</h3>
              <p className={`text-sm ${activeMarket === market.slug ? 'text-white/80' : 'text-pm-text-secondary'}`}>
                {market.specialization}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-sm font-medium ${activeMarket === market.slug ? 'text-white' : 'text-pm-primary'}`}>
                  {market.total_merchants}+ stores
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-pm-mode-a/10 text-pm-mode-a font-medium">
                  {market.merchant_ids.length} on PeteMart
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Merchant Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-pm-text">
            {activeMarket ? `${allMerchants.find(m => m.market.toLowerCase() === activeMarket)?.market || 'Filtered'} Merchants` : 'All Pilot Merchants'}
          </h2>
          <span className="text-sm text-pm-text-secondary">{displayMerchants.length} merchants</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayMerchants.map((merchant) => (
            <MerchantCard key={merchant.store_id} merchant={merchant} />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-white py-12 border-t border-pm-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-pm-text mb-6">Featured Products Today</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredProducts.slice(0, 12).map((product) => (
              <a key={product.id} href={`/product/${product.id}`} className="group">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-pm-background to-pm-primary/20 flex items-center justify-center mb-2 group-hover:shadow-md transition-shadow">
                  <span className="text-3xl opacity-60">
                    {product.category.includes('Silk') || product.category.includes('Saree') ? '🧣' :
                     product.category.includes('Bouquet') || product.category.includes('Flower') ? '💐' :
                     product.category.includes('Coffee') || product.category.includes('Croissant') ? '☕' :
                     product.category.includes('Tent') || product.category.includes('Camping') ? '⛺' :
                     product.category.includes('Kurta') || product.category.includes('Sherwani') ? '👔' :
                     product.category.includes('Cotton') || product.category.includes('Fabric') ? '🧵' : '🛍️'}
                  </span>
                </div>
                <p className="text-sm font-medium text-pm-text group-hover:text-pm-primary truncate">{product.name}</p>
                <p className="text-xs text-pm-text-secondary">₹{product.price}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Pilot Merchants', value: '9' },
            { label: 'Markets Covered', value: '2' },
            { label: 'Synthetic Products', value: '273' },
            { label: 'Interaction Modes', value: '3' },
          ].map((stat) => (
            <div key={stat.label} className="p-6 rounded-xl bg-white border border-pm-border">
              <p className="text-3xl font-bold text-pm-primary">{stat.value}</p>
              <p className="text-sm text-pm-text-secondary mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MerchantCard({ merchant }: { merchant: Merchant }) {
  const modeLabels: Record<string, { label: string; color: string }> = {
    mode_a: { label: 'Buy Now', color: 'bg-pm-mode-a' },
    mode_b: { label: 'WhatsApp', color: 'bg-pm-mode-b' },
    mode_c: { label: 'Visit Store', color: 'bg-pm-mode-c' },
  };

  return (
    <a href={`/shop/${merchant.slug}`} className="merchant-card block bg-white rounded-xl border border-pm-border overflow-hidden">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-pm-secondary to-pm-primary flex items-end p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-pm-secondary font-bold text-sm shadow">
            {merchant.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div className="text-white">
            <h3 className="font-bold">{merchant.name}</h3>
            <p className="text-xs opacity-80">{merchant.subcategory}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Market Badge & Rating */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs px-2 py-1 rounded-full bg-pm-background text-pm-text-secondary font-medium">
            📍 {merchant.market}
          </span>
          <span className="text-sm font-semibold text-pm-warning">
            ★ {merchant.rating} <span className="text-xs text-pm-text-secondary">({merchant.reviews_count})</span>
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-pm-text-secondary mb-3 line-clamp-2">{merchant.description}</p>

        {/* Mode Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {merchant.available_modes.map((mode) => (
            <span key={mode} className={`text-xs px-2 py-1 rounded-full text-white ${modeLabels[mode]?.color || 'bg-gray-500'}`}>
              {modeLabels[mode]?.label || mode}
            </span>
          ))}
        </div>

        {/* Digital Readiness */}
        <div className="flex items-center gap-2 text-xs text-pm-text-secondary">
          <span>Digital Score:</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n <= merchant.merchant_digital_readiness.digital_maturity_score ? 'text-pm-primary' : 'text-gray-300'}>
              ●
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
