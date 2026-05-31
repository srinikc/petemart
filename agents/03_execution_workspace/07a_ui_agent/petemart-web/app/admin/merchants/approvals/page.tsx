'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, Info, Store } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

const PENDING_MERCHANTS = [
  { id: 'merchant-8', name: "Madhumathi All-men's Ethnic", phone: '+91-9876543210', category: "Men's Ethnic Wear", market: 'Balepet', docs: 3, registered: '2026-05-28' },
  { id: 'merchant-9', name: 'Sri Vari Traders', phone: '+91-8765432109', category: 'Outdoor Equipment', market: 'Balepet', docs: 2, registered: '2026-05-27' },
  { id: 'merchant-10', name: 'Kuberan Silks', phone: '+91-7654321098', category: 'Silk Sarees', market: 'Chickpet', docs: 4, registered: '2026-05-26' },
];

export default function AdminApprovalsPage() {
  const handleApprove = (name: string) => {
    toast.success(`${name} approved successfully!`);
  };
  const handleReject = (name: string) => {
    toast.error(`${name} has been rejected.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-pm-h2 text-white">Merchant Approval Queue</h1>
        <p className="text-pm-body text-gray-400">{PENDING_MERCHANTS.length} merchants pending review</p>
      </div>

      <div className="space-y-4">
        {PENDING_MERCHANTS.map((merchant) => (
          <Card key={merchant.id} className="p-5 bg-gray-800 border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 rounded-pm-lg">
                  <AvatarFallback className="bg-pm-gold/10 text-pm-gold text-lg rounded-pm-lg">
                    {getInitials(merchant.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-pm-body font-semibold text-white">{merchant.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-pm-tiny text-gray-400 border-gray-600">{merchant.category}</Badge>
                    <Badge variant="outline" className="text-pm-tiny text-gray-400 border-gray-600">{merchant.market}</Badge>
                    <span className="text-pm-tiny text-gray-500">{merchant.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="default" className="text-pm-tiny bg-pm-gold text-white">{merchant.docs} documents</Badge>
                    <span className="text-pm-tiny text-gray-500">Registered: {merchant.registered}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" className="text-gray-400"><Eye className="w-4 h-4" /></Button>
                <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(merchant.name)}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button variant="outline" size="sm" className="border-red-800 text-red-400 hover:bg-red-900/20" onClick={() => handleReject(merchant.name)}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <section className="bg-gray-800 border border-gray-700 rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-gray-400">
            Review and approve merchant applications. Check documents and verify details before approving.
          </p>
        </div>
      </section>
    </div>
  );
}
