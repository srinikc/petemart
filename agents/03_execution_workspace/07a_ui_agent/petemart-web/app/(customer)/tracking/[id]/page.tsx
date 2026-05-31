'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ORDERS, ORDER_STATUSES } from '@/lib/data';
import { formatPrice, getStatusLabel, formatDateTime } from '@/lib/utils';
import {
  ArrowLeft, Phone, MapPin, CheckCircle, Truck,
  Package, Store, Warehouse, Home, Info, Navigation
} from 'lucide-react';
import { toast } from 'sonner';

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = ORDERS.find(o => o.id === id);
  const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.key === order?.status);

  if (!order) {
    return (
      <div className="section-container py-20 text-center">
        <h1 className="text-pm-h2 mb-4">Tracking Not Found</h1>
        <Link href="/orders"><Button variant="default">Back to Orders</Button></Link>
      </div>
    );
  }

  const timelineSteps = [
    { icon: CheckCircle, label: 'Order Confirmed', key: 'confirmed' },
    { icon: Package, label: 'Picked Up', key: 'picked_up' },
    { icon: Warehouse, label: 'Consolidated', key: 'consolidated' },
    { icon: Truck, label: 'In Transit', key: 'in_transit' },
    { icon: Home, label: 'Delivered', key: 'delivered' },
  ];

  return (
    <div className="section-container py-8">
      <Link href="/orders" className="inline-flex items-center gap-1 text-pm-text-secondary hover:text-pm-gold text-pm-small mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Live Tracking Header */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-pm-success animate-pulse-dot" />
                  <h1 className="text-pm-h3">Live Tracking</h1>
                </div>
                <p className="text-pm-small text-pm-text-secondary mt-1">Order #{order.order_id}</p>
              </div>
              <Badge variant="info" className="text-pm-small px-3 py-1">
                {getStatusLabel(order.status)}
              </Badge>
            </div>

            {/* ETA Banner */}
            <div className="bg-pm-success/5 border border-pm-success/20 rounded-pm-md p-4 mb-6">
              <div className="flex items-center gap-3">
                <Truck className="w-8 h-8 text-pm-success" />
                <div>
                  <p className="text-pm-body font-semibold text-pm-success">Arriving in ~30 mins</p>
                  <p className="text-pm-tiny text-pm-text-secondary">Estimated delivery between 4:30 - 6:30 PM</p>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="aspect-[16/9] bg-gradient-to-br from-pm-cream to-pm-gold/10 rounded-pm-md border border-pm-border flex items-center justify-center mb-6">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-pm-gold/50 mx-auto mb-2" />
                <p className="text-pm-body text-pm-text-secondary">Live Map</p>
                <p className="text-pm-tiny text-pm-text-secondary">Courier location tracking</p>
              </div>
            </div>

            {/* Courier Info */}
            <div className="flex items-center gap-4 p-4 bg-pm-cream rounded-pm-md">
              <div className="w-12 h-12 rounded-full bg-pm-gold/20 flex items-center justify-center">
                <Store className="w-6 h-6 text-pm-gold" />
              </div>
              <div className="flex-1">
                <p className="text-pm-body font-medium">Raju, Your Courier Partner</p>
                <p className="text-pm-tiny text-pm-text-secondary">Vehicle: TVS XL 100 • KA-01-AB-1234</p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0">
                <Phone className="w-4 h-4 mr-1" /> Call
              </Button>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-5">
            <h3 className="text-pm-body font-semibold mb-6">Order Progress</h3>
            <div className="space-y-0">
              {timelineSteps.map((step, i) => {
                const isCompleted = currentStatusIndex >= i;
                const isCurrent = currentStatusIndex === i && order.status !== 'delivered';
                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                        isCompleted ? 'bg-pm-success text-white' :
                        isCurrent ? 'bg-pm-gold text-white animate-pulse' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div className={`w-0.5 h-12 ${isCompleted ? 'bg-pm-success' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className={`pb-8 ${isCompleted ? '' : ''}`}>
                      <p className={`text-pm-body font-medium ${isCompleted ? 'text-pm-text' : 'text-pm-text-secondary'}`}>
                        {step.label}
                        {isCurrent && <span className="ml-2 text-pm-tiny text-pm-gold">In Progress</span>}
                      </p>
                      {isCompleted && (
                        <p className="text-pm-tiny text-pm-text-secondary">
                          {formatDateTime(new Date().toISOString())}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <Card className="p-5">
            <h3 className="text-pm-body font-semibold flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-pm-gold" /> Delivering To
            </h3>
            <p className="text-pm-body font-medium">{order.delivery_address.name}</p>
            <p className="text-pm-small text-pm-text-secondary">{order.delivery_address.line1}</p>
            <p className="text-pm-small text-pm-text-secondary">{order.delivery_address.city} - {order.delivery_address.pincode}</p>
          </Card>

          {/* Quick Actions */}
          <Card className="p-5 space-y-3">
            <Button variant="mode-whatsapp" className="w-full">
              <Phone className="w-4 h-4 mr-2" /> Call Courier
            </Button>
            <Button variant="outline" className="w-full">
              <Navigation className="w-4 h-4 mr-2" /> Share Location
            </Button>
            <Button variant="default" className="w-full">
              <CheckCircle className="w-4 h-4 mr-2" /> Mark as Received
            </Button>
          </Card>

          {/* Delivery Instructions */}
          <Card className="p-5">
            <h3 className="text-pm-body font-semibold mb-2">Delivery Instructions</h3>
            <textarea
              className="w-full h-20 rounded-pm-md border border-pm-border p-3 text-pm-small resize-none"
              placeholder="Add delivery instructions for the courier..."
            />
          </Card>
        </div>
      </div>

      {/* Help Banner */}
      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">
            Track your order in real-time. See the current status, courier location, and estimated arrival time. Contact your courier for any delivery updates.
          </p>
        </div>
      </section>
    </div>
  );
}
