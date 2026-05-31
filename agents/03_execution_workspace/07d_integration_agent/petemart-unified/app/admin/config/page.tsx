'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, DollarSign, MapPin, ToggleLeft, Info, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminConfig() {
  const handleSave = () => {
    toast.success('Configuration saved successfully');
  };

  return (
    <div className="section-container py-8 max-w-2xl mx-auto">
      <h1 className="text-pm-h2 mb-6">System Configuration</h1>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4"><DollarSign className="w-5 h-5 text-pm-gold" /> Commission & Pricing</h2>
          <div className="space-y-4">
            <div>
              <label className="text-pm-small font-medium">Default Commission Rate (%)</label>
              <Input type="number" defaultValue={5} className="mt-1 max-w-[200px]" />
              <p className="text-pm-tiny text-pm-text-secondary mt-1">Percentage charged on each transaction</p>
            </div>
            <div>
              <label className="text-pm-small font-medium">Platform Fee (%)</label>
              <Input type="number" defaultValue={2} className="mt-1 max-w-[200px]" />
            </div>
            <div>
              <label className="text-pm-small font-medium">Minimum Delivery Fee (₹)</label>
              <Input type="number" defaultValue={15} className="mt-1 max-w-[200px]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-pm-gold" /> Delivery Zones</h2>
          <div className="space-y-3">
            {[
              { zone: 'Zone 1 (0-3 km)', fee: 50, time: '30 min' },
              { zone: 'Zone 2 (3-7 km)', fee: 70, time: '60 min' },
              { zone: 'Zone 3 (7-10 km)', fee: 100, time: '90 min' },
            ].map((zone) => (
              <div key={zone.zone} className="flex items-center justify-between p-3 rounded-pm-md border border-pm-border">
                <div>
                  <p className="text-pm-small font-medium">{zone.zone}</p>
                  <p className="text-pm-tiny text-pm-text-secondary">Est. {zone.time}</p>
                </div>
                <Input type="number" defaultValue={zone.fee} className="w-20 text-right" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4"><ToggleLeft className="w-5 h-5 text-pm-gold" /> Feature Flags</h2>
          <div className="space-y-3">
            {[
              { name: 'Multi-Merchant Checkout', key: 'multi_merchant', enabled: true },
              { name: 'WhatsApp Integration', key: 'whatsapp', enabled: true },
              { name: 'Cash on Delivery', key: 'cod', enabled: false },
              { name: 'International Payments', key: 'international', enabled: false },
            ].map((feature) => (
              <div key={feature.key} className="flex items-center justify-between py-2">
                <span className="text-pm-small">{feature.name}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked={feature.enabled} />
                  <div className="w-9 h-5 bg-pm-border rounded-full peer peer-checked:bg-pm-gold after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button variant="default" size="lg" onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Configuration</Button>
        </div>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Configure platform settings including commission rates, delivery fees, delivery zones, and feature flags.</p>
        </div>
      </section>
    </div>
  );
}
