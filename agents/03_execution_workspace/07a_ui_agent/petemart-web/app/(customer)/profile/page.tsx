'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ADDRESSES } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';
import {
  User, Phone, Mail, MapPin, Plus, Info, Edit2, Shield, ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="section-container py-20 text-center">
        <h1 className="text-pm-h2 mb-4">Please Login</h1>
        <p className="text-pm-body text-pm-text-secondary mb-6">Login to view your profile</p>
        <a href="/auth"><Button variant="default">Login / Register</Button></a>
      </div>
    );
  }

  return (
    <div className="section-container py-8">
      <h1 className="text-pm-h2 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="space-y-6">
          <Card className="p-6 text-center">
            <Avatar className="w-20 h-20 mx-auto mb-4">
              <AvatarFallback className="bg-pm-gold text-white text-2xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-pm-h3 mb-1">{user.name}</h2>
            <Badge variant="default" className="mb-3">{user.role}</Badge>
            <p className="text-pm-small text-pm-text-secondary">{user.phone}</p>
          </Card>

          <Card className="p-5">
            <h3 className="text-pm-body font-semibold mb-3">Quick Links</h3>
            <div className="space-y-2">
              {[
                { label: 'My Orders', icon: '📦', href: '/orders' },
                { label: 'Saved Addresses', icon: '📍', href: '#' },
                { label: 'Payment Methods', icon: '💳', href: '#' },
                { label: 'Privacy Settings', icon: '🔒', href: '#' },
              ].map((link) => (
                <a key={link.label} href={link.href} className="flex items-center justify-between p-3 rounded-pm-md hover:bg-muted transition-colors">
                  <span className="text-pm-small text-pm-text">
                    {link.icon} {link.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-pm-text-secondary" />
                </a>
              ))}
            </div>
          </Card>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-pm-body font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-pm-gold" /> Personal Information
              </h2>
              <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4 mr-1" /> Edit</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-pm-tiny text-pm-text-secondary">Full Name</label>
                <div className="flex items-center gap-2 p-3 bg-pm-cream rounded-pm-md border border-pm-border">
                  <User className="w-4 h-4 text-pm-text-secondary" />
                  <span className="text-pm-body">{user.name}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-pm-tiny text-pm-text-secondary">Phone</label>
                <div className="flex items-center gap-2 p-3 bg-pm-cream rounded-pm-md border border-pm-border">
                  <Phone className="w-4 h-4 text-pm-text-secondary" />
                  <span className="text-pm-body">{user.phone}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-pm-tiny text-pm-text-secondary">Email</label>
                <div className="flex items-center gap-2 p-3 bg-pm-cream rounded-pm-md border border-pm-border">
                  <Mail className="w-4 h-4 text-pm-text-secondary" />
                  <span className="text-pm-body text-pm-text-secondary">Not provided</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-pm-tiny text-pm-text-secondary">Account Type</label>
                <div className="flex items-center gap-2 p-3 bg-pm-cream rounded-pm-md border border-pm-border">
                  <Shield className="w-4 h-4 text-pm-text-secondary" />
                  <span className="text-pm-body capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Saved Addresses */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-pm-body font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-pm-gold" /> Saved Addresses
              </h2>
              <Button variant="ghost" size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
            <div className="space-y-3">
              {ADDRESSES.map((addr) => (
                <div key={addr.id} className="flex items-start gap-3 p-4 bg-pm-cream rounded-pm-md border border-pm-border">
                  <MapPin className="w-5 h-5 text-pm-gold shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-pm-body font-medium">{addr.name}</span>
                      {addr.is_default && <Badge variant="default" className="text-[10px]">Default</Badge>}
                    </div>
                    <p className="text-pm-small text-pm-text-secondary">{addr.line1}</p>
                    <p className="text-pm-small text-pm-text-secondary">{addr.city} - {addr.pincode}</p>
                  </div>
                  <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Help Banner */}
      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">
            Manage your profile information and saved addresses. Your data is secured with encryption.
          </p>
        </div>
      </section>
    </div>
  );
}
