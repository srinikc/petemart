'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Info, Store, Bell, Shield, CreditCard, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function MerchantSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-pm-h2">Settings</h1>
        <p className="text-pm-body text-pm-text-secondary">Manage your store settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Profile */}
        <Card className="p-5">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-pm-gold" /> Store Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-pm-small text-pm-text-secondary block mb-1">Store Name</label>
              <Input defaultValue="Samskruti Silks" />
            </div>
            <div>
              <label className="text-pm-small text-pm-text-secondary block mb-1">Store Description</label>
              <textarea
                className="w-full h-24 rounded-pm-md border border-pm-border p-3 text-pm-small resize-none"
                defaultValue="Premium silk sarees with 18 years of tradition."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-pm-small text-pm-text-secondary block mb-1">Opening Time</label>
                <Input type="time" defaultValue="10:00" />
              </div>
              <div>
                <label className="text-pm-small text-pm-text-secondary block mb-1">Closing Time</label>
                <Input type="time" defaultValue="20:00" />
              </div>
            </div>
            <Button variant="default" size="sm" onClick={() => toast.success('Store profile updated!')}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>
        </Card>

        {/* Interaction Modes */}
        <Card className="p-5">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-pm-gold" /> Interaction Modes
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Buy Now (Direct Purchase)', enabled: true, desc: 'Requires bank account for settlement' },
              { label: 'Enquire on WhatsApp', enabled: true, desc: 'Requires WhatsApp Business number' },
              { label: 'Visit Store (Store Visit)', enabled: true, desc: 'Requires store address + photos' },
            ].map((mode) => (
              <div key={mode.label} className="flex items-center justify-between p-3 bg-pm-cream rounded-pm-md border border-pm-border">
                <div>
                  <p className="text-pm-small font-medium">{mode.label}</p>
                  <p className="text-pm-tiny text-pm-text-secondary">{mode.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={mode.enabled} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-pm-gold after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-5">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-pm-gold" /> Notifications
          </h2>
          <div className="space-y-3">
            {[
              { label: 'New Orders', enabled: true },
              { label: 'Order Status Updates', enabled: true },
              { label: 'Customer Enquiries', enabled: true },
              { label: 'Weekly Reports', enabled: false },
              { label: 'Promotional Alerts', enabled: false },
            ].map((notif) => (
              <div key={notif.label} className="flex items-center justify-between py-2">
                <span className="text-pm-small">{notif.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={notif.enabled} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-pm-gold after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
        </Card>

        {/* Payment Info */}
        <Card className="p-5">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-pm-gold" /> Bank Details (Settlements)
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-pm-small text-pm-text-secondary block mb-1">Account Holder Name</label>
              <Input defaultValue="Samskruti Silks" />
            </div>
            <div>
              <label className="text-pm-small text-pm-text-secondary block mb-1">Account Number</label>
              <Input type="password" defaultValue="XXXXXXXXXXXX" />
            </div>
            <div>
              <label className="text-pm-small text-pm-text-secondary block mb-1">IFSC Code</label>
              <Input defaultValue="SBIN0001234" />
            </div>
            <div className="bg-pm-cream rounded-pm-md p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-pm-gold shrink-0 mt-0.5" />
              <p className="text-pm-tiny text-pm-text-secondary">Payments settled via Razorpay automatically every T+3 days</p>
            </div>
            <Button variant="default" size="sm" onClick={() => toast.success('Bank details updated!')}>
              <Save className="w-4 h-4 mr-1" /> Update
            </Button>
          </div>
        </Card>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">
            Manage your store profile, interaction modes, notification preferences, and payment settlement details.
          </p>
        </div>
      </section>
    </div>
  );
}
