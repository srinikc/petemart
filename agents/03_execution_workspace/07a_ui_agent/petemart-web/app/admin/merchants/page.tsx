'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MERCHANTS } from '@/lib/data';
import { Search, Info, ChevronRight, MoreHorizontal } from 'lucide-react';

export default function AdminAllMerchantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-pm-h2 text-white">All Merchants</h1>
        <p className="text-pm-body text-gray-400">{MERCHANTS.length} merchants registered</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input placeholder="Search merchants..." className="pl-10 bg-gray-800 border-gray-700 text-white" />
      </div>

      <Card className="overflow-hidden bg-gray-800 border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Store Name</th>
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Market</th>
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Category</th>
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Rating</th>
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Status</th>
                <th className="text-left p-4 text-pm-tiny text-gray-400 font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MERCHANTS.map((merchant) => (
                <tr key={merchant.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                  <td className="p-4">
                    <p className="text-pm-small font-medium text-white">{merchant.store_name}</p>
                  </td>
                  <td className="p-4 text-pm-small text-gray-400">
                    {merchant.market_id === 'market-1' ? 'Chickpet' : merchant.market_id === 'market-2' ? 'Balepet' : 'Other'}
                  </td>
                  <td className="p-4 text-pm-small text-gray-400">{merchant.category}</td>
                  <td className="p-4 text-pm-small text-pm-gold">{merchant.rating}★</td>
                  <td className="p-4">
                    <Badge variant={merchant.status === 'active' ? 'success' : merchant.status === 'pending' ? 'warning' : 'destructive'} className="text-pm-tiny">
                      {merchant.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" size="sm" className="text-gray-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
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
            View and manage all registered merchants. Click on a merchant to view details or change status.
          </p>
        </div>
      </section>
    </div>
  );
}
