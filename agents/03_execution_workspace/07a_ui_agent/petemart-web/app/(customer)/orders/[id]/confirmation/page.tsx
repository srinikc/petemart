'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ORDERS } from '@/lib/data';
import { formatPrice } from '@/lib/utils';
import { CheckCircle2, Package, ArrowRight, Share2, Info } from 'lucide-react';

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = ORDERS.find(o => o.id === id);

  if (!order) {
    return (
      <div className="section-container py-20 text-center">
        <Package className="w-20 h-20 text-pm-text-secondary/30 mx-auto mb-4" />
        <h1 className="text-pm-h2 mb-2">Order Not Found</h1>
        <Link href="/"><Button variant="default">Back to Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-pm-success/10 flex items-center justify-center animate-slide-up">
            <CheckCircle2 className="w-14 h-14 text-pm-success" />
          </div>
          <h1 className="text-pm-h1 text-pm-text mb-2">Order Placed Successfully!</h1>
          <p className="text-pm-body text-pm-text-secondary">
            Your order has been placed and payment is confirmed.
          </p>
        </div>

        <Card className="p-6 mb-6 text-left">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-pm-small text-pm-text-secondary">Order ID</span>
              <span className="text-pm-body font-semibold text-pm-text">{order.order_id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-pm-small text-pm-text-secondary">Estimated Delivery</span>
              <span className="text-pm-body font-semibold text-pm-success">Today, 4:30 - 6:30 PM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-pm-small text-pm-text-secondary">Items</span>
              <span className="text-pm-body font-medium">{order.items.length} items</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-pm-border">
              <span className="text-pm-body font-semibold">Total Paid</span>
              <span className="text-pm-h3 text-pm-burgundy">{formatPrice(order.total)}</span>
            </div>
          </div>
        </Card>

        {/* Items Summary */}
        <details className="text-left mb-6">
          <summary className="text-pm-small text-pm-gold cursor-pointer font-medium">
            View Items Summary
          </summary>
          <div className="mt-3 space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-pm-small text-pm-text-secondary">
                <span>{item.product_name} × {item.quantity}</span>
                <span>{formatPrice(item.total_price)}</span>
              </div>
            ))}
          </div>
        </details>

        {/* Actions */}
        <div className="space-y-3">
          <Link href={`/tracking/${order.id}`}>
            <Button variant="default" size="lg" className="w-full">
              <Package className="w-5 h-5 mr-2" /> Track Order
            </Button>
          </Link>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" size="lg" className="w-full">
                Continue Shopping
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-8 p-4 bg-pm-cream rounded-pm-lg border border-pm-gold/20">
          <p className="text-pm-small text-pm-text-secondary">
            💡 Keep your phone handy — we&apos;ll send live delivery updates!
          </p>
        </div>
      </div>

      {/* Help Banner */}
      <section className="section-container mt-12">
        <div className="bg-pm-cream border border-pm-border rounded-pm-lg p-4">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-pm-gold shrink-0" />
            <p className="text-pm-small text-pm-text-secondary">
              Your order has been placed and payment is confirmed. Track your delivery in real-time from the order tracking page.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
