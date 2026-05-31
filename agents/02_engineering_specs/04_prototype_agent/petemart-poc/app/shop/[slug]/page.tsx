'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { getMerchantBySlug, generateWhatsAppUrl, generateGoogleMapsUrl } from '@/lib/data/merchants';
import { getProductsForMerchant, Product } from '@/lib/data/products';

export default function MerchantPage() {
  const params = useParams();
  const slug = params.slug as string;
  const merchant = getMerchantBySlug(slug);

  if (!merchant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-pm-text mb-4">Merchant Not Found</h1>
        <p className="text-pm-text-secondary">The store you&apos;re looking for doesn&apos;t exist or hasn&apos;t been onboarded yet.</p>
        <a href="/" className="mt-4 inline-block px-6 py-2 bg-pm-primary text-white rounded-lg">Back to Home</a>
      </div>
    );
  }

  const products = getProductsForMerchant(merchant.store_id);
  const [activeTab, setActiveTab] = useState<'products' | 'about' | 'reviews'>('products');

  const modeLabels: Record<string, { label: string; color: string; icon: string }> = {
    mode_a: { label: 'Buy Now', color: 'bg-pm-mode-a', icon: '🛒' },
    mode_b: { label: 'Enquire on WhatsApp', color: 'bg-pm-mode-b', icon: '💬' },
    mode_c: { label: 'Visit Store', color: 'bg-pm-mode-c', icon: '📍' },
  };

  return (
    <div>
      {/* Store Header */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-pm-secondary to-pm-primary">
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-gradient-to-t from-black/60 to-transparent">
          <div className="max-w-7xl mx-auto flex items-end gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white/90 flex items-center justify-center text-pm-secondary font-bold text-2xl shadow-lg shrink-0">
              {merchant.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="text-white">
              <h1 className="text-2xl md:text-3xl font-bold">{merchant.name}</h1>
              <p className="text-sm opacity-80">{merchant.subcategory} · {merchant.market}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-white border-b border-pm-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm">
            <span className="flex items-center gap-1">⭐ <strong>{merchant.rating}</strong> ({merchant.reviews_count} reviews)</span>
            <span>📅 {merchant.years_in_business} years in business</span>
            <span>📍 {merchant.market}</span>
            <span>🚚 Delivers up to {merchant.delivery_radius_km} km</span>
            <span>🕐 {merchant.business_hours.mon_fri}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons - The 3 Modes */}
      <div className="bg-white border-b border-pm-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-3">
          {merchant.available_modes.includes('mode_a') && (
            <a href={`/cart?store=${merchant.slug}`} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-pm-mode-a text-white font-medium text-sm hover:opacity-90 transition-opacity">
              🛒 Buy Now
            </a>
          )}
          {merchant.available_modes.includes('mode_b') && (
            <a
              href={generateWhatsAppUrl(merchant.whatsapp_phone, 'products', merchant.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp-pulse flex items-center gap-2 px-6 py-2.5 rounded-lg bg-pm-mode-b text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              💬 Enquire on WhatsApp
            </a>
          )}
          {merchant.available_modes.includes('mode_c') && (
            <a
              href={generateGoogleMapsUrl(merchant.geo, merchant.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-pm-mode-c text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              📍 Visit Store — Get Directions
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 border-b border-pm-border mb-6">
          {(['products', 'about', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab ? 'text-pm-primary border-b-2 border-pm-primary' : 'text-pm-text-secondary hover:text-pm-text'
              }`}
            >
              {tab} {tab === 'products' && `(${products.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} merchantName={merchant.name} merchantSlug={merchant.slug} merchantPhone={merchant.whatsapp_phone} merchantGeo={merchant.geo} availableModes={merchant.available_modes} />
            ))}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-2xl">
            <p className="text-pm-text-secondary mb-6">{merchant.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-pm-text">Market:</span> <span className="text-pm-text-secondary">{merchant.market}</span></div>
              <div><span className="font-medium text-pm-text">Category:</span> <span className="text-pm-text-secondary">{merchant.category}</span></div>
              <div><span className="font-medium text-pm-text">Years in Business:</span> <span className="text-pm-text-secondary">{merchant.years_in_business}</span></div>
              <div><span className="font-medium text-pm-text">Delivery Radius:</span> <span className="text-pm-text-secondary">{merchant.delivery_radius_km} km</span></div>
              <div><span className="font-medium text-pm-text">GST Registered:</span> <span className="text-pm-text-secondary">{merchant.gst_registered ? 'Yes' : 'No'}</span></div>
              <div><span className="font-medium text-pm-text">Languages:</span> <span className="text-pm-text-secondary">{merchant.languages_spoken.join(', ')}</span></div>
              <div><span className="font-medium text-pm-text">Payment Methods:</span> <span className="text-pm-text-secondary">{merchant.payment_methods.join(', ')}</span></div>
              <div><span className="font-medium text-pm-text">Hours:</span> <span className="text-pm-text-secondary">{merchant.business_hours.mon_fri} (Mon-Fri)</span></div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="text-center py-12 text-pm-text-secondary">
            <p className="text-lg mb-2">⭐ {merchant.rating} out of 5</p>
            <p>Based on {merchant.reviews_count} reviews</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, merchantName, merchantSlug, merchantPhone, merchantGeo, availableModes }: {
  product: Product; merchantName: string; merchantSlug: string; merchantPhone: string;
  merchantGeo: { lat: number; lng: number }; availableModes: string[];
}) {
  const [showModes, setShowModes] = useState(false);

  const whatsappUrl = generateWhatsAppUrl(merchantPhone, product.name, merchantName);
  const mapsUrl = generateGoogleMapsUrl(merchantGeo, merchantName);

  return (
    <div className="bg-white rounded-xl border border-pm-border overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Image Placeholder */}
      <a href={`/product/${product.id}`}>
        <div className="aspect-square bg-gradient-to-br from-pm-background to-pm-primary/10 flex items-center justify-center">
          <span className="text-4xl opacity-40">
            {product.category.includes('Silk') || product.category.includes('Saree') ? '🧣' :
             product.category.includes('Bouquet') || product.category.includes('Flower') ? '💐' :
             product.category.includes('Coffee') || product.category.includes('Croissant') || product.category.includes('Cake') ? '☕' :
             product.category.includes('Tent') || product.category.includes('Camping') ? '⛺' :
             product.category.includes('Kurta') || product.category.includes('Sherwani') || product.category.includes('Pathani') ? '👔' :
             product.category.includes('Fabric') ? '🧵' :
             product.category.includes('Kurti') || product.category.includes('Frock') ? '👗' : '🛍️'}
          </span>
        </div>
      </a>

      <div className="p-4">
        <a href={`/product/${product.id}`}>
          <h3 className="font-medium text-pm-text text-sm mb-1 line-clamp-2 hover:text-pm-primary">{product.name}</h3>
        </a>
        <p className="text-xs text-pm-text-secondary mb-2">{product.category}</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-pm-text">₹{product.price.toLocaleString()}</span>
          {product.original_price > product.price && (
            <span className="text-sm text-pm-text-secondary line-through">₹{product.original_price.toLocaleString()}</span>
          )}
          {product.original_price > product.price && (
            <span className="text-xs text-pm-mode-a font-medium">{Math.round((1 - product.price/product.original_price) * 100)}% off</span>
          )}
        </div>
        {product.moq > 1 && <p className="text-xs text-pm-text-secondary mb-2">Min. order: {product.moq} {product.unit}s</p>}

        {/* 3 Mode Buttons */}
        <div className="space-y-2">
          {availableModes.includes('mode_a') && (
            <a href={`/cart?add=${product.id}`} className="block w-full text-center px-3 py-2 rounded-lg bg-pm-mode-a text-white text-xs font-medium hover:opacity-90">
              🛒 Buy Now — ₹{product.price.toLocaleString()}
            </a>
          )}
          {availableModes.includes('mode_b') && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-3 py-2 rounded-lg bg-pm-mode-b text-white text-xs font-medium hover:opacity-90">
              💬 Enquire on WhatsApp
            </a>
          )}
          {availableModes.includes('mode_c') && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-3 py-2 rounded-lg bg-pm-mode-c text-white text-xs font-medium hover:opacity-90">
              📍 Visit Store
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
