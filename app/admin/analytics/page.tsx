'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, BarChart3, Download, Store, Users, ShoppingBag, Info, ArrowUp } from 'lucide-react';

export default function AdminAnalytics() {
  return (
    <div className="section-container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-pm-h2 text-pm-text">Platform Analytics</h1>
          <p className="text-pm-body text-pm-text-secondary">Comprehensive platform metrics</p>
        </div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export Report</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Revenue', value: 124500, change: '+18%', isCurrency: true },
          { label: 'Total Orders', value: 156, change: '+12%' },
          { label: 'Active Users', value: 89, change: '+22%' },
          { label: 'Avg Order Value', value: 798, change: '+5%', isCurrency: true },
        ].map((metric) => (
          <Card key={metric.label} className="kpi-card">
            <p className="text-pm-small text-pm-text-secondary mb-2">{metric.label}</p>
            <p className="text-pm-h3 text-pm-text">{metric.isCurrency ? formatPrice(metric.value) : metric.value}</p>
            <div className="flex items-center gap-1 text-pm-tiny text-green-600 mt-1">
              <ArrowUp className="w-3 h-3" /><span>{metric.change}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-5">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-pm-gold" /> Revenue Over Time</h2>
          <div className="h-48 bg-pm-cream rounded-pm-lg flex items-center justify-center border border-pm-border">
            <BarChart3 className="w-10 h-10 text-pm-gold/50" />
            <span className="text-pm-small text-pm-text-secondary ml-2">Chart loading...</span>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4"><Store className="w-5 h-5 text-pm-gold" /> Revenue by Market</h2>
          <div className="space-y-3">
            {[
              { market: 'Chickpet', revenue: 58000, percentage: 47 },
              { market: 'Balepet', revenue: 32000, percentage: 26 },
              { market: 'Raja Market', revenue: 18500, percentage: 15 },
              { market: 'Mamulpet', revenue: 9500, percentage: 8 },
              { market: 'Cubbonpet', revenue: 6500, percentage: 5 },
            ].map((item) => (
              <div key={item.market}>
                <div className="flex justify-between text-pm-small mb-1">
                  <span>{item.market}</span>
                  <span className="font-medium">{formatPrice(item.revenue)}</span>
                </div>
                <div className="w-full bg-pm-cream rounded-full h-2">
                  <div className="bg-pm-gold h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Platform-wide analytics showing revenue trends, merchant performance, and market-wise distribution.</p>
        </div>
      </section>
    </div>
  );
}
