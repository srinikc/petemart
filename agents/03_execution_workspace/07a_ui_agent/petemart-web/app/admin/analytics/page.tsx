'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import {
  BarChart3, TrendingUp, DollarSign, ShoppingCart,
  Users, Store, Download, Info
} from 'lucide-react';

const METRICS = [
  { label: 'Total Revenue (MTD)', value: formatPrice(185000), change: '+12.5%', icon: DollarSign, up: true },
  { label: 'Total Orders', value: '342', change: '+8.3%', icon: ShoppingCart, up: true },
  { label: 'Active Customers', value: '156', change: '+23.1%', icon: Users, up: true },
  { label: 'Merchant Payouts', value: formatPrice(142000), change: '-', icon: Store, up: true },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-pm-h2 text-white">Platform Analytics</h1>
          <p className="text-pm-body text-gray-400">Full platform performance metrics</p>
        </div>
        <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
          <Download className="w-4 h-4 mr-1" /> Export Report
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric) => (
          <Card key={metric.label} className="p-5 bg-gray-800 border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-pm-lg bg-blue-500/10 flex items-center justify-center">
                <metric.icon className="w-5 h-5 text-blue-400" />
              </div>
              <div className={`flex items-center gap-1 text-pm-tiny ${metric.up ? 'text-green-400' : 'text-red-400'}`}>
                {metric.up && <TrendingUp className="w-3 h-3" />}
                {metric.change}
              </div>
            </div>
            <p className="text-pm-small text-gray-400">{metric.label}</p>
            <p className="text-pm-h2 text-white">{metric.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 bg-gray-800 border-gray-700">
          <h2 className="text-pm-body font-semibold text-white mb-4">Revenue Over Time</h2>
          <div className="h-48 bg-gray-900 rounded-pm-md flex items-center justify-center border border-gray-700">
            <BarChart3 className="w-10 h-10 text-gray-600" />
          </div>
          <div className="flex gap-2 mt-3">
            {['Daily', 'Weekly', 'Monthly'].map((period) => (
              <Badge key={period} variant={period === 'Monthly' ? 'default' : 'outline'} className="cursor-pointer">
                {period}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-gray-800 border-gray-700">
          <h2 className="text-pm-body font-semibold text-white mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {[
              { status: 'Delivered', count: 245, pct: 72 },
              { status: 'In Transit', count: 52, pct: 15 },
              { status: 'Pending', count: 28, pct: 8 },
              { status: 'Cancelled', count: 17, pct: 5 },
            ].map((item) => (
              <div key={item.status}>
                <div className="flex justify-between text-pm-small mb-1">
                  <span className="text-gray-300">{item.status}</span>
                  <span className="text-gray-400">{item.count} ({item.pct}%)</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pm-gold rounded-full"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <section className="bg-gray-800 border border-gray-700 rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-gray-400">
            View comprehensive platform analytics including revenue, orders, customer growth, and merchant payouts.
          </p>
        </div>
      </section>
    </div>
  );
}
