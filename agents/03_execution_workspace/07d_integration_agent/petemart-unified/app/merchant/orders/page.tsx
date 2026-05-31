'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Search, Filter, Package, ChevronRight, Info } from 'lucide-react';
import Link from 'next/link';

const MERCHANT_ORDERS = [
  { id: 'order-1', order_id: 'PM-20260530-001', customer: 'Priya Sharma', items: 3, total: 4891, status: 'in_transit', created_at: '2026-05-30T10:30:00Z', phone: '9999999999' },
  { id: 'order-2', order_id: 'PM-20260529-002', customer: 'Ananya R.', items: 1, total: 8500, status: 'confirmed', created_at: '2026-05-29T14:00:00Z', phone: '8888888888' },
  { id: 'order-3', order_id: 'PM-20260528-003', customer: 'Vikram M.', items: 2, total: 1200, status: 'preparing', created_at: '2026-05-28T09:15:00Z', phone: '7777777777' },
];

export default function MerchantOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = MERCHANT_ORDERS.filter(o => {
    const matchesSearch = o.order_id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['all', 'pending', 'confirmed', 'preparing', 'in_transit'];

  return (
    <div className="section-container py-8">
      <h1 className="text-pm-h2 mb-6">Orders</h1>

      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
            <Input placeholder="Search by order ID or customer..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {statuses.map((s) => (
              <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
                {s === 'all' ? 'All' : getStatusLabel(s)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filtered.map((order) => (
          <Card key={order.id} className="p-5 hover:shadow-pm-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-pm-body font-semibold">{order.order_id}</p>
                <p className="text-pm-tiny text-pm-text-secondary">{order.customer} · {order.phone}</p>
              </div>
              <Badge variant="outline" className="capitalize" style={{ borderColor: getStatusColor(order.status), color: getStatusColor(order.status) }}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-pm-small text-pm-text-secondary">{order.items} items · {formatDate(order.created_at)}</p>
              <p className="text-pm-body font-bold">{formatPrice(order.total)}</p>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-pm-text-secondary/30 mx-auto mb-3" />
            <p className="text-pm-body text-pm-text-secondary">No orders found</p>
          </div>
        )}
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">View and manage incoming orders. Use filters to sort by status. Click on an order to update its status.</p>
        </div>
      </section>
    </div>
  );
}
