'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

const MOCK_ORDERS = [
  { id: 'PM-1024', customer: 'Priya S.', items: 3, total: 3200, status: 'packing', date: '2026-05-30', phone: '+91-9999999999' },
  { id: 'PM-1023', customer: 'Deepa P.', items: 1, total: 12500, status: 'confirmed', date: '2026-05-30', phone: '+91-9888888888' },
  { id: 'PM-1022', customer: 'Ravi K.', items: 2, total: 1800, status: 'delivered', date: '2026-05-29', phone: '+91-9777777777' },
  { id: 'PM-1021', customer: 'Ananya M.', items: 4, total: 5600, status: 'in_transit', date: '2026-05-28', phone: '+91-9666666666' },
  { id: 'PM-1020', customer: 'Suresh B.', items: 2, total: 4200, status: 'cancelled', date: '2026-05-28', phone: '+91-9555555555' },
];

export default function MerchantOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-pm-h2">Orders</h1>
          <p className="text-pm-body text-pm-text-secondary">Manage incoming orders</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
          <Input placeholder="Search by order ID or customer..." className="pl-10" />
        </div>
        <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
      </div>

      <div className="space-y-3">
        {MOCK_ORDERS.map((order) => (
          <Card key={order.id} className="p-4 hover:shadow-pm-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-pm-body font-semibold text-pm-text">#{order.id}</p>
                  <p className="text-pm-small text-pm-text-secondary">{order.customer}</p>
                </div>
                <div className="text-pm-tiny text-pm-text-secondary">
                  <p>{order.items} items</p>
                  <p>{order.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-pm-body font-bold text-pm-burgundy">{formatPrice(order.total)}</p>
                  <Badge variant="outline" className="text-pm-tiny" style={{ borderColor: getStatusColor(order.status), color: getStatusColor(order.status) }}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm"><ChevronRight className="w-5 h-5" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
