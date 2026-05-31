'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MERCHANTS } from '@/lib/data';
import { getInitials } from '@/lib/utils';
import { CheckCircle, XCircle, FileText, Info, Store, Eye } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function MerchantApprovals() {
  const pendingMerchants = MERCHANTS.filter(m => m.status === 'pending');

  const handleApprove = (name: string) => {
    toast.success(`${name} has been approved!`);
  };

  const handleReject = (name: string) => {
    toast.error(`${name} has been rejected.`);
  };

  return (
    <div className="section-container py-8">
      <h1 className="text-pm-h2 mb-2">Merchant Approvals</h1>
      <p className="text-pm-body text-pm-text-secondary mb-8">{pendingMerchants.length} merchants pending review</p>

      {pendingMerchants.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-pm-h3 mb-2">All Clear!</h2>
          <p className="text-pm-body text-pm-text-secondary">No pending merchant approvals.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingMerchants.map((merchant) => (
            <Card key={merchant.id} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-16 h-16 rounded-pm-xl">
                  <AvatarFallback className="bg-pm-gold/10 text-pm-gold text-xl rounded-pm-xl">{getInitials(merchant.store_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-pm-h3 text-pm-text">{merchant.store_name}</h3>
                  <Badge variant="outline" className="mt-1">{merchant.category}</Badge>
                  <p className="text-pm-small text-pm-text-secondary mt-2">{merchant.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-pm-small">
                <div><span className="text-pm-text-secondary">Digital Readiness:</span><p>{merchant.digital_readiness || 'Unknown'}</p></div>
                <div><span className="text-pm-text-secondary">Rating:</span><p>{merchant.rating} / 5</p></div>
                <div><span className="text-pm-text-secondary">Modes:</span><p>{merchant.modes_enabled.join(', ')}</p></div>
                <div><span className="text-pm-text-secondary">Distance:</span><p>{merchant.distance} km</p></div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-pm-gold" />
                <span className="text-pm-tiny text-pm-text-secondary">3 documents uploaded</span>
              </div>

              <div className="flex gap-2">
                <Button variant="default" size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(merchant.store_name)}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReject(merchant.store_name)}>
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button variant="outline" size="sm" className="w-10 h-10 p-0"><Eye className="w-4 h-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <section className="bg-pm-cream border border-pm-border rounded-pm-lg p-4 mt-8">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-pm-gold shrink-0" />
          <p className="text-pm-small text-pm-text-secondary">Review merchant applications. Check their details, documents, and digital readiness before approving or rejecting.</p>
        </div>
      </section>
    </div>
  );
}
