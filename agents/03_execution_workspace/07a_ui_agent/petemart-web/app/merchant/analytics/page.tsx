'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, BarChart3, ShoppingCart,
  Eye, MessageCircle, DollarSign, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const METRICS = [
  { label: 'Total Sales', value: formatPrice(284500), change: '+12.5%', icon: DollarSign, up: true },
  { label: 'Total Orders', value: '156', change: '+8.3%', icon: ShoppingCart, up: true },
  { label: 'Page Views', value: '8,432', change: '+23.1%', icon: Eye, up: true },
  { label: 'WhatsApp Enquiries', value: '45', change: '-2.1%', icon: MessageCircle, up: false },
];

const TOP_PRODUCTS = [
  { name: 'Kanjivaram Silk Saree - Gold Zari', sales: 23, revenue: 575000, trend: '+15%' },
  { name: 'Mysore Silk Saree - Cream', sales: 18, revenue: 153000, trend: '+8%' },
  { name: 'Handloom Silk Dupatta', sales: 15, revenue: 36000, trend: '+22%' },
  { name: 'Cotton Silk Blend - Printed', sales: 12, revenue: 38400, trend: '+5%' },
];

export default function MerchantAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-pm-h2">Analytics</h1>
          <p className="text-pm-body text-pm-text-secondary">Track your store performance</p>
        </div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export</Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric) => (
          <Card key={metric.label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-pm-lg bg-pm-cream flex items-center justify-center">
                <metric.icon className="w-5 h-5 text-pm-gold" />
              </div>
              <div className={`flex items-center gap-1 text-pm-tiny ${metric.up ? 'text-pm-success' : 'text-pm-error'}`}>
                {metric.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {metric.change}
              </div>
            </div>
            <p className="kpi-label">{metric.label}</p>
            <p className="kpi-value">{metric.value}</p>
          </Card>
        ))}
      </div>

      {/* Sales Chart */}
      <Card className="p-5">
        <h2 className="text-pm-body font-semibold mb-4">Sales Trend (Last 30 Days)</h2>
        <div className="h-48 bg-gradient-to-r from-pm-gold/5 via-pm-gold/10 to-pm-gold/5 rounded-pm-md flex items-center justify-center border border-pm-border">
          <BarChart3 className="w-10 h-10 text-pm-gold/40" />
        </div>
      </Card>

      {/* Top Products */}
      <Card className="p-5">
        <h2 className="text-pm-body font-semibold mb-4">Top Selling Products</h2>
        <div className="space-y-3">
          {TOP_PRODUCTS.map((product, i) => (
            <div key={product.name} className="flex items-center justify-between p-3 bg-pm-cream rounded-pm-md">
              <div className="flex items-center gap-3">
                <span className="text-pm-body font-bold text-pm-gold w-6">#{i + 1}</span>
                <div>
                  <p className="text-pm-small font-medium text-pm-text">{product.name}</p>
                  <p className="text-pm-tiny text-pm-text-secondary">{product.sales} units sold</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-pm-small font-semibold">{formatPrice(product.revenue)}</p>
                <Badge variant="success" className="text-pm-tiny">{product.trend}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
