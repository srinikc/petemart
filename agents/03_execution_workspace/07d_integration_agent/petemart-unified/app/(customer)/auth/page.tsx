'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Phone, Smartphone, Shield, ArrowLeft, CheckCircle2, User, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { UserRole } from '@/types';

type AuthMode = 'login' | 'signup';
type LoginTab = 'email' | 'phone';
type SignupContact = 'email' | 'phone';

// ── Client-side validation helpers ────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^\d{10}$/.test(phone);
}

// ── Help text shown on the auth screen ────────────────────────────────────────
const HELP_TEXT = {
  emailLogin: 'Sign in with your registered email and password to access your account.',
  phoneLogin: 'Enter your 10-digit mobile number. We\'ll send a one-time password (OTP) to verify your identity.',
  otpVerify: 'Enter the 6-digit code sent to your phone. The code expires in 5 minutes.',
  signup: 'Create a new account. Choose between email or phone registration. Merchants can sign up and will be activated after verification.',
  roleSelect: 'Select your account type. Customers can browse and shop. Merchants can list products and manage orders.',
};

export default function AuthPage() {
  const router = useRouter();
  const { signInWithEmail, signInWithPhone, verifyOtp, signUp, user, isAuthenticated, role, loading: authLoading } = useAuth();

  // ── Auth mode: login vs signup ─────────────────────────────────────────────
  const [mode, setMode] = useState<AuthMode>('login');

  // ── Login tab: email vs phone ──────────────────────────────────────────────
  const [loginTab, setLoginTab] = useState<LoginTab>('email');

  // ── Email login fields ─────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── Phone login fields ─────────────────────────────────────────────────────
  const [phone, setPhone] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  // ── Signup fields ──────────────────────────────────────────────────────────
  const [signupContact, setSignupContact] = useState<SignupContact>('email');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('customer');

  // ── Shared loading state ───────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  // ── If already authenticated, redirect immediately ─────────────────────────
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      performRedirect(role || 'customer');
    }
  }, [authLoading, isAuthenticated, user, role]);

  function performRedirect(userRole: UserRole) {
    switch (userRole) {
      case 'merchant':
        router.push('/merchant/dashboard');
        break;
      case 'admin':
        router.push('/admin');
        break;
      default:
        // Default to home for customers, delivery_partner, or unknown roles
        router.push('/');
        break;
    }
  }

  // ── Email Login Handler ────────────────────────────────────────────────────
  const handleEmailLogin = useCallback(async () => {
    // Validate
    if (!loginEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!isValidEmail(loginEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!loginPassword) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    const result = await signInWithEmail(loginEmail.trim(), loginPassword);
    setLoading(false);

    if (result.success && result.role) {
      toast.success('Welcome back!');
      performRedirect(result.role);
    } else {
      toast.error(result.error || 'Login failed. Please check your credentials.');
    }
  }, [loginEmail, loginPassword, signInWithEmail]);

  // ── Phone OTP Send Handler ─────────────────────────────────────────────────
  const handleSendOtp = useCallback(async () => {
    if (!isValidPhone(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    const result = await signInWithPhone(phone);
    setLoading(false);

    if (result.success) {
      setOtpStep(true);
      setOtp(['', '', '', '', '', '']);
      toast.success('OTP sent to +91-' + phone);
      // Focus first OTP input after short delay
      setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
    } else {
      toast.error(result.error || 'Failed to send OTP. Please try again.');
    }
  }, [phone, signInWithPhone]);

  // ── OTP Verify Handler ─────────────────────────────────────────────────────
  const handleVerifyOtp = useCallback(async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    const result = await verifyOtp(phone, code);
    setLoading(false);

    if (result.success && result.role) {
      toast.success('Welcome to PeteMart!');
      performRedirect(result.role);
    } else {
      toast.error(result.error || 'Invalid OTP. Please try again.');
    }
  }, [otp, phone, verifyOtp]);

  // ── OTP Input Handlers ─────────────────────────────────────────────────────
  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }, [otp]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  }, [otp]);

  const handleResendOtp = useCallback(async () => {
    setLoading(true);
    const result = await signInWithPhone(phone);
    setLoading(false);
    if (result.success) {
      toast.success('OTP resent to +91-' + phone);
    } else {
      toast.error(result.error || 'Failed to resend OTP');
    }
  }, [phone, signInWithPhone]);

  // ── Sign Up Handler ────────────────────────────────────────────────────────
  const handleSignUp = useCallback(async () => {
    // Validate
    if (!signupName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (signupContact === 'email') {
      if (!isValidEmail(signupEmail.trim())) {
        toast.error('Please enter a valid email address');
        return;
      }
      if (!signupPassword || signupPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    } else {
      if (!isValidPhone(signupPhone)) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }
    }

    setLoading(true);
    const payload: {
      email?: string;
      phone?: string;
      password?: string;
      name: string;
      role?: UserRole;
    } = {
      name: signupName.trim(),
      role: signupRole,
    };

    if (signupContact === 'email') {
      payload.email = signupEmail.trim();
      payload.password = signupPassword;
    } else {
      payload.phone = signupPhone;
    }

    const result = await signUp(payload);
    setLoading(false);

    if (result.success && result.role) {
      toast.success(
        result.role === 'merchant'
          ? 'Merchant account created! Redirecting to your dashboard.'
          : 'Account created successfully! Welcome to PeteMart.'
      );
      performRedirect(result.role);
    } else {
      toast.error(result.error || 'Sign up failed. Please try again.');
    }
  }, [signupName, signupContact, signupEmail, signupPhone, signupPassword, signupRole, signUp]);

  // ── Reset to phone step when switching tabs ────────────────────────────────
  const handleTabChange = useCallback((tab: string) => {
    setLoginTab(tab as LoginTab);
    setOtpStep(false);
    setOtp(['', '', '', '', '', '']);
  }, []);

  // ── Shared input handlers ───────────────────────────────────────────────────
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
  }, []);

  const handleSignupPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
  }, []);

  // ── If auth is loading, show minimal loading state ─────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pm-cream via-white to-pm-cream">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-pm-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-pm-body text-pm-text-secondary">Loading...</span>
        </div>
      </div>
    );
  }

  // ── If already authenticated, don't render the form ────────────────────────
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pm-cream via-white to-pm-cream">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-pm-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-pm-body text-pm-text-secondary">Redirecting...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pm-cream via-white to-pm-cream py-12 px-4">
      <div className="w-full max-w-md">
        {/* ── Brand Header ────────────────────────────────────────────────── */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-pm-lg bg-pm-gold flex items-center justify-center">
              <span className="text-white font-bold text-lg">PM</span>
            </div>
            <span className="text-2xl font-bold text-pm-burgundy">
              Pete<span className="text-pm-gold">Mart</span>
            </span>
          </Link>
        </div>

        {/* ── Main Auth Card ──────────────────────────────────────────────── */}
        <Card className="border-pm-border shadow-pm-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-pm-h3">
              {mode === 'login' ? 'Welcome to PeteMart' : 'Create Your Account'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Login with email or phone to continue'
                : 'Join PeteMart to shop from local markets'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {/* ── LOGIN MODE ──────────────────────────────────────────────── */}
            {mode === 'login' && (
              <div className="space-y-5">
                {/* Login Tabs: Email | Phone */}
                <Tabs value={loginTab} onValueChange={handleTabChange}>
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="email" className="flex-1">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="phone" className="flex-1">
                      <Phone className="w-4 h-4 mr-2" />
                      Phone
                    </TabsTrigger>
                  </TabsList>

                  {/* ── EMAIL LOGIN ────────────────────────────────────────── */}
                  <TabsContent value="email" className="space-y-4">
                    {/* Help text */}
                    <div className="bg-blue-50 border border-blue-100 rounded-pm-md p-3">
                      <p className="text-pm-tiny text-blue-700 flex items-start gap-2">
                        <Mail className="w-4 h-4 shrink-0 mt-0.5" />
                        {HELP_TEXT.emailLogin}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-pm-small font-medium text-pm-text">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10 h-12"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-pm-small font-medium text-pm-text">Password</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="pr-10 h-12"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-pm-text-secondary hover:text-pm-text"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      variant="default"
                      size="lg"
                      className="w-full h-12"
                      onClick={handleEmailLogin}
                      disabled={loading || !loginEmail.trim() || !loginPassword}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Signing In...
                        </span>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </TabsContent>

                  {/* ── PHONE LOGIN ─────────────────────────────────────────── */}
                  <TabsContent value="phone" className="space-y-4">
                    {!otpStep ? (
                      <>
                        {/* Help text */}
                        <div className="bg-blue-50 border border-blue-100 rounded-pm-md p-3">
                          <p className="text-pm-tiny text-blue-700 flex items-start gap-2">
                            <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
                            {HELP_TEXT.phoneLogin}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-pm-small font-medium text-pm-text">Phone Number</label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 border-r border-pm-border pr-2">
                              <Phone className="w-4 h-4 text-pm-text-secondary" />
                              <span className="text-pm-small text-pm-text-secondary">+91</span>
                            </div>
                            <Input
                              type="tel"
                              inputMode="numeric"
                              placeholder="Enter 10-digit phone number"
                              className="pl-20 h-12 text-lg"
                              value={phone}
                              onChange={handlePhoneChange}
                              maxLength={10}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                              autoComplete="tel"
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
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Sending OTP...
                            </span>
                          ) : (
                            'Send OTP'
                          )}
                        </Button>
                      </>
                    ) : (
                      /* ── OTP VERIFICATION SCREEN ──────────────────────────── */
                      <div className="space-y-5">
                        {/* Help text */}
                        <div className="text-center py-1">
                          <CheckCircle2 className="w-12 h-12 text-pm-gold mx-auto mb-2" />
                          <p className="text-pm-small text-pm-text-secondary">
                            Enter the 6-digit code sent to <strong>+91-{phone}</strong>
                          </p>
                          <div className="bg-blue-50 border border-blue-100 rounded-pm-md p-2 mt-2">
                            <p className="text-pm-tiny text-blue-700 flex items-start gap-2">
                              <Shield className="w-3 h-3 shrink-0 mt-0.5" />
                              {HELP_TEXT.otpVerify}
                            </p>
                          </div>
                        </div>

                        {/* OTP Input Boxes */}
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
                              autoComplete="one-time-code"
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
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Verifying...
                            </span>
                          ) : (
                            'Verify & Login'
                          )}
                        </Button>

                        {/* Bottom controls: Change Number | Resend OTP */}
                        <div className="flex justify-between items-center">
                          <button
                            onClick={() => {
                              setOtpStep(false);
                              setOtp(['', '', '', '', '', '']);
                            }}
                            className="text-pm-small text-pm-text-secondary hover:text-pm-gold flex items-center gap-1 transition-colors"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            Change Number
                          </button>
                          <button
                            onClick={handleResendOtp}
                            disabled={loading}
                            className="text-pm-small text-pm-gold hover:text-pm-gold-dark font-medium transition-colors disabled:opacity-50"
                          >
                            Resend OTP
                          </button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* ── Security Notice ──────────────────────────────────────── */}
                <div className="flex items-center justify-center gap-2 text-pm-tiny text-pm-text-secondary">
                  <Shield className="w-3 h-3" />
                  <span>Your data is secured with encryption</span>
                </div>

                {/* ── Sign Up Toggle ────────────────────────────────────────── */}
                <div className="text-center border-t border-pm-border pt-4">
                  <p className="text-pm-small text-pm-text-secondary">
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => {
                        setMode('signup');
                        setOtpStep(false);
                        setOtp(['', '', '', '', '', '']);
                      }}
                      className="text-pm-gold hover:text-pm-gold-dark font-medium transition-colors"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ── SIGNUP MODE ──────────────────────────────────────────────── */}
            {mode === 'signup' && (
              <div className="space-y-4">
                {/* Help text */}
                <div className="bg-blue-50 border border-blue-100 rounded-pm-md p-3">
                  <p className="text-pm-tiny text-blue-700 flex items-start gap-2">
                    <User className="w-4 h-4 shrink-0 mt-0.5" />
                    {HELP_TEXT.signup}
                  </p>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-pm-small font-medium text-pm-text">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      className="pl-10 h-12"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Contact Method Toggle */}
                <div className="space-y-2">
                  <label className="text-pm-small font-medium text-pm-text">Contact Method</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSignupContact('email')}
                      className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-pm-md border text-sm font-medium transition-all ${
                        signupContact === 'email'
                          ? 'border-pm-gold bg-pm-gold/5 text-pm-text shadow-sm'
                          : 'border-pm-border text-pm-text-secondary hover:border-pm-gold/50'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupContact('phone')}
                      className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-pm-md border text-sm font-medium transition-all ${
                        signupContact === 'phone'
                          ? 'border-pm-gold bg-pm-gold/5 text-pm-text shadow-sm'
                          : 'border-pm-border text-pm-text-secondary hover:border-pm-gold/50'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      Phone
                    </button>
                  </div>
                </div>

                {/* Email Field */}
                {signupContact === 'email' && (
                  <div className="space-y-2">
                    <label className="text-pm-small font-medium text-pm-text">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pm-text-secondary" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 h-12"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                )}

                {/* Password Field (only for email signup) */}
                {signupContact === 'email' && (
                  <div className="space-y-2">
                    <label className="text-pm-small font-medium text-pm-text">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        className="pr-10 h-12"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-pm-text-secondary hover:text-pm-text"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-pm-tiny text-pm-text-secondary">Minimum 6 characters</p>
                  </div>
                )}

                {/* Phone Field */}
                {signupContact === 'phone' && (
                  <div className="space-y-2">
                    <label className="text-pm-small font-medium text-pm-text">Phone Number</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 border-r border-pm-border pr-2">
                        <Phone className="w-4 h-4 text-pm-text-secondary" />
                        <span className="text-pm-small text-pm-text-secondary">+91</span>
                      </div>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        placeholder="Enter 10-digit phone number"
                        className="pl-20 h-12 text-lg"
                        value={signupPhone}
                        onChange={handleSignupPhoneChange}
                        maxLength={10}
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                )}

                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="text-pm-small font-medium text-pm-text">Account Type</label>
                  <div className="bg-blue-50 border border-blue-100 rounded-pm-md p-2 mb-1">
                    <p className="text-pm-tiny text-blue-700 flex items-start gap-2">
                      <Shield className="w-3 h-3 shrink-0 mt-0.5" />
                      {HELP_TEXT.roleSelect}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSignupRole('customer')}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 h-16 rounded-pm-md border text-sm font-medium transition-all ${
                        signupRole === 'customer'
                          ? 'border-pm-gold bg-pm-gold/5 text-pm-text shadow-sm'
                          : 'border-pm-border text-pm-text-secondary hover:border-pm-gold/50'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span>Customer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignupRole('merchant')}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 h-16 rounded-pm-md border text-sm font-medium transition-all ${
                        signupRole === 'merchant'
                          ? 'border-pm-gold bg-pm-gold/5 text-pm-text shadow-sm'
                          : 'border-pm-border text-pm-text-secondary hover:border-pm-gold/50'
                      }`}
                    >
                      <Store className="w-5 h-5" />
                      <span>Merchant</span>
                    </button>
                  </div>
                  <p className="text-pm-tiny text-pm-text-secondary">
                    {signupRole === 'customer'
                      ? 'Browse products, place orders, and track deliveries.'
                      : 'List your products, manage orders, and grow your business.'}
                  </p>
                </div>

                {/* Create Account Button */}
                <Button
                  variant="default"
                  size="lg"
                  className="w-full h-12"
                  onClick={handleSignUp}
                  disabled={loading || !signupName.trim() || (signupContact === 'email' && (!signupEmail.trim() || signupPassword.length < 6)) || (signupContact === 'phone' && signupPhone.length !== 10)}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </Button>

                {/* ── Sign In Toggle ────────────────────────────────────────── */}
                <div className="text-center border-t border-pm-border pt-4">
                  <p className="text-pm-small text-pm-text-secondary">
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('login')}
                      className="text-pm-gold hover:text-pm-gold-dark font-medium transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <p className="text-center text-pm-tiny text-pm-text-secondary mt-6">
          By continuing, you agree to PeteMart&apos;s{' '}
          <Link href="/terms" className="text-pm-gold hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-pm-gold hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

// ── Inline Store icon (not in lucide-react by default) ────────────────────────
function Store({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
