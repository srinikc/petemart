'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ORDERS } from '@/lib/data';
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Package, ChevronRight, Info, ArrowRight } from 'lucide-react';

export default function OrderHistoryPage() {
  if (ORDERS.length === 0) {
    return (
      <div className="section-container py-20 text-center">
        <Package className="w-20 h-20 text-pm-text-secondary/30 mx-auto mb-4" />
        <h1 className="text-pm-h2 mb-2">No orders yet</h1>
        <p className="text-pm-body text-pm-text-secondary mb-6">Start shopping to see your orders here</p>
        <Link href="/markets/chickpet"><Button variant="default" size="lg">Browse Markets</Button></Link>
      </div>
    );
  }

  return (
    <div className="section-container py-8">
      <h1 className="text-pm-h2 mb-6">My Orders</h1>
      <div className="space-y-4">
        {ORDERS.map((order) => (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <Card className="p-5 hover:shadow-pm-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-pm-body font-semibold text-pm-text">Order #{order.order_id}</p>
                  <p className="text-pm-tiny text-pm-text-secondary">Placed on {formatDate(order.created_at)}</p>
                </div>
                <Badge variant="outline" className="text-pm-tiny" style={{ borderColor: getStatusColor(order.status), color: getStatusColor(order.status) }}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <div className="space-y-2 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-pm-small text-pm-text-secondary">
                    <span className="truncate mr-2">{item.product_name} × {item.quantity}</span>
                    <span className="shrink-0">{formatPrice(item.total_price)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-pm-border">
                <p className="text-pm-body font-bold">Total: <span className="text-pm-burgundy">{formatPrice(order.total)}</span></p>
                <span className="text-pm-small text-pm-gold flex items-center gap-1">View Details <ChevronRight className="w-4 h-4" /></span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">View your order history and track current deliveries. Click on an order to see details and tracking information.</p>
        </div>
      </section>
    </div>
  );
}
