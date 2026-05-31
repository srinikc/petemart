'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PRODUCTS } from '@/lib/data';
import { formatPrice, getModeLabel } from '@/lib/utils';
import {
  Plus, Search, Download, Upload, Edit2, Trash2,
  Info, ToggleLeft, Eye, ChevronRight
} from 'lucide-react';

export default function MerchantProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const merchantProducts = PRODUCTS.filter(p => p.merchant_id === 'merchant-1');
  const filteredProducts = merchantProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-pm-h2">Product Management</h1>
          <p className="text-pm-body text-pm-text-secondary">Your Products ({merchantProducts.length})</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" /> Bulk Upload</Button>
          <Link href="/merchant/products/new">
            <Button variant="default" size="sm"><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
          <Input
            placeholder="Search by name or SKU..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
        </div>
      </div>

      {/* Product Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted border-b border-pm-border">
                <th className="text-left p-4 text-pm-tiny text-pm-text-secondary font-medium uppercase">Product</th>
                <th className="text-left p-4 text-pm-tiny text-pm-text-secondary font-medium uppercase">SKU</th>
                <th className="text-left p-4 text-pm-tiny text-pm-text-secondary font-medium uppercase">Price</th>
                <th className="text-left p-4 text-pm-tiny text-pm-text-secondary font-medium uppercase">Stock</th>
                <th className="text-left p-4 text-pm-tiny text-pm-text-secondary font-medium uppercase">Status</th>
                <th className="text-left p-4 text-pm-tiny text-pm-text-secondary font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-pm-border hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-pm-md bg-pm-cream flex items-center justify-center">
                        🪢
                      </div>
                      <div>
                        <p className="text-pm-small font-medium text-pm-text">{product.name}</p>
                        <div className="flex gap-1 mt-0.5">
                          {product.mode_badges.map((mode) => (
                            <Badge key={mode} variant={mode === 'A' ? 'buy' : mode === 'B' ? 'whatsapp' : 'visit'} className="text-[10px] px-1 py-0">
                              {mode}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-pm-small text-pm-text-secondary">{product.sku}</td>
                  <td className="p-4">
                    <span className="text-pm-small font-semibold">{formatPrice(product.price)}</span>
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-pm-tiny text-pm-text-secondary line-through ml-1">{formatPrice(product.mrp)}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`text-pm-small font-medium ${product.stock_count < 10 ? 'text-pm-error' : 'text-pm-text'}`}>
                      {product.stock_count}
                      {product.stock_count < 10 && (
                        <span className="ml-1 text-pm-tiny text-pm-error">Low</span>
                      )}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge variant={product.is_active ? 'success' : 'warning'} className="text-pm-tiny">
                      {product.is_active ? 'Active' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Link href={`/merchant/products/${product.id}/edit`}>
                        <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" className="text-pm-error"><Trash2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Help */}
      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">
            Manage your product catalog. Add new products, edit existing ones, or bulk upload via CSV.
          </p>
        </div>
      </section>
    </div>
  );
}
