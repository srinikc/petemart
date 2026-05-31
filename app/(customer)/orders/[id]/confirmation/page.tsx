'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Package, ArrowRight, MapPin, Info } from 'lucide-react';

export default function OrderConfirmationPage() {
  return (
    <div className="section-container py-12">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-pm-h1 text-pm-text mb-2">Order Confirmed! 🎉</h1>
        <p className="text-pm-body text-pm-text-secondary mb-2">Your order has been placed successfully.</p>
        <p className="text-pm-small text-pm-text-secondary mb-8">Order ID: <strong className="text-pm-text">PM-20260530-001</strong></p>

        <Card className="p-6 text-left mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-pm-gold" />
            <h2 className="text-pm-body font-semibold">What Happens Next?</h2>
          </div>
          <ol className="space-y-3 text-pm-small text-pm-text-secondary">
            <li className="flex gap-2"><span className="font-bold text-pm-gold">1.</span> The merchant will receive your order and start preparing it.</li>
            <li className="flex gap-2"><span className="font-bold text-pm-gold">2.</span> Your order will be picked up and consolidated at our hub.</li>
            <li className="flex gap-2"><span className="font-bold text-pm-gold">3.</span> Our delivery partner will bring it to your doorstep.</li>
          </ol>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/tracking/order-1">
            <Button variant="default" size="lg">Track Order <ArrowRight className="ml-2 w-4 h-4" /></Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" size="lg">View All Orders</Button>
          </Link>
        </div>

        <Link href="/" className="inline-block mt-4 text-pm-small text-pm-gold hover:text-pm-gold-dark">Continue Shopping</Link>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-12 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">You can track your order in real-time from the order tracking page. You&apos;ll also receive updates via WhatsApp.</p>
        </div>
      </section>
    </div>
  );
}
