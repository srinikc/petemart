'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getAllProducts, Product } from '@/lib/data/products';
import { getMerchantBySlug } from '@/lib/data/merchants';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-20 text-center">Loading cart...</div>}>
      <CartContent />
    </Suspense>
  );
}

function CartContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const allProducts = getAllProducts();
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage + handle ?add= param
  useEffect(() => {
    const stored = localStorage.getItem('petemart_cart');
    const savedCart: CartItem[] = stored ? JSON.parse(stored) : [];

    const addId = searchParams.get('add');
    if (addId) {
      const product = allProducts.find(p => p.id === addId);
      if (product) {
        const existing = savedCart.findIndex(i => i.product.id === addId);
        if (existing >= 0) {
          savedCart[existing].quantity += product.moq || 1;
        } else {
          savedCart.push({ product, quantity: product.moq || 1 });
        }
      }
    }

    setItems(savedCart);
    localStorage.setItem('petemart_cart', JSON.stringify(savedCart));
  }, [searchParams, allProducts]);

  const updateQuantity = (productId: string, newQty: number) => {
    const updated = items.map(i =>
      i.product.id === productId ? { ...i, quantity: Math.max(i.product.moq || 1, newQty) } : i
    );
    setItems(updated);
    localStorage.setItem('petemart_cart', JSON.stringify(updated));
  };

  const removeItem = (productId: string) => {
    const updated = items.filter(i => i.product.id !== productId);
    setItems(updated);
    localStorage.setItem('petemart_cart', JSON.stringify(updated));
  };

  // Group by merchant
  const groupedByMerchant = items.reduce<Record<string, CartItem[]>>((acc, item) => {
    const key = item.product.merchant_slug;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4 opacity-30">🛒</div>
        <h1 className="text-2xl font-bold text-pm-text mb-2">Your Cart is Empty</h1>
        <p className="text-pm-text-secondary mb-6">Add products from your favourite Pete stores to get started.</p>
        <a href="/" className="inline-block px-6 py-3 bg-pm-primary text-white rounded-lg hover:opacity-90">Browse Stores</a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-pm-text mb-2">Shopping Cart</h1>
      <p className="text-pm-text-secondary mb-6">{totalItems} items across {Object.keys(groupedByMerchant).length} stores</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedByMerchant).map(([slug, merchantItems]) => {
            const merchant = getMerchantBySlug(slug);
            if (!merchant) return null;
            return (
              <div key={slug} className="bg-white rounded-xl border border-pm-border overflow-hidden">
                <div className="bg-pm-background px-4 py-3 border-b border-pm-border flex items-center justify-between">
                  <a href={`/shop/${slug}`} className="flex items-center gap-2 hover:text-pm-primary">
                    <div className="w-8 h-8 rounded-full bg-pm-primary/20 flex items-center justify-center text-pm-primary font-bold text-xs">
                      {merchant.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium text-pm-text">{merchant.name}</span>
                  </a>
                  <span className="text-sm text-pm-text-secondary">{merchantItems.length} item(s)</span>
                </div>

                {merchantItems.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4 p-4 border-b border-pm-border last:border-0">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-pm-background to-pm-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xl opacity-40">🛍️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={`/product/${item.product.id}`} className="text-sm font-medium text-pm-text hover:text-pm-primary truncate block">
                        {item.product.name}
                      </a>
                      <p className="text-xs text-pm-text-secondary">{item.product.category}</p>
                      <p className="text-sm font-bold text-pm-text mt-1">₹{item.product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 rounded-lg border border-pm-border flex items-center justify-center text-sm hover:bg-pm-background">−</button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 rounded-lg border border-pm-border flex items-center justify-center text-sm hover:bg-pm-background">+</button>
                    </div>
                    <p className="text-sm font-bold text-pm-text w-24 text-right">₹{(item.product.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => removeItem(item.product.id)} className="text-pm-text-secondary hover:text-red-500 text-sm">✕</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-pm-border p-6 sticky top-24">
            <h2 className="text-lg font-bold text-pm-text mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              {Object.entries(groupedByMerchant).map(([slug, merchantItems]) => {
                const merchant = getMerchantBySlug(slug);
                const storeTotal = merchantItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
                return (
                  <div key={slug} className="flex justify-between">
                    <span className="text-pm-text-secondary">{merchant?.name || slug}</span>
                    <span className="font-medium">₹{storeTotal.toLocaleString()}</span>
                  </div>
                );
              })}
              <div className="border-t border-pm-border pt-2 mt-2">
                <div className="flex justify-between font-bold text-pm-text">
                  <span>Total</span>
                  <span>₹{totalPrice.toLocaleString()}</span>
                </div>
                <p className="text-xs text-pm-text-secondary mt-1">Delivery charges calculated at checkout</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-3 rounded-xl bg-pm-mode-a text-white font-medium hover:opacity-90 transition-opacity"
            >
              Proceed to Checkout
            </button>

            <a href="/" className="block text-center text-sm text-pm-primary mt-3 hover:underline">
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
