'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice, getStatusColor } from '@/lib/utils';
import { Search, Info, Eye } from 'lucide-react';

const ALL_ORDERS = [
  { id: 'PM-1024', customer: 'Priya S.', merchant: 'Samskruti Silks', total: 3200, status: 'in_transit', date: '2026-05-30' },
  { id: 'PM-1023', customer: 'Deepa P.', merchant: 'Samskruti Silks', total: 12500, status: 'confirmed', date: '2026-05-30' },
  { id: 'PM-1022', customer: 'Ravi K.', merchant: 'Pastry Cafe', total: 1800, status: 'delivered', date: '2026-05-29' },
  { id: 'PM-1021', customer: 'Ananya M.', merchant: 'flowers2u', total: 5600, status: 'delivered', date: '2026-05-28' },
  { id: 'PM-1020', customer: 'Suresh B.', merchant: 'Samskruti Silks', total: 4200, status: 'cancelled', date: '2026-05-28' },
  { id: 'PM-1019', customer: 'Lakshmi K.', merchant: 'Tarun Enterprises', total: 8900, status: 'packing', date: '2026-05-27' },
  { id: 'PM-1018', customer: 'Rajesh M.', merchant: 'Pastry Cafe', total: 1500, status: 'delivered', date: '2026-05-27' },
];

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-pm-h2 text-white">All Orders</h1>
        <p className="text-pm-body text-gray-400">Monitor all platform orders</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input placeholder="Search orders..." className="pl-10 bg-gray-800 border-gray-700 text-white" />
      </div>

      <Card className="overflow-hidden bg-gray-800 border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Order ID</th>
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Customer</th>
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Merchant</th>
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Total</th>
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Status</th>
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Date</th>
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ALL_ORDERS.map((order) => (
                <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                  <td className="p-4 text-pm-small font-medium text-white">#{order.id}</td>
                  <td className="p-4 text-pm-small text-gray-400">{order.customer}</td>
                  <td className="p-4 text-pm-small text-gray-400">{order.merchant}</td>
                  <td className="p-4 text-pm-small font-semibold text-white">{formatPrice(order.total)}</td>
                  <td className="p-4">
                    <Badge variant="outline" className="text-pm-tiny" style={{ borderColor: getStatusColor(order.status), color: getStatusColor(order.status) }}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="p-4 text-pm-small text-gray-400">{order.date}</td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" className="text-gray-400"><Eye className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="bg-gray-800 border border-gray-700 rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-gray-400">
            Monitor all platform orders, view details, and manage order statuses across merchants.
          </p>
        </div>
      </section>
    </div>
  );
}
