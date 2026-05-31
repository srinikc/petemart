'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ORDERS } from '@/lib/data';
import { formatPrice, formatDate, getStatusColor, getStatusLabel, getDeliveryEta } from '@/lib/utils';
import { Package, ChevronLeft, MapPin, Truck, CheckCircle2, Clock, Info, ArrowRight } from 'lucide-react';

export default function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = ORDERS.find(o => o.id === id);

  if (!order) {
    return (
      <div className="section-container py-20 text-center">
        <Package className="w-20 h-20 text-pm-text-secondary/30 mx-auto mb-4" />
        <h1 className="text-pm-h2 mb-2">Order Not Found</h1>
        <p className="text-pm-body text-pm-text-secondary mb-6">The order you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/orders"><Button variant="default">Back to Orders</Button></Link>
      </div>
    );
  }

  const steps = [
    { key: 'confirmed', label: 'Order Confirmed', done: true },
    { key: 'picked_up', label: 'Picked Up', done: order.status !== 'pending' && order.status !== 'confirmed' },
    { key: 'consolidated', label: 'Consolidated', done: ['consolidated', 'in_transit', 'delivered'].includes(order.status) },
    { key: 'in_transit', label: 'In Transit', done: ['in_transit', 'delivered'].includes(order.status) },
    { key: 'delivered', label: 'Delivered', done: order.status === 'delivered' },
  ];

  return (
    <div className="section-container py-8">
      <Link href="/orders" className="inline-flex items-center gap-1 text-pm-text-secondary hover:text-pm-gold text-pm-small mb-6 transition-colors"><ChevronLeft className="w-4 h-4" /> Back to Orders</Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-pm-h2 text-pm-text mb-1">Order #{order.order_id}</h1>
          <p className="text-pm-body text-pm-text-secondary">Placed on {formatDate(order.created_at)}</p>
        </div>
        <Badge variant="outline" className="text-pm-small px-3 py-1" style={{ borderColor: getStatusColor(order.status), color: getStatusColor(order.status) }}>
          {getStatusLabel(order.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking Timeline */}
          <Card className="p-5">
            <h2 className="text-pm-body font-semibold mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-pm-gold" /> Tracking Status</h2>
            <div className="space-y-0">
              {steps.map((step, i) => (
                <div key={step.key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.done ? 'bg-pm-gold text-white' : 'bg-pm-border text-pm-text-secondary'}`}>
                      {step.done ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    {i < steps.length - 1 && <div className={`w-0.5 h-12 ${step.done ? 'bg-pm-gold' : 'bg-pm-border'}`} />}
                  </div>
                  <div className="pb-8">
                    <p className={`text-pm-body font-medium ${step.done ? 'text-pm-text' : 'text-pm-text-secondary'}`}>{step.label}</p>
                    {step.done && <p className="text-pm-tiny text-pm-text-secondary">{formatDate(order.created_at)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Order Items */}
          <Card className="p-5">
            <h2 className="text-pm-body font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-pm-md bg-pm-cream flex items-center justify-center">🛍️</div>
                    <div>
                      <p className="text-pm-small font-medium">{item.product_name}</p>
                      <p className="text-pm-tiny text-pm-text-secondary">Qty: {item.quantity} × {formatPrice(item.unit_price)}</p>
                    </div>
                  </div>
                  <p className="text-pm-small font-semibold">{formatPrice(item.total_price)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Delivery Address */}
          <Card className="p-5">
            <h2 className="text-pm-body font-semibold mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-pm-gold" /> Delivery Address</h2>
            <p className="text-pm-small font-medium">{order.delivery_address.name}</p>
            <p className="text-pm-tiny text-pm-text-secondary">{order.delivery_address.line1}</p>
            {order.delivery_address.line2 && <p className="text-pm-tiny text-pm-text-secondary">{order.delivery_address.line2}</p>}
            <p className="text-pm-tiny text-pm-text-secondary">{order.delivery_address.city} - {order.delivery_address.pincode}</p>
            <p className="text-pm-tiny text-pm-text-secondary">Phone: {order.delivery_address.phone}</p>
          </Card>

          {/* Price Summary */}
          <Card className="p-5">
            <h2 className="text-pm-body font-semibold mb-3">Price Summary</h2>
            <div className="space-y-2 text-pm-small">
              <div className="flex justify-between"><span className="text-pm-text-secondary">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-pm-text-secondary">Delivery</span><span>{formatPrice(order.delivery_fee)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold"><span>Total</span><span className="text-pm-burgundy">{formatPrice(order.total)}</span></div>
            </div>
          </Card>

          {/* ETA */}
          <Card className="p-4 bg-pm-cream">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-pm-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-pm-small font-medium">Estimated Delivery</p>
                <p className="text-pm-tiny text-pm-text-secondary">{getDeliveryEta(order.created_at)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Track your order in real-time. Use the tracking timeline to see where your order is in the delivery process. Contact support if you need help.</p>
        </div>
      </section>
    </div>
  );
}
