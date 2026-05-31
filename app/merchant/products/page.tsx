'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProductsByMerchant } from '@/lib/data';
import { formatPrice, getModeLabel } from '@/lib/utils';
import { Search, Plus, Filter, Download, Upload, Package, Info, Star } from 'lucide-react';

const MERCHANT_ID = 'merchant-1';
const products = getProductsByMerchant(MERCHANT_ID);

export default function MerchantProducts() {
  const [search, setSearch] = useState('');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="section-container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-pm-h2 text-pm-text">My Products</h1>
          <p className="text-pm-body text-pm-text-secondary">{filtered.length} products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" /> Export</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> Import</Button>
          <Link href="/merchant/products/new"><Button variant="default" size="sm"><Plus className="w-4 h-4 mr-1" /> Add Product</Button></Link>
        </div>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
            <Input placeholder="Search by name, SKU, or category..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
          <Button variant="outline" size="sm"><Package className="w-4 h-4 mr-1" /> Bulk Actions</Button>
        </div>
      </Card>

      <div className="bg-white rounded-pm-lg border border-pm-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-pm-cream text-pm-small text-pm-text-secondary">
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-right px-4 py-3 font-medium">Price</th>
                <th className="text-right px-4 py-3 font-medium">Stock</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Modes</th>
                <th className="text-center px-4 py-3 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-t border-pm-border hover:bg-pm-cream/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-pm-md bg-pm-cream flex items-center justify-center">🛍️</div>
                      <div>
                        <p className="text-pm-small font-medium">{product.name}</p>
                        <p className="text-pm-tiny text-pm-text-secondary">{product.description.slice(0, 50)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-pm-small text-pm-text-secondary">{product.sku}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-pm-tiny">{product.category}</Badge></td>
                  <td className="px-4 py-3 text-pm-small font-medium text-right">{formatPrice(product.price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-pm-small font-medium ${product.stock_count < 10 ? 'text-red-600' : 'text-green-600'}`}>{product.stock_count}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={product.is_active ? 'buy' : 'outline'} className="text-pm-tiny">{product.is_active ? 'Active' : 'Draft'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      {product.mode_badges.map((m) => (
                        <Badge key={m} variant={m === 'A' ? 'buy' : m === 'B' ? 'whatsapp' : 'visit'} className="text-[10px]">{m}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-pm-small">
                      <Star className="w-3 h-3 text-pm-gold fill-pm-gold" />{product.rating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-pm-text-secondary/30 mx-auto mb-3" />
            <p className="text-pm-body text-pm-text-secondary">No products found</p>
          </div>
        )}
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Manage your product catalog. Add, edit, or archive products. Use bulk import/export for large catalog updates.</p>
        </div>
      </section>
    </div>
  );
}
