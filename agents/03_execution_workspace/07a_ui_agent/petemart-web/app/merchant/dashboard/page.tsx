'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, getStatusColor } from '@/lib/utils';
import {
  TrendingUp, ShoppingCart, Package, MessageCircle,
  DollarSign, Plus, Clock, ChevronRight, Info,
  BarChart3, Printer, QrCode
} from 'lucide-react';

const KPI_CARDS = [
  { label: "Today's Orders", value: '12', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Revenue Today', value: formatPrice(34500), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Pending', value: '3', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Enquiries', value: '8', icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

const RECENT_ORDERS = [
  { id: 'PM-1024', customer: 'Priya S.', items: 3, total: 3200, status: 'packing', time: '10 mins ago' },
  { id: 'PM-1023', customer: 'Deepa P.', items: 1, total: 12500, status: 'pending', time: '25 mins ago' },
  { id: 'PM-1022', customer: 'Ravi K.', items: 2, total: 1800, status: 'delivered', time: '1 hour ago' },
  { id: 'PM-1021', customer: 'Ananya M.', items: 4, total: 5600, status: 'confirmed', time: '2 hours ago' },
  { id: 'PM-1020', customer: 'Suresh B.', items: 2, total: 4200, status: 'packing', time: '3 hours ago' },
];

export default function MerchantDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-pm-h2">Merchant Dashboard</h1>
          <p className="text-pm-body text-pm-text-secondary">Welcome back! Here&apos;s your store overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/merchant/products/new">
            <Button variant="default" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Product
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-1" /> Print QR
          </Button>
        </div>
      </div>

      {/* New Order Alert */}
      <div className="bg-pm-gold/10 border border-pm-gold/20 rounded-pm-lg p-4 flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-pm-gold animate-pulse-dot" />
          <p className="text-pm-body font-medium text-pm-text">New Order Alert!</p>
          <p className="text-pm-small text-pm-text-secondary">Order #PM-1024 just placed — Packing required</p>
        </div>
        <Button variant="default" size="sm">View Order</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-pm-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-pm-success" />
            </div>
            <p className="kpi-label">{kpi.label}</p>
            <p className="kpi-value">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Revenue Chart Placeholder */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-pm-body font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-pm-gold" /> Revenue Trend (Last 7 Days)
          </h2>
          <Badge variant="outline" className="text-pm-tiny">Last 30 days</Badge>
        </div>
        <div className="h-48 bg-gradient-to-r from-pm-gold/5 via-pm-gold/10 to-pm-gold/5 rounded-pm-md flex items-center justify-center border border-pm-border">
          <div className="text-center">
            <BarChart3 className="w-10 h-10 text-pm-gold/40 mx-auto mb-2" />
            <p className="text-pm-small text-pm-text-secondary">Revenue chart loading...</p>
          </div>
        </div>
        <div className="flex justify-between mt-3 text-pm-tiny text-pm-text-secondary">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </Card>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-pm-body font-semibold">Recent Orders</h2>
          <Link href="/merchant/orders" className="text-pm-small text-pm-gold hover:text-pm-gold-dark font-medium flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-2">
          {RECENT_ORDERS.map((order) => (
            <Card key={order.id} className="p-4 hover:shadow-pm-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-pm-body font-medium text-pm-text">#{order.id}</p>
                    <p className="text-pm-tiny text-pm-text-secondary">{order.customer}</p>
                  </div>
                  <div className="text-pm-tiny text-pm-text-secondary">
                    <p>{order.items} items</p>
                    <p>{order.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-pm-body font-semibold">{formatPrice(order.total)}</p>
                  <Badge
                    variant="outline"
                    className="text-pm-tiny mt-1"
                    style={{ borderColor: getStatusColor(order.status), color: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add Product', icon: Plus, href: '/merchant/products/new', color: 'text-pm-gold' },
          { label: 'Print QR Code', icon: QrCode, href: '/merchant/qr', color: 'text-pm-burgundy' },
          { label: 'Analytics', icon: BarChart3, href: '/merchant/analytics', color: 'text-blue-600' },
          { label: 'Settings', icon: Package, href: '/merchant/settings', color: 'text-green-600' },
        ].map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="p-4 text-center hover:shadow-pm-md transition-all cursor-pointer group">
              <div className={`w-10 h-10 mx-auto mb-2 rounded-pm-lg bg-pm-cream flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5" />
              </div>
              <p className="text-pm-tiny text-pm-text-secondary">{action.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Help Banner */}
      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">
            Manage your store, view orders, and track performance from your merchant dashboard.
          </p>
        </div>
      </section>
    </div>
  );
}
