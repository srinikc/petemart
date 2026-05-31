'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getMerchantBySlug, getProductsByMerchant } from '@/lib/data';
import { formatPrice, getModeLabel, getInitials, truncate } from '@/lib/utils';
import { Store, Star, MapPin, Clock, ChevronRight, ShoppingCart, MessageCircle, Phone, Info, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function MerchantMicrosite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const merchant = getMerchantBySlug(slug);
  const products = merchant ? getProductsByMerchant(merchant.id) : [];
  const [activeTab, setActiveTab] = useState('products');

  if (!merchant) {
    return (
      <div className="section-container py-20 text-center">
        <h1 className="text-pm-h2 mb-4">Store Not Found</h1>
        <p className="text-pm-body text-pm-text-secondary mb-6">The store you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/"><Button variant="default">Back to Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Store Header */}
      <section className="bg-gradient-to-r from-pm-burgundy to-pm-burgundy/80 text-white py-12">
        <div className="section-container">
          <Link href="/markets/chickpet" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-pm-small mb-4 transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Market</Link>
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="w-20 h-20 rounded-pm-xl border-4 border-white/20">
                <AvatarFallback className="bg-pm-gold/20 text-pm-gold text-2xl rounded-pm-xl">{getInitials(merchant.store_name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-pm-h1 text-white">{merchant.store_name}</h1>
                  {merchant.status === 'active' && <Badge variant="default" className="bg-green-500 text-white">Open</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-pm-small text-white/70">
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 text-pm-gold fill-pm-gold" />{merchant.rating}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{merchant.distance} km</span>
                  <Badge variant="secondary" className="bg-white/10 text-white">{merchant.category}</Badge>
                </div>
                <p className="text-pm-small text-white/60 mt-2 max-w-xl">{merchant.description}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {merchant.modes_enabled.includes('A') && <Button variant="buy" size="sm"><ShoppingCart className="w-4 h-4 mr-1" /> Buy Now</Button>}
              {merchant.modes_enabled.includes('B') && <Button variant="whatsapp" size="sm"><MessageCircle className="w-4 h-4 mr-1" /> WhatsApp</Button>}
              {merchant.modes_enabled.includes('C') && <Button variant="visit" size="sm"><MapPin className="w-4 h-4 mr-1" /> Visit Store</Button>}
            </div>
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="bg-white border-b border-pm-border">
        <div className="section-container py-3">
          <div className="flex items-center gap-4 text-pm-tiny text-pm-text-secondary">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Hours: {merchant.business_hours?.['Mon-Sat'] || '10:00 AM - 8:00 PM'}</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Digital Readiness: {merchant.digital_readiness}</span>
          </div>
        </div>
      </section>

      {/* Tabs Content */}
      <section className="section-container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-pm-text-secondary/30 mx-auto mb-4" />
                <p className="text-pm-body text-pm-text-secondary">No products available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((product) => (
                  <Link key={product.id} href={`/product/${product.id}`}>
                    <Card className="product-card group h-full">
                      <div className="h-40 bg-gradient-to-br from-pm-gold/10 to-pm-cream flex items-center justify-center relative">
                        <div className="text-4xl">🛍️</div>
                        <Badge variant="default" className="absolute top-2 right-2 bg-pm-gold text-white">{formatPrice(product.price)}</Badge>
                      </div>
                      <div className="p-4">
                        <h3 className="text-pm-body font-semibold text-pm-text group-hover:text-pm-gold transition-colors mb-1">{product.name}</h3>
                        <p className="text-pm-tiny text-pm-text-secondary line-clamp-2 mb-3">{truncate(product.description, 80)}</p>
                        <div className="flex items-center gap-2 mb-3">
                          {product.rating && <span className="text-pm-tiny flex items-center gap-1"><Star className="w-3 h-3 text-pm-gold fill-pm-gold" />{product.rating}</span>}
                          {product.review_count && <span className="text-pm-tiny text-pm-text-secondary">({product.review_count} reviews)</span>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {product.mode_badges.map((mode) => (
                            <Badge key={mode} variant={mode === 'A' ? 'buy' : mode === 'B' ? 'whatsapp' : 'visit'} className="text-[10px]">{getModeLabel(mode).label}</Badge>
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
              <h2 className="text-pm-h3 mb-4">About {merchant.store_name}</h2>
              <p className="text-pm-body text-pm-text-secondary mb-4">{merchant.description}</p>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4 text-pm-small">
                <div><span className="text-pm-text-secondary">Category</span><p className="font-medium">{merchant.category}</p></div>
                <div><span className="text-pm-text-secondary">Distance</span><p className="font-medium">{merchant.distance} km</p></div>
                <div><span className="text-pm-text-secondary">Rating</span><p className="font-medium">{merchant.rating} / 5</p></div>
                <div><span className="text-pm-text-secondary">Digital Readiness</span><p className="font-medium">{merchant.digital_readiness}</p></div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="p-6 max-w-2xl">
              <h2 className="text-pm-h3 mb-4">Customer Reviews</h2>
              <p className="text-pm-body text-pm-text-secondary">Reviews coming soon.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Floating WhatsApp CTA */}
      {merchant.modes_enabled.includes('B') && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button variant="whatsapp" size="lg" className="shadow-lg rounded-full w-14 h-14 p-0">
            <MessageCircle className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Help Banner */}
      <section className="bg-pm-cream border-t border-pm-border py-6">
        <div className="section-container">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-pm-gold shrink-0" />
            <p className="text-pm-small text-pm-text-secondary">Browse products from {merchant.store_name}. Choose your shopping mode: Buy Now for quick checkout, Enquire on WhatsApp for personalized service, or Visit Store to see products in person.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
