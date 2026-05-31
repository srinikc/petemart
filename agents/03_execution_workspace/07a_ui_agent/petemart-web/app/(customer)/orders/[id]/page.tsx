'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ORDERS, ORDER_STATUSES } from '@/lib/data';
import { formatPrice, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';
import {
  CheckCircle2, ChevronRight, ArrowLeft, MapPin, Package,
  Truck, Info, MessageCircle, Phone
} from 'lucide-react';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = ORDERS.find(o => o.id === id);

  if (!order) {
    return (
      <div className="section-container py-20 text-center">
        <Package className="w-20 h-20 text-pm-text-secondary/30 mx-auto mb-4" />
        <h1 className="text-pm-h2 mb-2">Order Not Found</h1>
        <p className="text-pm-body text-pm-text-secondary mb-6">This order doesn&apos;t exist.</p>
        <Link href="/orders"><Button variant="default">Back to Orders</Button></Link>
      </div>
    );
  }

  const isDelivered = order.status === 'delivered' || order.status === 'completed';
  const isInTransit = order.status === 'in_transit';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="section-container py-8">
      <Link href="/orders" className="inline-flex items-center gap-1 text-pm-text-secondary hover:text-pm-gold text-pm-small mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Order Header */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-pm-h3">Order #{order.order_id}</h1>
                <p className="text-pm-small text-pm-text-secondary">Placed on {formatDateTime(order.created_at)}</p>
              </div>
              <Badge
                variant={isDelivered ? 'success' : isCancelled ? 'destructive' : 'warning'}
                className="text-pm-small px-3 py-1"
              >
                {getStatusLabel(order.status)}
              </Badge>
            </div>

            {/* Tracking Timeline */}
            <div className="mt-6">
              <h3 className="text-pm-small font-medium text-pm-text mb-4">Order Timeline</h3>
              <div className="space-y-0">
                {ORDER_STATUSES.map((status, i) => {
                  const isActive = ORDER_STATUSES.findIndex(s => s.key === order.status) >= i;
                  const isLast = i === ORDER_STATUSES.length - 1;
                  return (
                    <div key={status.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 z-10 ${
                          isActive ? 'bg-pm-success border-pm-success' : 'bg-white border-gray-300'
                        }`} />
                        {!isLast && (
                          <div className={`w-0.5 h-8 ${isActive ? 'bg-pm-success' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <div className={`pb-6 ${!isLast ? '' : ''}`}>
                        <p className={`text-pm-small font-medium ${isActive ? 'text-pm-text' : 'text-pm-text-secondary'}`}>
                          {status.label}
                        </p>
                        <p className="text-pm-tiny text-pm-text-secondary">{formatDateTime(status.date)}</p>
                      </div>
                    </div>
                  );
                })}
                {isDelivered && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full border-2 bg-pm-success border-pm-success z-10" />
                    </div>
                    <div>
                      <p className="text-pm-small font-medium text-pm-success">Delivered</p>
                      <p className="text-pm-tiny text-pm-text-secondary">✓ Package received</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Items */}
          <Card className="p-5">
            <h3 className="text-pm-body font-semibold mb-4">Items ({order.items.length})</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-pm-md bg-pm-cream flex items-center justify-center shrink-0">
                    🪢
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-pm-body font-medium text-pm-text">{item.product_name}</p>
                    <p className="text-pm-tiny text-pm-text-secondary">Qty: {item.quantity} × {formatPrice(item.unit_price)}</p>
                  </div>
                  <p className="text-pm-body font-semibold">{formatPrice(item.total_price)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <Card className="p-5">
            <h3 className="text-pm-body font-semibold flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-pm-gold" /> Delivery Address
            </h3>
            <p className="text-pm-body font-medium">{order.delivery_address.name}</p>
            <p className="text-pm-small text-pm-text-secondary">
              {order.delivery_address.line1}
              {order.delivery_address.line2 ? `, ${order.delivery_address.line2}` : ''}
            </p>
            <p className="text-pm-small text-pm-text-secondary">
              {order.delivery_address.city} - {order.delivery_address.pincode}
            </p>
          </Card>

          {/* Price Summary */}
          <Card className="p-5">
            <h3 className="text-pm-body font-semibold mb-3">Price Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-pm-small">
                <span className="text-pm-text-secondary">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-pm-small">
                <span className="text-pm-text-secondary">Delivery fee</span>
                <span>{formatPrice(order.delivery_fee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-pm-body font-bold">
                <span>Total</span>
                <span className="text-pm-burgundy">{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          {isInTransit && (
            <Link href={`/tracking/${order.id}`}>
              <Button variant="default" size="lg" className="w-full">
                <Truck className="w-5 h-5 mr-2" /> Track Live
              </Button>
            </Link>
          )}
          {isDelivered && (
            <div className="flex gap-2">
              <Button variant="outline" size="lg" className="flex-1">
                <MessageCircle className="w-4 h-4 mr-2" /> Share
              </Button>
              <Button variant="default" size="lg" className="flex-1">
                Repeat Order
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Help Banner */}
      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">
            Track your order in real-time. See the current status and estimated arrival time. Contact your courier for delivery updates.
          </p>
        </div>
      </section>
    </div>
  );
}
