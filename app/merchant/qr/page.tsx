'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Info, QrCode } from 'lucide-react';

export default function MerchantQR() {
  const [qrSize, setQrSize] = useState(200);

  return (
    <div className="section-container py-8">
      <h1 className="text-pm-h2 mb-2">QR Code</h1>
      <p className="text-pm-body text-pm-text-secondary mb-8">Generate and download your store QR code for in-store promotion</p>

      <div className="max-w-md mx-auto">
        <Card className="p-8 text-center">
          {/* QR Code Placeholder */}
          <div className="w-48 h-48 mx-auto mb-6 bg-white border-2 border-pm-border rounded-pm-lg flex items-center justify-center">
            <QrCode className="w-32 h-32 text-pm-gold" />
          </div>

          <h2 className="text-pm-h3 mb-1">Samskruti Silks</h2>
          <p className="text-pm-small text-pm-text-secondary mb-6">Scan to visit store on PeteMart</p>

          <div className="flex flex-col gap-3">
            <Button variant="default" size="lg" className="w-full">
              <Download className="w-4 h-4 mr-2" /> Download QR Code
            </Button>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setQrSize(150)} className={qrSize === 150 ? 'border-pm-gold' : ''}>Small</Button>
              <Button variant="outline" size="sm" onClick={() => setQrSize(200)} className={qrSize === 200 ? 'border-pm-gold' : ''}>Medium</Button>
              <Button variant="outline" size="sm" onClick={() => setQrSize(300)} className={qrSize === 300 ? 'border-pm-gold' : ''}>Large</Button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-pm-cream rounded-pm-lg text-left">
            <h3 className="text-pm-small font-medium mb-2">💡 Tips</h3>
            <ul className="space-y-1 text-pm-tiny text-pm-text-secondary">
              <li>• Display at your store counter for customers to scan</li>
              <li>• Add to product packaging for reorders</li>
              <li>• Share on WhatsApp and social media</li>
            </ul>
          </div>
        </Card>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Generate a unique QR code for your store. Customers can scan it to visit your PeteMart storefront directly.</p>
        </div>
      </section>
    </div>
  );
}
