'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, BarChart3, Download, Package, Star, Info, ArrowUp, ShoppingBag } from 'lucide-react';

const METRICS = [
  { label: 'Total Sales (Month)', value: 48500, change: '+12%', isCurrency: true },
  { label: 'Orders (Month)', value: 48, change: '+8%' },
  { label: 'Avg. Order Value', value: 1010, change: '+5%', isCurrency: true },
  { label: 'Conversion Rate', value: 3.2, change: '+0.5%', suffix: '%' },
];

const TOP_PRODUCTS = [
  { name: 'Kanjivaram Silk Saree', sold: 12, revenue: 390000 },
  { name: 'Mysore Silk Saree', sold: 8, revenue: 68000 },
  { name: 'Cotton Silk Blend', sold: 15, revenue: 48000 },
];

export default function MerchantAnalytics() {
  return (
    <div className="section-container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-pm-h2 text-pm-text">Analytics</h1>
          <p className="text-pm-body text-pm-text-secondary">Your store performance at a glance</p>
        </div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export Report</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {METRICS.map((metric) => (
          <Card key={metric.label} className="kpi-card">
            <p className="text-pm-small text-pm-text-secondary mb-2">{metric.label}</p>
            <p className="text-pm-h3 text-pm-text">
              {metric.isCurrency ? formatPrice(metric.value) : metric.value}{metric.suffix || ''}
            </p>
            <div className="flex items-center gap-1 text-pm-tiny text-green-600 mt-1">
              <ArrowUp className="w-3 h-3" /><span>{metric.change}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-5">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-pm-gold" /> Sales Trend</h2>
          <div className="h-48 bg-pm-cream rounded-pm-lg flex items-center justify-center border border-pm-border">
            <BarChart3 className="w-10 h-10 text-pm-gold/50" />
            <span className="text-pm-small text-pm-text-secondary ml-2">Chart loading...</span>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4"><ShoppingBag className="w-5 h-5 text-pm-gold" /> Top Selling Products</h2>
          <div className="space-y-3">
            {TOP_PRODUCTS.map((product, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-pm-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-pm-gold/10 text-pm-gold text-pm-tiny flex items-center justify-center font-medium">{i + 1}</span>
                  <div>
                    <p className="text-pm-small font-medium">{product.name}</p>
                    <p className="text-pm-tiny text-pm-text-secondary">{product.sold} sold</p>
                  </div>
                </div>
                <p className="text-pm-small font-semibold">{formatPrice(product.revenue)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Track your store performance with key metrics and sales trends. Export reports for offline analysis.</p>
        </div>
      </section>
    </div>
  );
}
