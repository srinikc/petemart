'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Store, Bell, Shield, Info, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function MerchantSettings() {
  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="section-container py-8 max-w-2xl mx-auto">
      <h1 className="text-pm-h2 mb-6">Store Settings</h1>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4"><Store className="w-5 h-5 text-pm-gold" /> Store Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-pm-small font-medium">Store Name</label>
              <Input defaultValue="Samskruti Silks" className="mt-1" />
            </div>
            <div>
              <label className="text-pm-small font-medium">Description</label>
              <textarea className="w-full min-h-[80px] rounded-pm-md border border-pm-border bg-white px-3 py-2 text-sm mt-1" defaultValue="Premium silk sarees with 18 years of tradition." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-pm-small font-medium">Opening Time</label>
                <Input type="time" defaultValue="10:00" className="mt-1" />
              </div>
              <div>
                <label className="text-pm-small font-medium">Closing Time</label>
                <Input type="time" defaultValue="20:00" className="mt-1" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4"><Bell className="w-5 h-5 text-pm-gold" /> Notifications</h2>
          <div className="space-y-3">
            {['New order alerts', 'WhatsApp enquiry notifications', 'Daily sales summary', 'Low stock warnings'].map((item) => (
              <label key={item} className="flex items-center justify-between">
                <span className="text-pm-small">{item}</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-pm-body font-semibold flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-pm-gold" /> Account Security</h2>
          <div className="space-y-4">
            <div>
              <label className="text-pm-small font-medium">Change Password</label>
              <Input type="password" placeholder="Current password" className="mt-1 mb-2" />
              <Input type="password" placeholder="New password" className="mb-2" />
              <Input type="password" placeholder="Confirm new password" />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button variant="default" size="lg" onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Settings</Button>
        </div>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Manage your store settings, business hours, notification preferences, and account security.</p>
        </div>
      </section>
    </div>
  );
}
