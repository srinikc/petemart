'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Info, Save, ToggleLeft, Settings, MapPin, Percent, Flag } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminConfigPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-pm-h2 text-white">System Configuration</h1>
        <p className="text-pm-body text-gray-400">Manage platform settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Zones */}
        <Card className="p-5 bg-gray-800 border-gray-700">
          <h2 className="text-pm-body font-semibold text-white flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-pm-gold" /> Delivery Zones
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-pm-md border border-gray-700">
              <div>
                <p className="text-pm-small text-white">Zone 1 (0-3 km)</p>
                <p className="text-pm-tiny text-gray-400">Base: ₹50</p>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-400"><Settings className="w-4 h-4" /></Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-pm-md border border-gray-700">
              <div>
                <p className="text-pm-small text-white">Zone 2 (3-7 km)</p>
                <p className="text-pm-tiny text-gray-400">Base: ₹70</p>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-400"><Settings className="w-4 h-4" /></Button>
            </div>
            <Button variant="outline" size="sm" className="w-full border-gray-600 text-gray-300">+ Add Zone</Button>
          </div>
        </Card>

        {/* Commission Rates */}
        <Card className="p-5 bg-gray-800 border-gray-700">
          <h2 className="text-pm-body font-semibold text-white flex items-center gap-2 mb-4">
            <Percent className="w-5 h-5 text-pm-gold" /> Commission Rates
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-pm-md border border-gray-700">
              <div>
                <p className="text-pm-small text-white">B2C (Retail)</p>
                <p className="text-pm-tiny text-gray-400">Standard commission</p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" defaultValue={4} className="w-16 h-8 text-center bg-gray-800 border-gray-600 text-white" />
                <span className="text-pm-small text-gray-400">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-pm-md border border-gray-700">
              <div>
                <p className="text-pm-small text-white">B2B (Wholesale)</p>
                <p className="text-pm-tiny text-gray-400">Bulk order commission</p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" defaultValue={1.5} className="w-16 h-8 text-center bg-gray-800 border-gray-600 text-white" />
                <span className="text-pm-small text-gray-400">%</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Feature Flags */}
        <Card className="p-5 bg-gray-800 border-gray-700">
          <h2 className="text-pm-body font-semibold text-white flex items-center gap-2 mb-4">
            <Flag className="w-5 h-5 text-pm-gold" /> Feature Flags
          </h2>
          <div className="space-y-3">
            {[
              { name: 'Multi-Store Cart', enabled: true },
              { name: 'WhatsApp Enquiries', enabled: true },
              { name: 'Store Visit Mode', enabled: true },
              { name: 'B2B Wholesale', enabled: false },
              { name: 'AI Try-On', enabled: false },
              { name: 'Reviews & Ratings', enabled: false },
            ].map((feature) => (
              <div key={feature.name} className="flex items-center justify-between p-3 bg-gray-900 rounded-pm-md border border-gray-700">
                <span className="text-pm-small text-white">{feature.name}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={feature.enabled} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-600 rounded-full peer peer-checked:bg-pm-gold after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
        </Card>

        {/* General Settings */}
        <Card className="p-5 bg-gray-800 border-gray-700">
          <h2 className="text-pm-body font-semibold text-white flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-pm-gold" /> General Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-pm-small text-gray-400 block mb-1">Platform Name</label>
              <Input defaultValue="PeteMart" className="bg-gray-900 border-gray-700 text-white" />
            </div>
            <div>
              <label className="text-pm-small text-gray-400 block mb-1">Support Email</label>
              <Input defaultValue="support@petemart.in" className="bg-gray-900 border-gray-700 text-white" />
            </div>
            <div>
              <label className="text-pm-small text-gray-400 block mb-1">Max Delivery Radius (km)</label>
              <Input type="number" defaultValue={10} className="bg-gray-900 border-gray-700 text-white w-24" />
            </div>
            <Button variant="default" size="sm" onClick={() => toast.success('Settings saved!')}>
              <Save className="w-4 h-4 mr-1" /> Save Settings
            </Button>
          </div>
        </Card>
      </div>

      <section className="bg-gray-800 border border-gray-700 rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-gray-400">
            Configure platform-wide settings including delivery zones, commission rates, and feature flags.
          </p>
        </div>
      </section>
    </div>
  );
}
