'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Smartphone, Shield, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AuthPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const { signIn, verifyOtp } = useAuth();
  const router = useRouter();

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    const result = await signIn(phone);
    setLoading(false);
    if (result.success) {
      setStep('otp');
      toast.success('OTP sent to +91-' + phone);
    } else {
      toast.error(result.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }
    setLoading(true);
    const result = await verifyOtp(phone, code);
    setLoading(false);
    if (result.success) {
      toast.success('Welcome to PeteMart!');
      // Redirect based on role
      if (result.role === 'merchant') router.push('/merchant/dashboard');
      else if (result.role === 'admin') router.push('/admin');
      else router.push('/');
    } else {
      toast.error(result.error || 'Invalid OTP');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    // Auto-advance to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pm-cream via-white to-pm-cream py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-pm-lg bg-pm-gold flex items-center justify-center">
              <span className="text-white font-bold text-lg">PM</span>
            </div>
            <span className="text-2xl font-bold text-pm-burgundy">
              Pete<span className="text-pm-gold">Mart</span>
            </span>
          </Link>
        </div>

        <Card className="border-pm-border shadow-pm-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-pm-h3">
              {step === 'phone' ? 'Welcome to PeteMart' : 'Verify Phone'}
            </CardTitle>
            <CardDescription>
              {step === 'phone'
                ? 'Enter your phone number to get started'
                : `Enter the OTP sent to +91-${phone}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {step === 'phone' ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-pm-small font-medium text-pm-text">Phone Number</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 border-r border-pm-border pr-2">
                      <Phone className="w-4 h-4 text-pm-text-secondary" />
                      <span className="text-pm-small text-pm-text-secondary">+91</span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="Enter 10-digit phone number"
                      className="pl-20 h-12 text-lg"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  className="w-full h-12"
                  onClick={handleSendOtp}
                  disabled={loading || phone.length !== 10}
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>

                <div className="bg-pm-gold/5 rounded-pm-md p-4 border border-pm-gold/10">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-pm-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="text-pm-small font-medium text-pm-text mb-1">Demo Mode Active</p>
                      <p className="text-pm-tiny text-pm-text-secondary">
                        Use any demo number: <strong>9999999999</strong> (Customer), <strong>8888888888</strong> (Merchant), <strong>7777777777</strong> (Admin). OTP: <strong>123456</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-pm-tiny text-pm-text-secondary">
                  <Shield className="w-3 h-3" />
                  <span>Your data is secured with encryption</span>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="text-center py-2">
                  <CheckCircle2 className="w-12 h-12 text-pm-gold mx-auto mb-2" />
                  <p className="text-pm-small text-pm-text-secondary">
                    Enter the 6-digit code sent to your phone
                  </p>
                </div>

                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <Input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="w-12 h-14 text-center text-xl font-bold"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>

                <Button
                  variant="default"
                  size="lg"
                  className="w-full h-12"
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.join('').length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </Button>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}
                    className="text-pm-small text-pm-text-secondary hover:text-pm-gold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Change Number
                  </button>
                  <button
                    onClick={handleSendOtp}
                    className="text-pm-small text-pm-gold hover:text-pm-gold-dark font-medium"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-pm-tiny text-pm-text-secondary mt-6">
          By continuing, you agree to PeteMart&apos;s Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
