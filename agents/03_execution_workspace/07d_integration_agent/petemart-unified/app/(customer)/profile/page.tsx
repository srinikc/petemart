'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, formatDate } from '@/lib/utils';
import { User, Package, MapPin, LogOut, Settings, ChevronRight, Info, Store, Shield } from 'lucide-react';
import { ADDRESSES } from '@/lib/data';

export default function ProfilePage() {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="section-container py-20 text-center">
        <User className="w-20 h-20 text-pm-text-secondary/30 mx-auto mb-4" />
        <h1 className="text-pm-h2 mb-2">Please Log In</h1>
        <p className="text-pm-body text-pm-text-secondary mb-6">You need to be logged in to view your profile.</p>
        <Link href="/auth"><Button variant="default" size="lg">Login / Register</Button></Link>
      </div>
    );
  }

  return (
    <div className="section-container py-8">
      <h1 className="text-pm-h2 mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* User Info Card */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-pm-gold/10 text-pm-gold text-xl">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-pm-h3 text-pm-text">{user.name}</h2>
                <p className="text-pm-small text-pm-text-secondary">+91 {user.phone}</p>
                <Badge variant="default" className="mt-1 capitalize">{user.role}</Badge>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4 text-pm-small">
              <div><span className="text-pm-text-secondary">User ID</span><p className="font-medium">{user.id}</p></div>
              <div><span className="text-pm-text-secondary">Member Since</span><p className="font-medium">{formatDate(user.created_at)}</p></div>
            </div>
          </Card>

          {/* Saved Addresses */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-pm-body font-semibold flex items-center gap-2"><MapPin className="w-5 h-5 text-pm-gold" /> Saved Addresses</h2>
              <Button variant="outline" size="sm">+ Add New</Button>
            </div>
            <div className="space-y-3">
              {ADDRESSES.map((addr) => (
                <div key={addr.id} className="p-4 rounded-pm-md border border-pm-border hover:border-pm-gold/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-pm-small font-medium">{addr.name}</p>
                    {addr.is_default && <Badge variant="default" className="text-[10px]">Default</Badge>}
                  </div>
                  <p className="text-pm-tiny text-pm-text-secondary">
                    {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city} - {addr.pincode}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-pm-body font-semibold mb-4">Quick Links</h2>
            <div className="space-y-1">
              <Link href="/orders" className="flex items-center justify-between p-3 rounded-pm-md hover:bg-muted transition-colors">
                <span className="flex items-center gap-3 text-pm-small"><Package className="w-4 h-4 text-pm-gold" /> My Orders</span>
                <ChevronRight className="w-4 h-4 text-pm-text-secondary" />
              </Link>
              <Link href="/merchant/dashboard" className="flex items-center justify-between p-3 rounded-pm-md hover:bg-muted transition-colors">
                <span className="flex items-center gap-3 text-pm-small"><Store className="w-4 h-4 text-pm-gold" /> Merchant Dashboard</span>
                <ChevronRight className="w-4 h-4 text-pm-text-secondary" />
              </Link>
              <Link href="/profile" className="flex items-center justify-between p-3 rounded-pm-md hover:bg-muted transition-colors">
                <span className="flex items-center gap-3 text-pm-small"><Settings className="w-4 h-4 text-pm-gold" /> Settings</span>
                <ChevronRight className="w-4 h-4 text-pm-text-secondary" />
              </Link>
            </div>
          </Card>

          <Card className="p-5 bg-pm-cream">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-pm-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-pm-small font-medium">Privacy & Security</p>
                <p className="text-pm-tiny text-pm-text-secondary">Your data is encrypted and secured. We never share your information without consent.</p>
              </div>
            </div>
          </Card>

          <Button variant="destructive" size="lg" className="w-full" onClick={signOut}>
            <LogOut className="w-5 h-5 mr-2" /> Logout
          </Button>
        </div>
      </div>

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Manage your profile, saved addresses, and account settings. Your personal information is kept secure and private.</p>
        </div>
      </section>
    </div>
  );
}
