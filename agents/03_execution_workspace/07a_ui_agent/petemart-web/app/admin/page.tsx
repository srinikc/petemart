'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import {
  Store, ShoppingCart, DollarSign, TrendingUp,
  Users, CheckSquare, ChevronRight, Info, BarChart3
} from 'lucide-react';

const KPI_CARDS = [
  { label: 'Total Merchants', value: '9', icon: Store, color: 'text-blue-400', bg: 'bg-blue-500/10', change: '+2 this week' },
  { label: 'Active', value: '7', icon: Users, color: 'text-green-400', bg: 'bg-green-500/10', change: '77% activation' },
  { label: 'Pending Approval', value: '2', icon: CheckSquare, color: 'text-orange-400', bg: 'bg-orange-500/10', change: 'Needs review' },
  { label: 'Revenue MTD', value: formatPrice(185000), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', change: '+12.5% vs last month' },
];

const PENDING_MERCHANTS = [
  { name: 'Madhumathi All-men\'s Ethnic', category: "Men's Ethnic Wear", date: '2026-05-28', documents: 3 },
  { name: 'Sri Vari Traders', category: 'Outdoor Equipment', date: '2026-05-27', documents: 2 },
];

const RECENT_ORDERS = [
  { id: 'PM-1024', customer: 'Priya S.', merchant: 'Samskruti Silks', total: 3200, status: 'in_transit' },
  { id: 'PM-1023', customer: 'Deepa P.', merchant: 'Samskruti Silks', total: 12500, status: 'pending' },
  { id: 'PM-1022', customer: 'Ravi K.', merchant: 'Pastry Cafe', total: 1800, status: 'delivered' },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-pm-h2 text-white">Admin Dashboard</h1>
          <p className="text-pm-body text-gray-400">Platform Overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
            <BarChart3 className="w-4 h-4 mr-1" /> Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => (
          <Card key={kpi.label} className="p-5 bg-gray-800 border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-pm-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-pm-small text-gray-400">{kpi.label}</p>
            <p className="text-pm-h2 text-white">{kpi.value}</p>
            <p className="text-pm-tiny text-gray-500 mt-1">{kpi.change}</p>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Merchant Approval Queue */}
        <Card className="p-5 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-pm-body font-semibold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-pm-gold" /> Merchant Approval Queue
            </h2>
            <Link href="/admin/merchants/approvals" className="text-pm-small text-pm-gold hover:text-pm-gold-dark flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {PENDING_MERCHANTS.map((merchant) => (
              <div key={merchant.name} className="flex items-center justify-between p-3 rounded-pm-md bg-gray-900 border border-gray-700">
                <div>
                  <p className="text-pm-small font-medium text-white">{merchant.name}</p>
                  <p className="text-pm-tiny text-gray-400">{merchant.category} • {merchant.documents} docs</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white">Approve</Button>
                  <Button variant="outline" size="sm" className="border-red-800 text-red-400 hover:bg-red-900/20">Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-5 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-pm-body font-semibold text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-pm-gold" /> Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-pm-small text-pm-gold hover:text-pm-gold-dark flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {RECENT_ORDERS.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-pm-md bg-gray-900 border border-gray-700">
                <div>
                  <p className="text-pm-small font-medium text-white">#{order.id}</p>
                  <p className="text-pm-tiny text-gray-400">{order.customer} • {order.merchant}</p>
                </div>
                <div className="text-right">
                  <p className="text-pm-small font-semibold text-white">{formatPrice(order.total)}</p>
                  <Badge variant="outline" className="text-pm-tiny text-gray-400 border-gray-600">
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue Chart Placeholder */}
      <Card className="p-5 bg-gray-800 border-gray-700">
        <h2 className="text-pm-body font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-pm-gold" /> Revenue Overview
        </h2>
        <div className="h-48 bg-gray-900 rounded-pm-md flex items-center justify-center border border-gray-700">
          <div className="text-center">
            <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-pm-small text-gray-500">Revenue chart loading...</p>
            <p className="text-pm-tiny text-gray-600">Daily / Weekly / Monthly toggle</p>
          </div>
        </div>
      </Card>

      {/* Help */}
      <section className="bg-gray-800 border border-gray-700 rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-gray-400">
            Manage merchants, monitor platform activity, and configure system settings from the admin panel.
          </p>
        </div>
      </section>
    </div>
  );
}
