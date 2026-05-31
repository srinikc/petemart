'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Package, TrendingUp, Clock, MessageCircle, ArrowUp, ArrowDown, Plus, BarChart3, ShoppingBag, Info } from 'lucide-react';

const KPI_DATA = [
  { label: 'Total Orders', value: 48, change: '+12%', icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'up' },
  { label: 'Revenue (Month)', value: 48500, change: '+8%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', trend: 'up', isCurrency: true },
  { label: 'Pending Orders', value: 3, change: '-2', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'down' },
  { label: 'WhatsApp Enquiries', value: 12, change: '+5', icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50', trend: 'up' },
];

const RECENT_ORDERS = [
  { id: '#PM-001', customer: 'Priya S.', items: 3, total: 4891, status: 'in_transit', time: '2 hours ago' },
  { id: '#PM-002', customer: 'Ananya R.', items: 1, total: 8500, status: 'confirmed', time: '3 hours ago' },
  { id: '#PM-003', customer: 'Vikram M.', items: 2, total: 1200, status: 'preparing', time: '4 hours ago' },
];

export default function MerchantDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, role, loading } = useAuth();

  // Redirect if not authenticated or not a merchant
  React.useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth');
      } else if (role !== 'merchant' && role !== 'admin') {
        router.push('/');
      }
    }
  }, [loading, isAuthenticated, role, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="section-container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-pm-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-pm-body text-pm-text-secondary">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-pm-h2 text-pm-text">Merchant Dashboard</h1>
          <p className="text-pm-body text-pm-text-secondary">Welcome back, {user?.name || 'Merchant'}</p>
        </div>
        <Link href="/merchant/products/new">
          <Button variant="default"><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
        </Link>
      </div>

      {/* New Order Alert */}
      <div className="bg-orange-50 border border-orange-200 rounded-pm-lg p-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-orange-600" />
          <div>
            <p className="text-pm-small font-medium text-orange-800">3 new orders require attention</p>
            <p className="text-pm-tiny text-orange-600">Confirm or start preparing these orders</p>
          </div>
        </div>
        <Link href="/merchant/orders"><Button variant="default" size="sm" className="bg-orange-600 hover:bg-orange-700">View Orders</Button></Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {KPI_DATA.map((kpi) => (
          <Card key={kpi.label} className="kpi-card">
            <div className="flex items-start justify-between mb-3">
              <span className="text-pm-small text-pm-text-secondary">{kpi.label}</span>
              <div className={`w-10 h-10 rounded-pm-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-pm-h3 text-pm-text">{kpi.isCurrency ? formatPrice(kpi.value) : kpi.value}</p>
            <div className={`flex items-center gap-1 text-pm-tiny mt-1 ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {kpi.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              <span>{kpi.change} from last month</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts and Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend Chart Placeholder */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-pm-body font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-pm-gold" /> Revenue Trend</h2>
            <select className="text-pm-tiny border border-pm-border rounded-pm-md px-2 py-1">
              <option>Last 7 days</option><option>Last 30 days</option><option>Last 3 months</option>
            </select>
          </div>
          <div className="h-48 bg-pm-cream rounded-pm-lg flex items-center justify-center border border-pm-border">
            <BarChart3 className="w-10 h-10 text-pm-gold/50" />
            <span className="text-pm-small text-pm-text-secondary ml-2">Chart loading...</span>
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-pm-body font-semibold flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-pm-gold" /> Recent Orders</h2>
            <Link href="/merchant/orders" className="text-pm-tiny text-pm-gold">View All</Link>
          </div>
          <div className="space-y-3">
            {RECENT_ORDERS.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-pm-border last:border-0">
                <div>
                  <p className="text-pm-small font-medium">{order.id}</p>
                  <p className="text-pm-tiny text-pm-text-secondary">{order.customer} · {order.items} items</p>
                </div>
                <div className="text-right">
                  <p className="text-pm-small font-semibold">{formatPrice(order.total)}</p>
                  <Badge variant="outline" className="text-pm-tiny capitalize">{order.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Link href="/merchant/products"><Button variant="outline" className="h-20 flex-col"><Package className="w-6 h-6 mb-1" /> Manage Products</Button></Link>
        <Link href="/merchant/orders"><Button variant="outline" className="h-20 flex-col"><ShoppingBag className="w-6 h-6 mb-1" /> View Orders</Button></Link>
        <Link href="/merchant/analytics"><Button variant="outline" className="h-20 flex-col"><BarChart3 className="w-6 h-6 mb-1" /> Analytics</Button></Link>
        <Link href="/merchant/qr"><Button variant="outline" className="h-20 flex-col"><MessageCircle className="w-6 h-6 mb-1" /> QR Code</Button></Link>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Monitor your store performance, manage products, and fulfill orders. Use the quick action buttons to navigate to key sections.</p>
        </div>
      </section>
    </div>
  );
}
