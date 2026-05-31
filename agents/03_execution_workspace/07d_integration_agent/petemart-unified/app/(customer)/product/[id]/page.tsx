'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getProductById, getMerchant } from '@/lib/data';
import { formatPrice, getModeLabel, getInitials } from '@/lib/utils';
import { Star, ShoppingCart, MessageCircle, MapPin, Minus, Plus, Info, ChevronLeft, Shield, Truck, RotateCcw } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProductById(id);
  const merchant = product ? getMerchant(product.merchant_id) : undefined;
  const [quantity, setQuantity] = useState(1);

  if (!product || !merchant) {
    return (
      <div className="section-container py-20 text-center">
        <h1 className="text-pm-h2 mb-4">Product Not Found</h1>
        <p className="text-pm-body text-pm-text-secondary mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/"><Button variant="default">Back to Home</Button></Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    toast.success(`Added ${quantity} × ${product.name} to cart`);
  };

  return (
    <div className="section-container py-8">
      <Link href={`/shop/${merchant.slug}`} className="inline-flex items-center gap-1 text-pm-text-secondary hover:text-pm-gold text-pm-small mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to {merchant.store_name}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image Gallery */}
        <div>
          <div className="aspect-square bg-gradient-to-br from-pm-cream to-pm-gold/10 rounded-pm-xl flex items-center justify-center mb-4">
            <div className="text-8xl">🛍️</div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.map((img, i) => (
              <div key={i} className="w-20 h-20 shrink-0 rounded-pm-md bg-pm-cream flex items-center justify-center cursor-pointer border-2 border-transparent hover:border-pm-gold transition-colors">
                <span className="text-lg">🪢</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {product.mode_badges.map((mode) => (
              <Badge key={mode} variant={mode === 'A' ? 'buy' : mode === 'B' ? 'whatsapp' : 'visit'}>{getModeLabel(mode).label}</Badge>
            ))}
          </div>

          <h1 className="text-pm-h1 text-pm-text mb-2">{product.name}</h1>

          <Link href={`/shop/${merchant.slug}`} className="inline-flex items-center gap-2 text-pm-small text-pm-gold hover:text-pm-gold-dark mb-4">
            <Avatar className="w-6 h-6"><AvatarFallback className="bg-pm-gold/20 text-pm-gold text-[10px]">{getInitials(merchant.store_name)}</AvatarFallback></Avatar>
            {merchant.store_name}
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-pm-text">{formatPrice(product.price)}</span>
            {product.mrp && product.mrp > product.price && (
              <>
                <span className="text-lg text-pm-text-secondary line-through">{formatPrice(product.mrp)}</span>
                <Badge variant="default" className="bg-green-500 text-white">{Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF</Badge>
              </>
            )}
          </div>

          <p className="text-pm-body text-pm-text-secondary mb-6">{product.description}</p>

          <div className="flex items-center gap-3 mb-6">
            {product.rating && (
              <div className="flex items-center gap-1 text-pm-small">
                <Star className="w-4 h-4 text-pm-gold fill-pm-gold" />{product.rating}
                <span className="text-pm-text-secondary">({product.review_count} reviews)</span>
              </div>
            )}
            <span className="text-pm-small text-pm-text-secondary">SKU: {product.sku}</span>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-pm-small font-medium">Quantity:</span>
            <div className="flex items-center border border-pm-border rounded-pm-md">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-muted transition-colors"><Minus className="w-4 h-4" /></button>
              <span className="px-4 py-2 text-pm-body font-medium min-w-[3rem] text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-muted transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
            <span className="text-pm-tiny text-pm-text-secondary">{product.stock_count} in stock</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button variant="default" size="lg" className="flex-1" onClick={handleAddToCart}>
              <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart — {formatPrice(product.price * quantity)}
            </Button>
            {merchant.modes_enabled.includes('B') && (
              <Button variant="whatsapp" size="lg"><MessageCircle className="w-5 h-5 mr-2" /> Enquire on WhatsApp</Button>
            )}
            {merchant.modes_enabled.includes('C') && (
              <Button variant="visit" size="lg"><MapPin className="w-5 h-5 mr-2" /> Visit Store</Button>
            )}
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-pm-cream rounded-pm-lg border border-pm-border">
            <div className="text-center"><Truck className="w-5 h-5 text-pm-gold mx-auto mb-1" /><p className="text-pm-tiny text-pm-text-secondary">Free delivery above ₹500</p></div>
            <div className="text-center"><Shield className="w-5 h-5 text-pm-gold mx-auto mb-1" /><p className="text-pm-tiny text-pm-text-secondary">Secure payment</p></div>
            <div className="text-center"><RotateCcw className="w-5 h-5 text-pm-gold mx-auto mb-1" /><p className="text-pm-tiny text-pm-text-secondary">Easy returns</p></div>
          </div>
        </div>
      </div>

      {/* Help Banner */}
      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">
            Add items to your cart and choose between delivery modes. Mode A (Buy Now) for instant purchase, Mode B (WhatsApp) to enquire, or Mode C (Visit Store) for in-person shopping.
          </p>
        </div>
      </section>
    </div>
  );
}
