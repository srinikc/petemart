'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { generateWhatsAppUrl, generateGoogleMapsUrl, getMerchantBySlug } from '@/lib/data/merchants';
import { getAllProducts, Product } from '@/lib/data/products';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const allProducts = getAllProducts();
  const product = allProducts.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-pm-text mb-4">Product Not Found</h1>
        <p className="text-pm-text-secondary mb-4">This product might have been removed or is no longer available.</p>
        <a href="/" className="inline-block px-6 py-2 bg-pm-primary text-white rounded-lg hover:opacity-90">Browse Stores</a>
      </div>
    );
  }

  const merchant = getMerchantBySlug(product.merchant_slug);
  if (!merchant) return null;

  const [quantity, setQuantity] = useState(product.moq || 1);
  const whatsappUrl = generateWhatsAppUrl(merchant.whatsapp_phone, product.name, merchant.name);
  const mapsUrl = generateGoogleMapsUrl(merchant.geo, merchant.name);

  const relatedProducts = allProducts
    .filter(p => p.merchant_slug === product.merchant_slug && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-pm-text-secondary mb-6">
        <a href="/" className="hover:text-pm-primary">Home</a>
        <span className="mx-2">/</span>
        <a href={`/shop/${merchant.slug}`} className="hover:text-pm-primary">{merchant.name}</a>
        <span className="mx-2">/</span>
        <span className="text-pm-text">{product.name}</span>
      </nav>

      {/* Product Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Product Image */}
        <div className="aspect-square rounded-2xl bg-gradient-to-br from-pm-background to-pm-primary/20 flex items-center justify-center">
          <div className="text-center">
            <span className="text-8xl opacity-30">🛍️</span>
            <p className="text-pm-text-secondary text-sm mt-4">{product.category}</p>
          </div>
        </div>

        {/* Right: Product Info + 3 Modes */}
        <div>
          <div className="mb-4">
            <span className="text-xs px-2 py-1 rounded-full bg-pm-background text-pm-text-secondary font-medium">{product.category}</span>
            {product.is_featured && (
              <span className="text-xs px-2 py-1 rounded-full bg-pm-primary/10 text-pm-primary font-medium ml-2">Featured</span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-pm-text mb-2">{product.name}</h1>

          {product.description && (
            <p className="text-pm-text-secondary mb-4">{product.description}</p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-pm-text">₹{product.price.toLocaleString()}</span>
            {product.original_price > product.price && (
              <>
                <span className="text-xl text-pm-text-secondary line-through">₹{product.original_price.toLocaleString()}</span>
                <span className="text-sm px-2 py-0.5 rounded-full bg-pm-mode-a/10 text-pm-mode-a font-medium">
                  {Math.round((1 - product.price/product.original_price) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          {/* Stock & MOQ */}
          <div className="flex flex-wrap gap-4 text-sm text-pm-text-secondary mb-6">
            <span>📦 {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock — hurry!' : 'Made to Order'}</span>
            {product.moq > 1 && <span>📋 Min. Order: {product.moq} {product.unit}s</span>}
            <span>🏪 Sold by <a href={`/shop/${merchant.slug}`} className="text-pm-primary hover:underline">{merchant.name}</a></span>
          </div>

          {/* Quantity Selector (for Mode A) */}
          <div className="mb-6">
            <label className="text-sm font-medium text-pm-text block mb-2">Quantity:</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(product.moq || 1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-pm-border flex items-center justify-center hover:bg-pm-background"
              >−</button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(product.moq || 1, parseInt(e.target.value) || 1))}
                className="w-20 text-center h-10 rounded-lg border border-pm-border"
                min={product.moq || 1}
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg border border-pm-border flex items-center justify-center hover:bg-pm-background"
              >+</button>
              <span className="text-sm text-pm-text-secondary">× ₹{product.price.toLocaleString()} = ₹{(quantity * product.price).toLocaleString()}</span>
            </div>
          </div>

          {/* THE 3 MODES - Primary Actions */}
          <div className="space-y-3">
            {/* Mode A: Buy Now */}
            {merchant.available_modes.includes('mode_a') && (
              <button
                onClick={() => router.push(`/cart?add=${product.id}`)}
                className="w-full py-3 rounded-xl bg-pm-mode-a text-white font-medium text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                🛒 Add to Cart — ₹{(quantity * product.price).toLocaleString()}
              </button>
            )}

            {/* Mode B: WhatsApp Enquiry */}
            {merchant.available_modes.includes('mode_b') && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-pm-mode-b text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whatsapp-pulse block text-center"
              >
                💬 Enquire on WhatsApp — {merchant.name}
              </a>
            )}

            {/* Mode C: Visit Store */}
            {merchant.available_modes.includes('mode_c') && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-pm-mode-c text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 block text-center"
              >
                📍 Visit Store — Get Directions ({merchant.market})
              </a>
            )}
          </div>

          {/* Store Info */}
          <div className="mt-8 p-4 rounded-xl bg-pm-background border border-pm-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-pm-primary/20 flex items-center justify-center text-pm-primary font-bold text-sm">
                {merchant.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-pm-text">{merchant.name}</p>
                <p className="text-xs text-pm-text-secondary">{merchant.market} · {merchant.years_in_business} years</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-pm-text-secondary">
              <span>⭐ {merchant.rating}</span>
              <span>📍 {merchant.delivery_radius_km} km delivery</span>
              <span>💳 {merchant.payment_methods.join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-pm-text mb-4">More from {merchant.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((rp) => (
              <a key={rp.id} href={`/product/${rp.id}`} className="bg-white rounded-xl border border-pm-border p-4 hover:shadow-md transition-shadow">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-pm-background to-pm-primary/10 flex items-center justify-center mb-2">
                  <span className="text-2xl opacity-40">🛍️</span>
                </div>
                <h3 className="text-sm font-medium text-pm-text truncate">{rp.name}</h3>
                <p className="text-pm-primary font-bold text-sm">₹{rp.price.toLocaleString()}</p>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
