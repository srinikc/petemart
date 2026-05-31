'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewProduct() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Product created successfully');
      router.push('/merchant/products');
    }, 1500);
  };

  return (
    <div className="section-container py-8 max-w-3xl mx-auto">
      <Link href="/merchant/products" className="inline-flex items-center gap-1 text-pm-text-secondary hover:text-pm-gold text-pm-small mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <h1 className="text-pm-h2 mb-6">Add New Product</h1>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-pm-body font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-pm-small font-medium text-pm-text">Product Name *</label>
              <Input placeholder="Enter product name" className="mt-1" />
            </div>
            <div>
              <label className="text-pm-small font-medium text-pm-text">Description</label>
              <textarea className="w-full min-h-[100px] rounded-pm-md border border-pm-border bg-white px-3 py-2 text-sm mt-1" placeholder="Describe your product..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-pm-small font-medium text-pm-text">Price (₹) *</label>
                <Input type="number" placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-pm-small font-medium text-pm-text">Compare at Price</label>
                <Input type="number" placeholder="0" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-pm-small font-medium text-pm-text">Stock Quantity</label>
                <Input type="number" placeholder="0" className="mt-1" />
              </div>
              <div>
                <label className="text-pm-small font-medium text-pm-text">SKU</label>
                <Input placeholder="e.g., SS-SILK-001" className="mt-1" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-pm-body font-semibold mb-4">Shopping Modes</h2>
          <div className="flex gap-3">
            {[
              { id: 'A', label: 'Buy Now', desc: 'Full e-commerce checkout' },
              { id: 'B', label: 'WhatsApp', desc: 'Enquire via WhatsApp' },
              { id: 'C', label: 'Visit Store', desc: 'In-store pickup' },
            ].map((mode) => (
              <label key={mode.id} className="flex items-start gap-2 p-3 rounded-pm-md border border-pm-border cursor-pointer hover:border-pm-gold/30 flex-1">
                <input type="checkbox" className="mt-1" defaultChecked={mode.id === 'A'} />
                <div>
                  <p className="text-pm-small font-medium">{mode.label}</p>
                  <p className="text-pm-tiny text-pm-text-secondary">{mode.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-pm-body font-semibold mb-4">Images</h2>
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-24 h-24 rounded-pm-lg border-2 border-dashed border-pm-border flex items-center justify-center cursor-pointer hover:border-pm-gold transition-colors">
                <Plus className="w-6 h-6 text-pm-text-secondary" />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/merchant/products"><Button variant="outline" size="lg">Cancel</Button></Link>
          <Button variant="default" size="lg" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Fill in the product details. Required fields are marked with *. You can add up to 5 images and select which shopping modes are available.</p>
        </div>
      </section>
    </div>
  );
}
