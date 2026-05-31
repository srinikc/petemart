'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CART_ITEMS } from '@/lib/data';
import { formatPrice, getInitials } from '@/lib/utils';
import { ShoppingCart, Trash2, Minus, Plus, Info, ArrowLeft, Tag, Truck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function CartPage() {
  const [items, setItems] = useState(CART_ITEMS);
  const [promoCode, setPromoCode] = useState('');

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.merchant_id]) {
      acc[item.merchant_id] = { merchant_name: item.merchant_name, items: [] };
    }
    acc[item.merchant_id].items.push(item);
    return acc;
  }, {} as Record<string, { merchant_name: string; items: typeof CART_ITEMS }>);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const baseDelivery = 70;
  const extraStoreSurcharge = (Object.keys(groupedItems).length - 1) * 25;
  const totalDelivery = baseDelivery + extraStoreSurcharge;
  const total = subtotal + totalDelivery;

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  if (items.length === 0) {
    return (
      <div className="section-container py-20 text-center">
        <ShoppingCart className="w-20 h-20 text-pm-text-secondary/30 mx-auto mb-4" />
        <h1 className="text-pm-h2 mb-2">Your cart is empty</h1>
        <p className="text-pm-body text-pm-text-secondary mb-6">Browse markets to add items</p>
        <Link href="/markets/chickpet"><Button variant="default" size="lg">Start Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="section-container py-8">
      <h1 className="text-pm-h2 mb-6">My Cart ({items.length} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(groupedItems).map(([merchantId, group]) => (
            <Card key={merchantId} className="p-5">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-pm-border">
                <Avatar className="w-10 h-10"><AvatarFallback className="bg-pm-gold/10 text-pm-gold text-pm-small">{getInitials(group.merchant_name)}</AvatarFallback></Avatar>
                <div>
                  <Link href={`/shop/${merchantId}`} className="text-pm-body font-semibold text-pm-text hover:text-pm-gold transition-colors">{group.merchant_name}</Link>
                  <p className="text-pm-tiny text-pm-text-secondary">Chickpet, Bangalore</p>
                </div>
              </div>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-pm-md bg-pm-cream flex items-center justify-center shrink-0">🪢</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-pm-body font-medium text-pm-text truncate">{item.product_name}</p>
                      <p className="text-pm-small text-pm-gold font-semibold">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center border border-pm-border rounded-pm-md">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-muted transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="px-3 py-1 text-pm-small font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-muted transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <p className="text-pm-body font-semibold text-pm-text w-20 text-right">{formatPrice(item.price * item.quantity)}</p>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-pm-text-secondary hover:text-pm-error transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-pm-border text-right">
                <p className="text-pm-small text-pm-text-secondary">Subtotal: <span className="font-semibold text-pm-text">{formatPrice(group.items.reduce((s, i) => s + i.price * i.quantity, 0))}</span></p>
              </div>
            </Card>
          ))}
          <Link href="/markets/chickpet" className="inline-flex items-center gap-1 text-pm-small text-pm-gold hover:text-pm-gold-dark transition-colors"><ArrowLeft className="w-4 h-4" /> Continue Shopping</Link>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-pm-body font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-pm-small">
                <span className="text-pm-text-secondary">Subtotal ({items.length} items)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="border-t border-pm-border pt-3">
                <div className="flex items-start gap-2 mb-2">
                  <Truck className="w-4 h-4 text-pm-gold shrink-0 mt-0.5" />
                  <div><p className="text-pm-small font-medium">Delivery</p><p className="text-pm-tiny text-pm-text-secondary">Zone 2 (3-7 km)</p></div>
                </div>
                <div className="space-y-1 pl-6">
                  <div className="flex justify-between text-pm-tiny"><span className="text-pm-text-secondary">Base fee</span><span>{formatPrice(baseDelivery)}</span></div>
                  {extraStoreSurcharge > 0 && (
                    <div className="flex justify-between text-pm-tiny"><span className="text-pm-text-secondary">Extra store surcharge</span><span>{formatPrice(extraStoreSurcharge)}</span></div>
                  )}
                  <div className="flex justify-between text-pm-small font-medium border-t border-pm-border pt-1"><span>Total delivery</span><span>{formatPrice(totalDelivery)}</span></div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-pm-body font-bold"><span>Order Total</span><span className="text-pm-burgundy">{formatPrice(total)}</span></div>
            </div>
            <div className="mt-4">
              <div className="flex gap-2">
                <Input placeholder="Promo Code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="text-pm-small" />
                <Button variant="outline" size="sm">Apply</Button>
              </div>
            </div>
            <Link href="/checkout"><Button variant="default" size="lg" className="w-full mt-4">Proceed to Checkout — {formatPrice(total)}</Button></Link>
          </Card>

          <Card className="p-4 bg-pm-cream border-pm-gold/20">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-pm-gold shrink-0 mt-0.5" />
              <div><p className="text-pm-small font-medium text-pm-text">Consolidated Delivery</p><p className="text-pm-tiny text-pm-text-secondary">Items from multiple stores are consolidated into a single package for delivery.</p></div>
            </div>
          </Card>
        </div>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Review items from multiple stores. Delivery is consolidated into a single package. Proceed to checkout when ready.</p>
        </div>
      </section>
    </div>
  );
}
