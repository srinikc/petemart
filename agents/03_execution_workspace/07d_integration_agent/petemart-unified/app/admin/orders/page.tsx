'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Search, Filter, Package, Info } from 'lucide-react';

const ALL_ORDERS = [
  { id: 'order-1', order_id: 'PM-20260530-001', customer: 'Priya Sharma', merchant: 'Samskruti Silks', items: 3, total: 4891, status: 'in_transit', created_at: '2026-05-30T10:30:00Z' },
  { id: 'order-2', order_id: 'PM-20260529-002', customer: 'Priya Sharma', merchant: 'flowers2u', items: 4, total: 3500, status: 'delivered', created_at: '2026-05-29T14:00:00Z' },
  { id: 'order-3', order_id: 'PM-20260528-003', customer: 'Ananya R.', merchant: 'Samskruti Silks', items: 1, total: 8500, status: 'confirmed', created_at: '2026-05-28T09:15:00Z' },
  { id: 'order-4', order_id: 'PM-20260527-004', customer: 'Vikram M.', merchant: 'The Pastry Cafe', items: 2, total: 1200, status: 'preparing', created_at: '2026-05-27T16:00:00Z' },
];

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = ALL_ORDERS.filter(o => {
    const matchesSearch = o.order_id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase()) || o.merchant.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['all', 'pending', 'confirmed', 'preparing', 'in_transit', 'delivered', 'cancelled'];

  return (
    <div className="section-container py-8">
      <h1 className="text-pm-h2 mb-6">Platform Orders</h1>

      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
            <Input placeholder="Search orders..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
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

      <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-pm-cream text-pm-small text-pm-text-secondary">
                <th className="text-left px-4 py-3 font-medium">Order ID</th>
                <th className="text-left px-4 py-3 font-medium">Customer</th>
                <th className="text-left px-4 py-3 font-medium">Merchant</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-t border-pm-border hover:bg-pm-cream/50 transition-colors">
                  <td className="px-4 py-3 text-pm-small font-medium">{order.order_id}</td>
                  <td className="px-4 py-3 text-pm-small">{order.customer}</td>
                  <td className="px-4 py-3 text-pm-small">{order.merchant}</td>
                  <td className="px-4 py-3 text-pm-small font-medium text-right">{formatPrice(order.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="capitalize text-pm-tiny" style={{ borderColor: getStatusColor(order.status), color: getStatusColor(order.status) }}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-pm-small text-pm-text-secondary text-right">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          <p className="text-pm-small text-pm-text-secondary">Monitor all orders across the platform. Filter by status, search by customer or merchant, and track order fulfillment.</p>
        </div>
      </section>
    </div>
  );
}
