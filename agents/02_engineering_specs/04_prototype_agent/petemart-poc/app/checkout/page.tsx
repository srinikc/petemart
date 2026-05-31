'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllProducts, Product } from '@/lib/data/products';
import { getMerchantBySlug } from '@/lib/data/merchants';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const allProducts = getAllProducts();
  const [items, setItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<'address' | 'payment' | 'confirm'>('address');
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: 'Bangalore', pincode: '', notes: '' });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('petemart_cart');
    if (stored) {
      const parsed: CartItem[] = JSON.parse(stored);
      if (parsed.length === 0) router.push('/cart');
      setItems(parsed);
    } else {
      router.push('/cart');
    }
  }, [router]);

  const totalPrice = items.reduce((s, i) => s + i.product.price * i.quantity, 0);

  const handlePlaceOrder = () => {
    const id = `PM${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    setOrderId(id);
    const order = {
      id,
      items,
      total: totalPrice,
      delivery: form,
      status: 'confirmed',
      created_at: new Date().toISOString(),
      estimated_delivery: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    };
    localStorage.setItem(`petemart_order_${id}`, JSON.stringify(order));
    const orderHistory = JSON.parse(localStorage.getItem('petemart_orders') || '[]');
    orderHistory.unshift(order);
    localStorage.setItem('petemart_orders', JSON.stringify(orderHistory));
    localStorage.removeItem('petemart_cart');
    setOrderPlaced(true);
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-pm-text mb-2">Order Placed!</h1>
        <p className="text-lg text-pm-text-secondary mb-6">Your order from PeteMart is confirmed.</p>
        <div className="bg-white rounded-xl border border-pm-border p-6 mb-6">
          <p className="font-mono text-lg font-bold text-pm-primary">{orderId}</p>
          <p className="text-sm text-pm-text-secondary mt-2">Estimated delivery: {new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <a href="/orders" className="px-6 py-3 bg-pm-primary text-white rounded-lg hover:opacity-90">Track Orders</a>
          <a href="/" className="px-6 py-3 border border-pm-border rounded-lg text-pm-text hover:bg-pm-background">Shop More</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-pm-text mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-8 text-sm">
        {['address', 'payment', 'confirm'].map((s, i) => (
          <div key={s} className={`flex items-center gap-2 ${step === s ? 'text-pm-primary font-bold' : 'text-pm-text-secondary'}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 ${step === s ? 'border-pm-primary bg-pm-primary text-white' : 'border-pm-border'}`}>{i + 1}</span>
            <span className="capitalize hidden md:inline">{s === 'confirm' ? 'Confirm' : s}</span>
            {i < 2 && <span className="w-8 h-px bg-pm-border ml-2" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Step 1: Address */}
          {step === 'address' && (
            <div className="bg-white rounded-xl border border-pm-border p-6">
              <h2 className="text-lg font-bold text-pm-text mb-4">Delivery Address</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-pm-text block mb-1">Full Name</label>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border border-pm-border rounded-lg text-sm" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="text-sm text-pm-text block mb-1">Phone</label>
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-pm-border rounded-lg text-sm" placeholder="+91 XXXXXXXXXX" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-pm-text block mb-1">Address</label>
                  <textarea value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border border-pm-border rounded-lg text-sm" rows={3} placeholder="Street, area, landmark..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-pm-text block mb-1">City</label>
                    <input value={form.city} readOnly className="w-full px-3 py-2 border border-pm-border rounded-lg text-sm bg-pm-background" />
                  </div>
                  <div>
                    <label className="text-sm text-pm-text block mb-1">Pincode</label>
                    <input value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} className="w-full px-3 py-2 border border-pm-border rounded-lg text-sm" placeholder="560XXX" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-pm-text block mb-1">Order Notes (optional)</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2 border border-pm-border rounded-lg text-sm" rows={2} placeholder="Any special instructions?" />
                </div>
              </div>
              <button
                onClick={() => setStep('payment')}
                disabled={!form.name || !form.phone || !form.address || !form.pincode}
                className="mt-6 w-full py-3 rounded-xl bg-pm-primary text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 'payment' && (
            <div className="bg-white rounded-xl border border-pm-border p-6">
              <h2 className="text-lg font-bold text-pm-text mb-4">Payment Method</h2>

              <div className="space-y-3">
                {[
                  { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives', fee: 0 },
                  { id: 'upi', label: 'UPI / GPay / PhonePe', desc: 'Pay via any UPI app', fee: 0 },
                  { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', fee: 0.02 },
                  { id: 'razorpay', label: 'Razorpay Test Payment', desc: 'Simulated online payment (POC demo)', fee: 0 },
                ].map((p) => (
                  <label key={p.id} className="flex items-center gap-3 p-4 rounded-lg border border-pm-border hover:bg-pm-background cursor-pointer">
                    <input type="radio" name="payment" defaultChecked={p.id === 'cod'} className="accent-pm-primary" />
                    <div>
                      <p className="text-sm font-medium text-pm-text">{p.label}</p>
                      <p className="text-xs text-pm-text-secondary">{p.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('address')} className="px-4 py-3 border border-pm-border rounded-lg text-sm text-pm-text hover:bg-pm-background">Back</button>
                <button onClick={() => setStep('confirm')} className="flex-1 py-3 rounded-xl bg-pm-primary text-white font-medium hover:opacity-90">Review Order</button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <div className="bg-white rounded-xl border border-pm-border p-6">
              <h2 className="text-lg font-bold text-pm-text mb-4">Confirm Order</h2>
              <div className="space-y-3 mb-6">
                <p className="text-sm"><span className="font-medium">Delivering to:</span> {form.name}, {form.address}, {form.city} — {form.pincode}</p>
                <p className="text-sm"><span className="font-medium">Phone:</span> {form.phone}</p>
                {form.notes && <p className="text-sm"><span className="font-medium">Notes:</span> {form.notes}</p>}
              </div>

              <div className="border-t border-pm-border pt-4 space-y-2">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-pm-text-secondary">{item.product.name} × {item.quantity}</span>
                    <span className="font-medium">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-pm-border pt-2 flex justify-between font-bold text-pm-text">
                  <span>Total</span>
                  <span>₹{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep('payment')} className="px-4 py-3 border border-pm-border rounded-lg text-sm text-pm-text hover:bg-pm-background">Back</button>
                <button onClick={handlePlaceOrder} className="flex-1 py-3 rounded-xl bg-pm-mode-a text-white font-medium hover:opacity-90 text-lg">
                  🛒 Place Order — ₹{totalPrice.toLocaleString()}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-pm-border p-4 sticky top-24">
            <h3 className="font-bold text-pm-text mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-pm-background flex items-center justify-center text-xs shrink-0">🛍️</div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.product.name}</p>
                    <p className="text-pm-text-secondary">×{item.quantity}</p>
                  </div>
                  <span className="font-medium">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-pm-border mt-3 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>₹{totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
