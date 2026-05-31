'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Info, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function MerchantAddProductPage() {
  const handleSave = () => {
    toast.success('Product added successfully!');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/merchant/products" className="inline-flex items-center gap-1 text-pm-text-secondary hover:text-pm-gold text-pm-small transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>
      <h1 className="text-pm-h2">Add New Product</h1>

      <Card className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-pm-small font-medium text-pm-text block mb-1">Product Name *</label>
            <Input placeholder="Enter product name" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-pm-small font-medium text-pm-text block mb-1">Description</label>
            <textarea className="w-full h-24 rounded-pm-md border border-pm-border p-3 text-pm-small resize-none" placeholder="Product description..." />
          </div>
          <div>
            <label className="text-pm-small font-medium text-pm-text block mb-1">Price (₹) *</label>
            <Input type="number" placeholder="0" />
          </div>
          <div>
            <label className="text-pm-small font-medium text-pm-text block mb-1">MRP (₹)</label>
            <Input type="number" placeholder="0" />
          </div>
          <div>
            <label className="text-pm-small font-medium text-pm-text block mb-1">SKU *</label>
            <Input placeholder="e.g., SS-SILK-001" />
          </div>
          <div>
            <label className="text-pm-small font-medium text-pm-text block mb-1">Stock Count *</label>
            <Input type="number" placeholder="0" />
          </div>
          <div>
            <label className="text-pm-small font-medium text-pm-text block mb-1">Category</label>
            <select className="w-full h-10 rounded-pm-md border border-pm-border bg-white px-3 text-pm-small">
              <option>Silk Sarees</option>
              <option>Cotton Sarees</option>
              <option>Accessories</option>
              <option>Men's Wear</option>
              <option>Women's Wear</option>
            </select>
          </div>
          <div>
            <label className="text-pm-small font-medium text-pm-text block mb-1">HSN Code</label>
            <Input placeholder="e.g., 5007" />
          </div>
        </div>

        {/* Mode Selection */}
        <div>
          <label className="text-pm-small font-medium text-pm-text block mb-2">Available Modes</label>
          <div className="flex gap-3">
            {[
              { value: 'A', label: 'Buy Now' },
              { value: 'B', label: 'WhatsApp' },
              { value: 'C', label: 'Visit Store' },
            ].map((mode) => (
              <label key={mode.value} className="flex items-center gap-2 px-4 py-2 rounded-pm-md border border-pm-border cursor-pointer hover:bg-muted">
                <input type="checkbox" defaultChecked className="text-pm-gold rounded" />
                <span className="text-pm-small">{mode.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="text-pm-small font-medium text-pm-text block mb-2">Product Images</label>
          <div className="border-2 border-dashed border-pm-border rounded-pm-lg p-8 text-center hover:border-pm-gold/50 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-pm-text-secondary mx-auto mb-2" />
            <p className="text-pm-small text-pm-text-secondary">Click to upload or drag and drop</p>
            <p className="text-pm-tiny text-pm-text-secondary">PNG, JPG up to 5MB</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-pm-border">
          <Button variant="default" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" /> Save Product
          </Button>
          <Link href="/merchant/products">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </Card>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">
            Fill in the product details. Products will be visible on your store microsite once saved. Add at least 3 products to start selling.
          </p>
        </div>
      </section>
    </div>
  );
}
