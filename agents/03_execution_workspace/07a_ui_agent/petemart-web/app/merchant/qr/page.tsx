'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Share2, QrCode, Info } from 'lucide-react';

export default function MerchantQRPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-pm-h2">QR Code Generator</h1>
        <p className="text-pm-body text-pm-text-secondary">Generate QR codes for your store</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Display */}
        <Card className="p-8 text-center">
          <div className="w-64 h-64 mx-auto mb-6 bg-white rounded-pm-lg border-2 border-pm-border flex items-center justify-center p-4">
            <div className="w-full h-full bg-gradient-to-br from-pm-gold/20 to-pm-burgundy/20 rounded-pm-md flex items-center justify-center">
              <QrCode className="w-32 h-32 text-pm-burgundy" />
            </div>
          </div>
          <h3 className="text-pm-h3 mb-1">Samskruti Silks</h3>
          <p className="text-pm-small text-pm-text-secondary mb-4">petemart.in/shop/samskruti-silks</p>
          <div className="flex justify-center gap-2">
            <Button variant="default" size="sm"><Download className="w-4 h-4 mr-1" /> Download</Button>
            <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-1" /> Print</Button>
            <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-1" /> Share</Button>
          </div>
        </Card>

        {/* Options */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-pm-body font-semibold mb-4">QR Code Options</h2>
            <div className="space-y-4">
              <div>
                <label className="text-pm-small font-medium text-pm-text block mb-2">QR Code Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Store URL', 'WhatsApp', 'Product', 'Menu'].map((type) => (
                    <label key={type} className="flex items-center gap-2 p-3 rounded-pm-md border border-pm-border cursor-pointer hover:bg-muted transition-colors">
                      <input type="radio" name="qr-type" defaultChecked={type === 'Store URL'} className="text-pm-gold" />
                      <span className="text-pm-small">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-pm-small font-medium text-pm-text block mb-2">Size</label>
                <div className="flex gap-2">
                  {['Small', 'Medium', 'Large'].map((size) => (
                    <label key={size} className="flex items-center gap-2 p-2 rounded-pm-md border border-pm-border cursor-pointer hover:bg-muted">
                      <input type="radio" name="size" defaultChecked={size === 'Medium'} className="text-pm-gold" />
                      <span className="text-pm-tiny">{size}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-pm-small font-medium text-pm-text block mb-2">With Logo</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="text-pm-gold rounded" />
                  <span className="text-pm-small text-pm-text-secondary">Include PeteMart logo in center</span>
                </label>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-pm-cream">
            <h3 className="text-pm-body font-semibold mb-2">Usage Tips</h3>
            <ul className="space-y-2 text-pm-small text-pm-text-secondary">
              <li>• Print and display at your store counter</li>
              <li>• Share on WhatsApp and social media</li>
              <li>• Include in customer invoices and receipts</li>
              <li>• Add to product packaging for reorders</li>
            </ul>
          </Card>
        </div>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">
            Generate QR codes for your store, products, or WhatsApp contact. Download and print for in-store display.
          </p>
        </div>
      </section>
    </div>
  );
}
