'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MERCHANTS } from '@/lib/data';
import { getInitials } from '@/lib/utils';
import { Search, Store, Star, Filter, Info, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function AdminMerchants() {
  const [search, setSearch] = useState('');

  const filtered = MERCHANTS.filter(m =>
    m.store_name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase()) ||
    m.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="section-container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-pm-h2 text-pm-text">All Merchants</h1>
          <p className="text-pm-body text-pm-text-secondary">{filtered.length} merchants on platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
          <Button variant="default" size="sm">+ Invite Merchant</Button>
        </div>
      </div>

      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
          <Input placeholder="Search merchants by name, category, or status..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((merchant) => (
          <Card key={merchant.id} className="p-5 hover:shadow-pm-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 rounded-pm-lg">
                  <AvatarFallback className="bg-pm-gold/10 text-pm-gold rounded-pm-lg">{getInitials(merchant.store_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-pm-body font-semibold">{merchant.store_name}</h3>
                  <p className="text-pm-tiny text-pm-text-secondary">{merchant.category}</p>
                </div>
              </div>
              <Badge variant={merchant.status === 'active' ? 'buy' : merchant.status === 'pending' ? 'outline' : 'destructive'} className="capitalize">
                {merchant.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-pm-tiny text-pm-text-secondary mb-3">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-pm-gold fill-pm-gold" />{merchant.rating}</span>
              <span>{merchant.distance} km</span>
              <span>Readiness: {merchant.digital_readiness}</span>
            </div>
            <p className="text-pm-tiny text-pm-text-secondary line-clamp-2">{merchant.description}</p>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Store className="w-12 h-12 text-pm-text-secondary/30 mx-auto mb-3" />
            <p className="text-pm-body text-pm-text-secondary">No merchants found</p>
          </div>
        )}
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">View and manage all merchants on the platform. Filter by status, category, or digital readiness.</p>
        </div>
      </section>
    </div>
  );
}
