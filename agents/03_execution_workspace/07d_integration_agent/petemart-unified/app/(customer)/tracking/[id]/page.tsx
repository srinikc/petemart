'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ORDER_STATUSES } from '@/lib/data';
import { getStatusColor, getStatusLabel, getDeliveryEta } from '@/lib/utils';
import { Truck, MapPin, Phone, Share2, CheckCircle2, Clock, ChevronLeft, Info } from 'lucide-react';

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="section-container py-8">
      <Link href="/orders" className="inline-flex items-center gap-1 text-pm-text-secondary hover:text-pm-gold text-pm-small mb-6 transition-colors"><ChevronLeft className="w-4 h-4" /> Back to Orders</Link>

      {/* Tracking Header */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-pm-gold/5 to-pm-burgundy/5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-pm-h2 mb-1">Order in Transit</h1>
            <p className="text-pm-body text-pm-text-secondary">PM-20260530-001</p>
          </div>
          <Badge variant="default" className="bg-pm-gold text-white">Expected by {getDeliveryEta('2026-05-30T10:30:00Z')}</Badge>
        </div>

        {/* Map Placeholder */}
        <div className="h-48 bg-pm-cream rounded-pm-lg flex items-center justify-center border border-pm-border mb-4">
          <div className="text-center">
            <MapPin className="w-10 h-10 text-pm-gold mx-auto mb-2" />
            <p className="text-pm-small text-pm-text-secondary">Live tracking map</p>
            <p className="text-pm-tiny text-pm-text-secondary">(Map integration pending)</p>
          </div>
        </div>

        {/* Courier Info */}
        <div className="flex items-center justify-between bg-white rounded-pm-lg p-4 border border-pm-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-pm-gold/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-pm-gold" />
            </div>
            <div>
              <p className="text-pm-small font-medium">Delivery Partner Assigned</p>
              <p className="text-pm-tiny text-pm-text-secondary">Rajan, will call before delivery</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="w-10 h-10 p-0"><Phone className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" className="w-10 h-10 p-0"><Share2 className="w-4 h-4" /></Button>
          </div>
        </div>
      </Card>

      {/* Progress Timeline */}
      <Card className="p-6 mb-6">
        <h2 className="text-pm-body font-semibold mb-6">Progress</h2>
        <div className="space-y-0">
          {ORDER_STATUSES.map((step, i) => (
            <div key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i <= 2 ? 'bg-pm-gold text-white' : 'bg-pm-border text-pm-text-secondary'}`}>
                  {i <= 2 ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                {i < ORDER_STATUSES.length - 1 && <div className={`w-0.5 h-12 ${i <= 2 ? 'bg-pm-gold' : 'bg-pm-border'}`} />}
              </div>
              <div className="pb-8">
                <p className={`text-pm-body font-medium ${i <= 2 ? 'text-pm-text' : 'text-pm-text-secondary'}`}>{step.label}</p>
                {i <= 2 && <p className="text-pm-tiny text-pm-text-secondary">{step.date}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4 bg-pm-cream border-pm-gold/20 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0 mt-0.5" />
          <div>
            <p className="text-pm-small font-medium text-pm-text">Quick Actions</p>
            <div className="flex gap-2 mt-2">
              <Button variant="default" size="sm"><Phone className="w-4 h-4 mr-1" /> Call Delivery</Button>
              <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1" /> Share Status</Button>
              <Button variant="outline" size="sm"><CheckCircle2 className="w-4 h-4 mr-1" /> Mark Received</Button>
            </div>
          </div>
        </div>
      </Card>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Track your delivery in real-time. Your delivery partner will call before arriving. You can also share your tracking status with family members.</p>
        </div>
      </section>
    </div>
  );
}
