'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MARKETS, MERCHANTS } from '@/lib/data';
import { getModeLabel, formatPrice, truncate } from '@/lib/utils';
import {
  Search,
  MapPin,
  ChevronRight,
  Star,
  TrendingUp,
  Truck,
  MessageCircle,
  Store,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
} from 'lucide-react';

const FEATURED_MERCHANTS = MERCHANTS.filter(m => m.status === 'active').slice(0, 4);

const HOW_IT_WORKS = [
  { icon: <MapPin className="w-6 h-6" />, title: 'Browse Markets', desc: 'Explore historic Pete markets and discover unique products from traditional merchants.' },
  { icon: <MessageCircle className="w-6 h-6" />, title: 'Choose Your Mode', desc: 'Buy Now, Enquire on WhatsApp, or Visit Store — you pick how to shop.' },
  { icon: <Truck className="w-6 h-6" />, title: 'Get It Delivered', desc: 'Fast hyperlocal delivery to your doorstep with real-time tracking.' },
];

const TAPESTRY_SLIDES = [
  { name: 'Chickpet', desc: 'The Textile Heart of Bangalore', fact: 'Home to 118 textile wholesalers, some operating for over 80 years.', color: 'from-pm-burgundy/80 to-pm-burgundy/40' },
  { name: 'Balepet', desc: 'Household & Everyday Essentials', fact: 'Since the early 1900s, Balepet has been the neighborhood hub for daily essentials.', color: 'from-pm-gold/80 to-pm-gold/40' },
  { name: 'Raja Market', desc: 'Jewellery & Traditional Crafts', fact: 'Established in the 1940s, houses generations of master jewellers.', color: 'from-pm-burgundy/80 to-pm-burgundy/40' },
];

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div className="space-y-0">
      {/* Pete Tapestry Hero Carousel */}
      <section className="relative h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden">
        {TAPESTRY_SLIDES.map((slide, i) => (
          <div
            key={slide.name}
            className={`absolute inset-0 transition-opacity duration-700 ${i === activeSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.color}`} />
            <div className="absolute inset-0 bg-[url('/images/hero-pattern.png')] bg-cover bg-center mix-blend-overlay opacity-20" />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ))}
        <div className="relative h-full section-container flex items-center">
          <div className="max-w-2xl animate-slide-up">
            <Badge variant="default" className="mb-4 text-pm-small px-4 py-1.5">
              🏛️ Discover Old Bangalore
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight text-balance">
              Discover the Heart of <span className="text-pm-gold">Old Bangalore</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
              Shop from 5,000+ traditional merchants across Chickpet, Balepet, Raja Market and more. Choose how you shop — online, WhatsApp, or in-store.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/markets/chickpet">
                <Button size="lg" variant="default" className="bg-pm-gold hover:bg-pm-gold-dark">
                  Explore Markets <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth">
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                  Join PeteMart
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Carousel Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
          {TAPESTRY_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeSlide ? 'bg-pm-gold w-8' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
        <button
          onClick={() => setActiveSlide((prev) => (prev - 1 + TAPESTRY_SLIDES.length) % TAPESTRY_SLIDES.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveSlide((prev) => (prev + 1) % TAPESTRY_SLIDES.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors hidden md:flex"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="section-container">
          <h2 className="text-pm-h2 text-center text-pm-text mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-pm-lg bg-pm-gold/10 flex items-center justify-center text-pm-gold">
                  {step.icon}
                </div>
                <div className="w-8 h-8 mx-auto mb-3 rounded-full bg-pm-gold text-white flex items-center justify-center text-pm-small font-bold">
                  {i + 1}
                </div>
                <h3 className="text-pm-h3 mb-2">{step.title}</h3>
                <p className="text-pm-body text-pm-text-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Market */}
      <section className="py-16 bg-pm-cream">
        <div className="section-container">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-pm-h2 text-pm-text">Shop by Market</h2>
              <p className="text-pm-body text-pm-text-secondary mt-1">Explore Bangalore&apos;s historic Pete markets</p>
            </div>
            <Link href="/markets/chickpet" className="text-pm-small text-pm-gold hover:text-pm-gold-dark font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MARKETS.slice(0, 3).map((market) => (
              <Link key={market.id} href={`/markets/${market.slug}`}>
                <div className="market-card group">
                  <div className="h-48 bg-gradient-to-br from-pm-gold/20 to-pm-burgundy/20 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="relative z-10 text-center">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Store className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <Badge variant="secondary" className="absolute top-3 right-3">
                      {market.merchant_count} stores
                    </Badge>
                  </div>
                  <div className="p-5">
                    <h3 className="text-pm-h3 text-pm-text mb-1">{market.name}</h3>
                    <p className="text-pm-small text-pm-text-secondary mb-2">{market.description}</p>
                    <p className="text-pm-tiny text-pm-gold font-medium flex items-center gap-1">
                      {market.specialization} <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Merchants */}
      <section className="py-16 bg-white">
        <div className="section-container">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-pm-h2 text-pm-text">Featured Merchants Today</h2>
              <p className="text-pm-body text-pm-text-secondary mt-1">Discover top-rated stores near you</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURED_MERCHANTS.map((merchant) => (
              <Link key={merchant.id} href={`/shop/${merchant.slug}`}>
                <Card className="product-card group h-full">
                  <div className="h-36 bg-gradient-to-br from-pm-gold/10 to-pm-burgundy/10 flex items-center justify-center relative">
                    <div className="w-16 h-16 rounded-full bg-pm-gold/20 flex items-center justify-center">
                      <Store className="w-8 h-8 text-pm-gold" />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      {merchant.modes_enabled.map((mode) => (
                        <Badge key={mode} variant={mode === 'A' ? 'buy' : mode === 'B' ? 'whatsapp' : 'visit'} className="text-[10px] px-1.5 py-0.5">
                          {mode === 'A' ? 'Buy' : mode === 'B' ? 'WA' : 'Visit'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-pm-body font-semibold text-pm-text mb-1">{merchant.store_name}</h3>
                    <div className="flex items-center gap-2 text-pm-tiny text-pm-text-secondary mb-2">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-pm-gold fill-pm-gold" /> {merchant.rating}</span>
                      <span>{merchant.distance} km</span>
                      <span className="bg-pm-gold/10 text-pm-gold px-1.5 py-0.5 rounded-pm-sm">{merchant.category}</span>
                    </div>
                    <p className="text-pm-tiny text-pm-text-secondary line-clamp-2">{truncate(merchant.description, 80)}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Help / Assistance Banner */}
      <section className="py-12 bg-pm-gold/5 border-t border-pm-gold/10">
        <div className="section-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-pm-gold/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-pm-gold" />
              </div>
              <div>
                <h3 className="text-pm-h3 text-pm-text">Need Help Shopping?</h3>
                <p className="text-pm-body text-pm-text-secondary">
                  PeteMart connects you with traditional merchants from Old Bangalore&apos;s historic Pete markets. Browse, enquire, or visit — you choose how to shop!
                </p>
              </div>
            </div>
            <Link href="/auth">
              <Button variant="default" size="lg">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
