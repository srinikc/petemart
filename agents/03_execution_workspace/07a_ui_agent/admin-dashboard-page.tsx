'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Store, Users, ShoppingBag, TrendingUp, ArrowUp, AlertCircle, CheckCircle, Info, ChevronRight } from 'lucide-react';

const ADMIN_KPIS = [
  { label: 'Total Merchants', value: 8, change: '+2', icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Active Stores', value: 6, change: '+1', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Pending Approvals', value: 2, change: '-', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Revenue (Month)', value: 124500, change: '+18%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', isCurrency: true },
];

const PENDING_MERCHANTS = [
  { id: 'merchant-8', name: "Madhumathi All-men's Ethnic", category: "Men's Ethnic Wear", date: '2026-05-28', documents: 3 },
  { id: 'merchant-9', name: 'Sri Vari Traders', category: 'Outdoor Equipment', date: '2026-05-27', documents: 2 },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, role, loading } = useAuth();

  // Redirect if not authenticated or not admin
  React.useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth');
      } else if (role !== 'admin') {
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
          <h1 className="text-pm-h2 text-pm-text">Admin Dashboard</h1>
          <p className="text-pm-body text-pm-text-secondary">Welcome, {user?.name || 'Admin'} · Platform overview and management</p>
        </div>
        <Link href="/admin/merchants/approvals">
          <Button variant="default" size="sm">Review Approvals <ChevronRight className="ml-1 w-4 h-4" /></Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {ADMIN_KPIS.map((kpi) => (
          <Card key={kpi.label} className="kpi-card">
            <div className="flex items-start justify-between mb-3">
              <span className="text-pm-small text-pm-text-secondary">{kpi.label}</span>
              <div className={`w-10 h-10 rounded-pm-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-pm-h3 text-pm-text">{kpi.isCurrency ? formatPrice(kpi.value) : kpi.value}</p>
            <div className="flex items-center gap-1 text-pm-tiny text-green-600 mt-1">
              <ArrowUp className="w-3 h-3" /><span>{kpi.change} from last month</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Merchant Approval Queue */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-pm-body font-semibold flex items-center gap-2"><AlertCircle className="w-5 h-5 text-pm-gold" /> Pending Approvals</h2>
            <Link href="/admin/merchants/approvals" className="text-pm-tiny text-pm-gold">View All</Link>
          </div>
          <div className="space-y-3">
            {PENDING_MERCHANTS.map((merchant) => (
              <div key={merchant.id} className="flex items-center justify-between p-3 rounded-pm-md border border-pm-border hover:bg-pm-cream/50 transition-colors">
                <div>
                  <p className="text-pm-small font-medium">{merchant.name}</p>
                  <p className="text-pm-tiny text-pm-text-secondary">{merchant.category} · {merchant.documents} documents</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Approve</Button>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-5">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4"><ShoppingBag className="w-5 h-5 text-pm-gold" /> Recent Platform Orders</h2>
          <div className="h-48 bg-pm-cream rounded-pm-lg flex items-center justify-center border border-pm-border">
            <TrendingUp className="w-10 h-10 text-pm-gold/50" />
            <span className="text-pm-small text-pm-text-secondary ml-2">Revenue chart loading...</span>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/merchants"><Button variant="outline" className="h-20 flex-col"><Store className="w-6 h-6 mb-1" /> All Merchants</Button></Link>
        <Link href="/admin/merchants/approvals"><Button variant="outline" className="h-20 flex-col"><CheckCircle className="w-6 h-6 mb-1" /> Approvals</Button></Link>
        <Link href="/admin/analytics"><Button variant="outline" className="h-20 flex-col"><TrendingUp className="w-6 h-6 mb-1" /> Analytics</Button></Link>
        <Link href="/admin/config"><Button variant="outline" className="h-20 flex-col"><Info className="w-6 h-6 mb-1" /> Config</Button></Link>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Admin dashboard provides platform-wide oversight. Monitor merchant onboarding, approve new stores, track revenue, and configure platform settings.</p>
        </div>
      </section>
    </div>
  );
}
