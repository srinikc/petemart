'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MARKETS, getMerchantsByMarket } from '@/lib/data';
import { getModeLabel, getInitials } from '@/lib/utils';
import { Store, Star, Search, SlidersHorizontal, MapPin, Info, ArrowLeft, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function MarketExplorerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const market = MARKETS.find(m => m.slug === slug);
  const merchants = market ? getMerchantsByMarket(market.slug) : [];
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMerchants = merchants.filter(m =>
    m.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!market) {
    return (
      <div className="section-container py-20 text-center">
        <h1 className="text-pm-h2 mb-4">Market Not Found</h1>
        <p className="text-pm-body text-pm-text-secondary mb-6">The market you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/"><Button variant="default">Back to Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <section className="bg-gradient-to-r from-pm-burgundy to-pm-burgundy/80 text-white py-12">
        <div className="section-container">
          <Link href="/" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-pm-small mb-4 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Home</Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <Badge variant="secondary" className="mb-3">{market.merchant_count} merchants</Badge>
              <h1 className="text-pm-h1 text-white mb-2">{market.name}</h1>
              <p className="text-lg text-white/80">{market.description}</p>
              <p className="text-pm-small text-white/60 mt-2 max-w-2xl">{market.historical_summary}</p>
            </div>
            <Badge variant="default" className="bg-pm-gold text-white shrink-0 self-start">{market.specialization}</Badge>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-pm-border sticky top-16 md:top-20 z-30">
        <div className="section-container py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
              <Input placeholder="Search merchants..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">Relevance <ChevronDown className="w-3 h-3" /></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-pm-body text-pm-text-secondary"><strong className="text-pm-text">{filteredMerchants.length}</strong> merchants found in {market.name}</p>
        </div>

        {filteredMerchants.length === 0 ? (
          <div className="text-center py-16">
            <Store className="w-16 h-16 text-pm-text-secondary/30 mx-auto mb-4" />
            <h3 className="text-pm-h3 text-pm-text mb-2">No merchants found</h3>
            <p className="text-pm-body text-pm-text-secondary">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMerchants.map((merchant) => (
              <Link key={merchant.id} href={`/shop/${merchant.slug}`}>
                <Card className="product-card group h-full hover:shadow-pm-lg transition-all duration-300">
                  <div className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-14 h-14 rounded-pm-lg">
                        <AvatarFallback className="bg-pm-gold/10 text-pm-gold text-lg rounded-pm-lg">{getInitials(merchant.store_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-pm-body font-semibold text-pm-text group-hover:text-pm-gold transition-colors">{merchant.store_name}</h3>
                        <div className="flex items-center gap-2 text-pm-tiny text-pm-text-secondary mt-1">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-pm-gold fill-pm-gold" />{merchant.rating}</span>
                          <span>{merchant.distance} km</span>
                        </div>
                        <Badge variant="outline" className="mt-2 text-pm-tiny">{merchant.category}</Badge>
                      </div>
                    </div>
                    <p className="text-pm-small text-pm-text-secondary line-clamp-2 mb-4">{merchant.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {merchant.modes_enabled.map((mode) => {
                        const modeInfo = getModeLabel(mode);
                        return <Badge key={mode} variant={mode === 'A' ? 'buy' : mode === 'B' ? 'whatsapp' : 'visit'} className="text-pm-tiny">{modeInfo.label}</Badge>;
                      })}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-pm-cream border-t border-pm-border py-6">
        <div className="section-container">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-pm-gold shrink-0" />
            <p className="text-pm-small text-pm-text-secondary">Browse merchants in this market. Use filters to narrow down by category, price, or shopping mode. Each store shows available shopping modes.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
