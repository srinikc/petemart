'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMerchantBySlug, getProductsByMerchant } from '@/lib/data';
import { getModeLabel, formatPrice, getInitials } from '@/lib/utils';
import {
  ArrowLeft, Star, MapPin, Clock, Share2, MessageCircle,
  Store, ChevronRight, Info, ShoppingCart, Phone
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function MerchantMicrositePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const merchant = getMerchantBySlug(slug);
  const products = merchant ? getProductsByMerchant(merchant.id) : [];
  const [activeTab, setActiveTab] = useState('products');
  const router = useRouter();

  if (!merchant) {
    return (
      <div className="section-container py-20 text-center">
        <h1 className="text-pm-h2 mb-4">Store Not Found</h1>
        <p className="text-pm-body text-pm-text-secondary mb-6">This merchant store doesn&apos;t exist.</p>
        <Link href="/"><Button variant="default">Back to Home</Button></Link>
      </div>
    );
  }

  const handleModeAction = (mode: string, productName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    switch (mode) {
      case 'A':
        toast.success(`${productName} added to cart!`);
        break;
      case 'B':
        window.open(`https://wa.me/919999999999?text=Hi%20${encodeURIComponent(merchant.store_name)}%2C%20I'm%20interested%20in%20${encodeURIComponent(productName)}`, '_blank');
        break;
      case 'C':
        window.open(`https://maps.google.com/?q=${encodeURIComponent(merchant.store_name + ' ' + merchant.slug)}`, '_blank');
        break;
    }
  };

  return (
    <div className="space-y-0">
      {/* Store Header */}
      <section className="bg-gradient-to-r from-pm-burgundy to-pm-burgundy/80 text-white">
        <div className="section-container py-8">
          <Link href={`/markets/${merchant.market_id === 'market-1' ? 'chickpet' : 'balepet'}`} className="inline-flex items-center gap-1 text-white/70 hover:text-white text-pm-small mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Market
          </Link>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="w-20 h-20 rounded-pm-xl border-4 border-white/20">
              <AvatarFallback className="bg-pm-gold text-white text-2xl rounded-pm-xl">
                {getInitials(merchant.store_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-pm-h1 text-white mb-2">{merchant.store_name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-pm-small text-white/80 mb-3">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-pm-gold fill-pm-gold" /> {merchant.rating}★</span>
                <span>18 years in business</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {merchant.distance} km</span>
              </div>
              <p className="text-pm-body text-white/70 max-w-2xl">{merchant.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <section className="bg-white border-b border-pm-border">
        <div className="section-container py-3">
          <div className="flex flex-wrap items-center gap-4 text-pm-tiny text-pm-text-secondary">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Mon-Sat: 10:00 AM - 8:00 PM</span>
            <Badge variant="default" className="text-pm-tiny">{merchant.category}</Badge>
            {merchant.modes_enabled.includes('B') && (
              <span className="flex items-center gap-1 text-mode-whatsapp"><MessageCircle className="w-3 h-3" /> Enquire on WhatsApp</span>
            )}
          </div>
        </div>
      </section>

      {/* Tabs: Products, About, Reviews */}
      <section className="section-container py-8">
        <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {products.length === 0 ? (
              <div className="text-center py-16">
                <Store className="w-16 h-16 text-pm-text-secondary/30 mx-auto mb-4" />
                <p className="text-pm-body text-pm-text-secondary">No products available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.filter(p => p.is_active).map((product) => (
                  <Link key={product.id} href={`/product/${product.id}`}>
                    <Card className="product-card group h-full flex flex-col">
                      <div className="h-44 bg-gradient-to-br from-pm-cream to-pm-gold/10 flex items-center justify-center relative overflow-hidden">
                        <div className="text-4xl">🪢</div>
                        {product.mrp && product.mrp > product.price && (
                          <Badge variant="destructive" className="absolute top-2 left-2 text-pm-tiny">
                            -{Math.round((1 - product.price / product.mrp) * 100)}%
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-pm-body font-semibold text-pm-text group-hover:text-pm-gold transition-colors mb-1">
                          {product.name}
                        </h3>
                        <p className="text-pm-tiny text-pm-text-secondary mb-2 line-clamp-2 flex-1">
                          {product.description}
                        </p>
                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-pm-h3 text-pm-burgundy font-bold">{formatPrice(product.price)}</span>
                          {product.mrp && product.mrp > product.price && (
                            <span className="text-pm-small text-pm-text-secondary line-through">{formatPrice(product.mrp)}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {product.mode_badges.map((mode) => (
                            <Badge
                              key={mode}
                              variant={mode === 'A' ? 'buy' : mode === 'B' ? 'whatsapp' : 'visit'}
                              className="cursor-pointer text-pm-tiny"
                              onClick={(e) => handleModeAction(mode, product.name, e)}
                            >
                              {mode === 'A' ? 'Buy Now' : mode === 'B' ? 'Enquire on WhatsApp' : 'Visit Store'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about">
            <Card className="p-6 max-w-2xl">
              <h3 className="text-pm-h3 mb-4">About {merchant.store_name}</h3>
              <p className="text-pm-body text-pm-text-secondary mb-4">{merchant.description}</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-pm-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-pm-small font-medium">Operating Hours</p>
                    <p className="text-pm-small text-pm-text-secondary">Mon-Sat: 10:00 AM - 8:00 PM</p>
                    <p className="text-pm-small text-pm-text-secondary">Sun: 11:00 AM - 6:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-pm-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-pm-small font-medium">Location</p>
                    <p className="text-pm-small text-pm-text-secondary">Chickpet Main Road, Bangalore</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-pm-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-pm-small font-medium">Rating</p>
                    <p className="text-pm-small text-pm-text-secondary">{merchant.rating}★ out of 5</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="p-6 max-w-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-pm-gold">{merchant.rating}</div>
                  <div className="text-pm-small text-pm-text-secondary">out of 5</div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-5 h-5 ${star <= Math.round(merchant.rating) ? 'text-pm-gold fill-pm-gold' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <p className="text-pm-body text-pm-text-secondary">
                Reviews coming soon! Be the first to review this store.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Floating WhatsApp CTA (if Mode B enabled) */}
      {merchant.modes_enabled.includes('B') && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => window.open(`https://wa.me/919999999999?text=Hi%20${encodeURIComponent(merchant.store_name)}`, '_blank')}
            className="w-14 h-14 rounded-full bg-mode-whatsapp text-white shadow-pm-lg flex items-center justify-center hover:bg-green-600 transition-colors animate-slide-up"
          >
            <MessageCircle className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* Help Banner */}
      <section className="bg-pm-cream border-t border-pm-border py-6">
        <div className="section-container">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-pm-gold shrink-0" />
            <p className="text-pm-small text-pm-text-secondary">
              Browse products from this merchant. Each product shows available shopping modes — choose what works best for you.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
