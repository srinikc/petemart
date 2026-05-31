'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CART_ITEMS, ADDRESSES } from '@/lib/data';
import { formatPrice, getInitials } from '@/lib/utils';
import {
  MapPin, CreditCard, Shield, ChevronDown, ChevronUp,
  Info, CheckCircle, Radio, Plus, Lock, ArrowLeft
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const [selectedAddress, setSelectedAddress] = useState(ADDRESSES[0].id);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [processing, setProcessing] = useState(false);

  const groupedItems = CART_ITEMS.reduce((acc, item) => {
    if (!acc[item.merchant_id]) {
      acc[item.merchant_id] = { merchant_name: item.merchant_name, items: [] };
    }
    acc[item.merchant_id].items.push(item);
    return acc;
  }, {} as Record<string, { merchant_name: string; items: typeof CART_ITEMS }>);

  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const delivery = 70 + (Object.keys(groupedItems).length - 1) * 25;
  const pgFee = Math.round(subtotal * 0.02);
  const total = subtotal + delivery + pgFee;

  const handlePlaceOrder = () => {
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      toast.success('Order placed successfully!');
      router.push('/orders/order-1/confirmation');
    }, 2000);
  };

  return (
    <div className="section-container py-8">
      <Link href="/cart" className="inline-flex items-center gap-1 text-pm-text-secondary hover:text-pm-gold text-pm-small mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>

      <h1 className="text-pm-h2 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Address + Payment */}
        <div className="lg:col-span-3 space-y-6">
          {/* Delivery Address */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-pm-body font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-pm-gold" /> Delivery Address
              </h2>
              <button
                onClick={() => setShowNewAddress(!showNewAddress)}
                className="text-pm-small text-pm-gold hover:text-pm-gold-dark font-medium"
              >
                + Add New
              </button>
            </div>

            <div className="space-y-3">
              {ADDRESSES.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex items-start gap-3 p-4 rounded-pm-md border-2 cursor-pointer transition-all ${
                    selectedAddress === addr.id
                      ? 'border-pm-gold bg-pm-gold/5'
                      : 'border-pm-border hover:border-pm-gold/30'
                  }`}
                >
                  <Radio
                    className={`w-5 h-5 mt-0.5 shrink-0 ${
                      selectedAddress === addr.id ? 'text-pm-gold' : 'text-pm-text-secondary'
                    }`}
                    checked={selectedAddress === addr.id}
                    onChange={() => setSelectedAddress(addr.id)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-pm-body font-medium">{addr.name}</p>
                      {addr.is_default && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">Default</Badge>
                      )}
                    </div>
                    <p className="text-pm-small text-pm-text-secondary">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
                    </p>
                    <p className="text-pm-small text-pm-text-secondary">
                      {addr.city} - {addr.pincode}
                    </p>
                    <p className="text-pm-tiny text-pm-text-secondary">Phone: {addr.phone}</p>
                  </div>
                </label>
              ))}
            </div>

            {showNewAddress && (
              <div className="mt-4 p-4 bg-pm-cream rounded-pm-md border border-pm-border space-y-3">
                <h3 className="text-pm-small font-medium">Add New Address</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Full Name" className="col-span-2" />
                  <Input placeholder="Phone Number" type="tel" />
                  <Input placeholder="Pincode" />
                  <Input placeholder="Address Line 1" className="col-span-2" />
                  <Input placeholder="Address Line 2" className="col-span-2" />
                  <Input placeholder="City" />
                  <Input placeholder="Landmark (optional)" />
                </div>
                <Button variant="default" size="sm">Save Address</Button>
              </div>
            )}
          </Card>

          {/* Payment Method */}
          <Card className="p-5">
            <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-pm-gold" /> Payment Method
            </h2>

            <div className="bg-pm-cream rounded-pm-md p-3 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-pm-gold" />
              <span className="text-pm-tiny text-pm-text-secondary">Secure payment via Razorpay</span>
            </div>

            <div className="space-y-2">
              {[
                { id: 'upi', label: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
                { id: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
                { id: 'netbanking', label: 'Net Banking', desc: 'All major banks' },
                { id: 'wallet', label: 'Wallet', desc: 'Paytm, Mobikwik, Amazon Pay' },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center gap-3 p-3 rounded-pm-md border cursor-pointer transition-all ${
                    paymentMethod === method.id
                      ? 'border-pm-gold bg-pm-gold/5'
                      : 'border-pm-border hover:border-pm-gold/30'
                  }`}
                >
                  <Radio
                    className={`w-4 h-4 shrink-0 ${
                      paymentMethod === method.id ? 'text-pm-gold' : 'text-pm-text-secondary'
                    }`}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                  />
                  <div>
                    <p className="text-pm-small font-medium">{method.label}</p>
                    <p className="text-pm-tiny text-pm-text-secondary">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </Card>

          <p className="text-pm-tiny text-pm-text-secondary flex items-center gap-1">
            <Lock className="w-3 h-3" /> Your payment is held securely until delivery confirmation
          </p>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <Card className="p-5 sticky top-24">
            <h2 className="text-pm-body font-semibold mb-4">Order Summary</h2>

            <div className="space-y-4">
              {Object.entries(groupedItems).map(([merchantId, group]) => (
                <div key={merchantId} className="pb-3 border-b border-pm-border">
                  <p className="text-pm-small font-medium text-pm-text mb-2">{group.merchant_name}</p>
                  {group.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-pm-small text-pm-text-secondary py-1">
                      <span className="truncate mr-2">{item.product_name} × {item.quantity}</span>
                      <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-pm-small">
                <span className="text-pm-text-secondary">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-pm-small">
                <span className="text-pm-text-secondary">Delivery fee</span>
                <span>{formatPrice(delivery)}</span>
              </div>
              <div className="flex justify-between text-pm-small">
                <span className="text-pm-text-secondary">PG Fee (2%)</span>
                <span>{formatPrice(pgFee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-pm-body font-bold">
                <span>Grand Total</span>
                <span className="text-pm-burgundy">{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              variant="default"
              size="lg"
              className="w-full mt-6"
              onClick={handlePlaceOrder}
              disabled={processing}
            >
              {processing ? (
                <span className="flex items-center gap-2">Processing... <span className="animate-pulse">⏳</span></span>
              ) : (
                `Place Order — ${formatPrice(total)}`
              )}
            </Button>

            <div className="flex items-center justify-center gap-1 mt-3 text-pm-tiny text-pm-text-secondary">
              <CheckCircle className="w-3 h-3 text-pm-success" />
              <span>Free cancellation before packing</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Help Banner */}
      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">
            Review your delivery address and order summary before making payment. Your payment is held securely until delivery confirmation.
          </p>
        </div>
      </section>
    </div>
  );
}
