'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getProductById, getMerchant } from '@/lib/data';
import { formatPrice, getModeLabel, getInitials } from '@/lib/utils';
import {
  ArrowLeft, Star, Shield, CheckCircle, Truck, ChevronDown,
  ChevronUp, MessageCircle, MapPin, Info, Heart, Share2, Minus, Plus
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProductById(id);
  const merchant = product ? getMerchant(product.merchant_id) : null;
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [descriptionOpen, setDescriptionOpen] = useState(true);

  if (!product || !merchant) {
    return (
      <div className="section-container py-20 text-center">
        <h1 className="text-pm-h2 mb-4">Product Not Found</h1>
        <p className="text-pm-body text-pm-text-secondary mb-6">This product doesn&apos;t exist or has been removed.</p>
        <Link href="/"><Button variant="default">Back to Home</Button></Link>
      </div>
    );
  }

  const savings = product.mrp ? product.mrp - product.price : 0;

  const handleAddToCart = () => {
    toast.success(`${product.name} (×${quantity}) added to cart!`);
  };

  const handleModeAction = (mode: string) => {
    switch (mode) {
      case 'A':
        handleAddToCart();
        break;
      case 'B':
        window.open(`https://wa.me/919999999999?text=Hi%20${encodeURIComponent(merchant.store_name)}%2C%20I'm%20interested%20in%20${encodeURIComponent(product.name)}%20-%20${formatPrice(product.price)}`, '_blank');
        break;
      case 'C':
        window.open(`https://maps.google.com/?q=${encodeURIComponent(merchant.store_name)}`, '_blank');
        break;
    }
  };

  return (
    <div className="space-y-0">
      <div className="section-container py-6">
        <Link href={`/shop/${merchant.slug}`} className="inline-flex items-center gap-1 text-pm-text-secondary hover:text-pm-gold text-pm-small mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {merchant.store_name}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-gradient-to-br from-pm-cream to-pm-gold/10 rounded-pm-lg flex items-center justify-center relative overflow-hidden border border-pm-border">
              <div className="text-6xl">🪢</div>
              {product.mrp && product.mrp > product.price && (
                <Badge variant="destructive" className="absolute top-4 left-4">
                  Save {formatPrice(savings)}
                </Badge>
              )}
              {product.stock_count <= 5 && (
                <Badge variant="warning" className="absolute top-4 right-4">
                  Only {product.stock_count} left
                </Badge>
              )}
            </div>
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-pm-md bg-pm-cream border-2 flex items-center justify-center transition-all ${
                    i === selectedImage ? 'border-pm-gold' : 'border-pm-border hover:border-pm-gold/50'
                  }`}
                >
                  <span className="text-2xl">🪢</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className="mb-2">{merchant.category}</Badge>
                  <h1 className="text-pm-h2 text-pm-text mb-2">{product.name}</h1>
                </div>
                <button className="p-2 rounded-full hover:bg-muted transition-colors">
                  <Heart className="w-5 h-5 text-pm-text-secondary" />
                </button>
              </div>

              <div className="flex items-center gap-4 text-pm-small text-pm-text-secondary">
                <Link href={`/shop/${merchant.slug}`} className="flex items-center gap-2 hover:text-pm-gold transition-colors">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-pm-gold/10 text-pm-gold text-[10px]">
                      {getInitials(merchant.store_name)}
                    </AvatarFallback>
                  </Avatar>
                  {merchant.store_name}
                </Link>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-pm-gold fill-pm-gold" /> {product.rating} ({product.review_count} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-pm-burgundy">{formatPrice(product.price)}</span>
              {product.mrp && product.mrp > product.price && (
                <>
                  <span className="text-lg text-pm-text-secondary line-through">{formatPrice(product.mrp)}</span>
                  <Badge variant="success">Save {formatPrice(savings)}</Badge>
                </>
              )}
            </div>

            {/* Mode Buttons */}
            <div className="space-y-2">
              <p className="text-pm-small font-medium text-pm-text">Choose how to shop:</p>
              <div className="grid grid-cols-1 gap-2">
                {product.mode_badges.includes('A') && (
                  <Button variant="mode-buy" size="lg" className="w-full justify-between" onClick={() => handleModeAction('A')}>
                    <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Buy Now</span>
                    <span className="text-sm opacity-90">{formatPrice(product.price)}</span>
                  </Button>
                )}
                {product.mode_badges.includes('B') && (
                  <Button variant="mode-whatsapp" size="lg" className="w-full justify-between" onClick={() => handleModeAction('B')}>
                    <span className="flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Enquire on WhatsApp</span>
                    <span className="text-sm opacity-90">Chat with store</span>
                  </Button>
                )}
                {product.mode_badges.includes('C') && (
                  <Button variant="mode-visit" size="lg" className="w-full justify-between" onClick={() => handleModeAction('C')}>
                    <span className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Visit Store</span>
                    <span className="text-sm opacity-90">Get directions</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Quantity Selector (for Mode A) */}
            {product.mode_badges.includes('A') && (
              <div className="flex items-center gap-4">
                <span className="text-pm-small font-medium text-pm-text">Quantity:</span>
                <div className="flex items-center border border-pm-border rounded-pm-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-muted transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 py-2 font-medium text-pm-body">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_count, quantity + 1))}
                    className="p-2 hover:bg-muted transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-pm-small text-pm-text-secondary">{product.stock_count} in stock</span>
              </div>
            )}

            {/* Delivery Info */}
            <div className="bg-pm-cream rounded-pm-md p-4 border border-pm-border">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-pm-gold shrink-0 mt-0.5" />
                <div>
                  <p className="text-pm-small font-medium text-pm-text">Delivery Information</p>
                  <p className="text-pm-tiny text-pm-text-secondary">
                    Ships within PeteMart zone | Est. delivery <strong>2-4 hours</strong>
                  </p>
                  <p className="text-pm-tiny text-pm-text-secondary">
                    Free delivery on orders above ₹500
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {['BIS Hallmark', 'Pure Silk', '18yr Store'].map((badge) => (
                <div key={badge} className="flex items-center gap-2 bg-pm-cream rounded-pm-md p-2.5">
                  <Shield className="w-4 h-4 text-pm-gold shrink-0" />
                  <span className="text-pm-tiny text-pm-text-secondary">{badge}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <button
                onClick={() => setDescriptionOpen(!descriptionOpen)}
                className="flex items-center justify-between w-full py-3 border-b border-pm-border"
              >
                <span className="text-pm-body font-medium">Description</span>
                {descriptionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {descriptionOpen && (
                <p className="text-pm-body text-pm-text-secondary py-4">{product.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="bg-white border-t border-pm-border py-8">
        <div className="section-container">
          <h2 className="text-pm-h3 mb-6">Reviews ({product.review_count})</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-pm-gold">{product.rating}</div>
              <div className="text-pm-small text-pm-text-secondary">out of 5</div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-5 h-5 ${star <= Math.round(product.rating || 0) ? 'text-pm-gold fill-pm-gold' : 'text-gray-300'}`} />
              ))}
            </div>
          </div>
          <p className="text-pm-body text-pm-text-secondary">Reviews coming soon!</p>
        </div>
      </section>

      {/* Help Banner */}
      <section className="bg-pm-cream border-t border-pm-border py-6">
        <div className="section-container">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-pm-gold shrink-0" />
            <p className="text-pm-small text-pm-text-secondary">
              View product details and choose your preferred shopping mode. Items added to cart can be checked out together across multiple stores.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
