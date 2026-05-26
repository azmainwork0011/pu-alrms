'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { useAppStore } from '@/store/app';
import { authApi, apiFetch } from '@/lib/api';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight,
  UserPlus, AlertCircle, Loader2, ChevronLeft, Sparkles,
  Phone, Smartphone, Chrome, CheckCircle2, Shield, User, GraduationCap,
  Building2, Hash, BookOpen,
} from 'lucide-react';
import {
  getPasswordStrength, isValidEmail,
} from '@/components/pu-helpers';

// ─── Google Identity Services (GIS) Type Declarations ───────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: { isNotDisplayed?: boolean; isSkipped?: boolean; getNotDisplayedReason?: () => string; getSkippedReason?: () => string }) => void) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

// ─── Constants ─────────────────────────────────────────────────
const DEPARTMENTS = [
  { value: 'CSE', label: 'Computer Science & Engineering' },
  { value: 'EEE', label: 'Electrical & Electronic Engineering' },
  { value: 'BBA', label: 'Business Administration' },
  { value: 'LLB', label: 'Law (LLB)' },
];

const BATCHES = [
  { value: '2021', label: '2021' },
  { value: '2022', label: '2022' },
  { value: '2023', label: '2023' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
];

const DEPARTMENT_ICONS: Record<string, string> = {
  CSE: '🖥️',
  EEE: '⚡',
  BBA: '💼',
  LLB: '⚖️',
};

const SECTIONS_MAP: Record<string, string[]> = {
  CSE: ['Programming Fundamentals', 'Data Structures', 'Web Development', 'AI & ML'],
  EEE: ['Circuit Analysis', 'Power Systems', 'Electronics', 'Signal Processing'],
  BBA: ['Marketing', 'Finance', 'Management', 'Economics'],
  LLB: ['Constitutional Law', 'Criminal Law', 'Contract Law', 'International Law'],
};

// ─── Animated Background ──────────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Emerald orb - top-left */}
      <motion.div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }}
        animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Purple/violet orb - top-right */}
      <motion.div
        className="absolute -top-20 -right-20 w-[550px] h-[550px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)' }}
        animate={{ x: [0, -40, 0], y: [0, 50, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Orange/amber orb - bottom-left */}
      <motion.div
        className="absolute -bottom-20 -left-20 w-[480px] h-[480px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)' }}
        animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Blue/cyan orb - center-right */}
      <motion.div
        className="absolute top-1/3 -right-10 w-[520px] h-[520px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)' }}
        animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Second emerald orb - bottom-right */}
      <motion.div
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.03) 0%, transparent 70%)' }}
        animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
    </div>
  );
}

// ─── Network Error Detection ──────────────────────────────────
function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('Network request failed') ||
    msg.includes('net::ERR_') ||
    msg.includes('Aborted') ||
    msg.includes('timeout') ||
    msg.includes('ECONNREFUSED')
  );
}

// ─── Google Icon ──────────────────────────────────────────────
function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ─── Main Auth Page ───────────────────────────────────────────
type AuthMode = 'login-methods' | 'email-login' | 'email-register' | 'phone-otp' | 'phone-verify' | 'google-verify' | 'profile-setup';

interface PendingSetup {
  token: string;
  user: any;
  provider: 'GOOGLE' | 'PHONE' | 'EMAIL';
}

function AuthPage({ oauthError }: { oauthError?: string | null }) {
  const [mode, setMode] = useState<AuthMode>('login-methods');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(oauthError || null);

  // Email form state
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'STUDENT' });

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [phoneName, setPhoneName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Google state
  const [googleLoading, setGoogleLoading] = useState(false);
  const gisInitializedRef = useRef(false);
  const setAuthRef = useRef(setAuth);
  setAuthRef.current = setAuth;

  // Profile setup state
  const [pendingSetup, setPendingSetup] = useState<PendingSetup | null>(null);
  const [setupData, setSetupData] = useState({ name: '', rollNumber: '', batch: '', department: '', section: '' });

  const { setAuth, updateUser } = useAppStore();

  // Restore saved email & seed database
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('login-email');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
      }
    } catch { /* ignore */ }
    fetch('/api/auth/seed', { method: 'POST' }).catch(() => {});
  }, []);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  const pwStrength = getPasswordStrength(formData.password);

  const nameError = formData.name && !/^[a-zA-Z0-9\s\-'.]+$/.test(formData.name)
    ? 'Only letters, numbers, spaces, hyphens, and apostrophes allowed'
    : formData.name && formData.name.trim().length < 2
    ? 'Name must be at least 2 characters'
    : null;

  // ── Google Login via Google Identity Services (GIS) ──
  // Uses accounts.google.com/gsi/client for One Tap / popup sign-in.
  // The credential (JWT ID token) is sent to our backend for verification.

  const handleGoogleCredentialResponse = useCallback(async (response: { credential: string }) => {
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google login failed');

      setAuthRef.current(data.user, data.token);
      try { localStorage.removeItem('login-email'); } catch {}

      if (data.isNewUser) {
        toast.success('Welcome to PU-ALRMS! 🎓');
      } else {
        toast.success('Welcome back!');
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('ACCOUNT_EXISTS') || msg.includes('already exists')) {
        setError('এই ইমেইল দিয়ে আগেই একাউন্ট আছে। পাসওয়ার্ড দিয়ে লগইন করুন।');
      } else if (msg.includes('Banned') || msg.includes('banned')) {
        setError('এই একাউন্ট ব্যান করা হয়েছে। সাপোর্টে যোগাযোগ করুন।');
      } else if (msg.includes('Suspended')) {
        setError('এই একাউন্ট সাসপেন্ড করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।');
      } else if (msg.includes('not configured')) {
        setError('Google sign-in কনফিগার করা হয়নি।');
      } else {
        setError(msg || 'Google login failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  // Load and initialize Google Identity Services script
  useEffect(() => {
    if (typeof window === 'undefined' || gisInitializedRef.current) return;

    const handleGoogleCredentialRef = handleGoogleCredentialResponse;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: '642974329571-8hi6sk6qnrh2blj8ruqcumkbpjjvsbm4.apps.googleusercontent.com',
          callback: handleGoogleCredentialRef,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        gisInitializedRef.current = true;
      }
    };
    script.onerror = () => {
      console.error('[GIS] Failed to load Google Identity Services script.');
    };
    document.head.appendChild(script);

    return () => {
      // Only remove script if it was added by this effect
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, [handleGoogleCredentialResponse]);

  const handleGoogleLogin = useCallback(() => {
    if (googleLoading) return;
    setError(null);

    if (typeof window === 'undefined' || !window.google?.accounts?.id) {
      setError('Google sign-in is still loading. Please wait a moment and try again.');
      return;
    }

    if (!gisInitializedRef.current) {
      setError('Google sign-in is not ready yet. Please wait a moment and try again.');
      return;
    }

    setGoogleLoading(true);
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed || notification.isSkipped) {
        setGoogleLoading(false);
        // User cancelled or popup was blocked — not an error
        if (notification.getNotDisplayedReason?.() !== 'SUPPRESSED_BY_USER') {
          setError('Google popup was blocked. Please allow popups and try again.');
        }
      }
    });
  }, [googleLoading]);

  const handleAuthSuccess = useCallback((result: { user: any; token: string }) => {
    setAuth(result.user, result.token);
    try { localStorage.removeItem('login-email'); } catch { /* ignore */ }
    toast.success('Welcome to PU-ALRMS!');
  }, [setAuth]);

  // ── Email Login ──
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true); setError(null);
    try {
      const result = await authApi.login(formData.email, formData.password);
      handleAuthSuccess(result);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isNetworkError(err)) setError('Network error. Please check your internet connection.');
      else if (msg.includes('Invalid email or password')) setError('Invalid email or password. Please check your credentials.');
      else if (msg.includes('Email and password are required')) setError('Please enter both email and password.');
      else setError(msg || 'Authentication failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Email Register ──
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (nameError) { setError(nameError); return; }
    setLoading(true); setError(null);
    try {
      const result = await authApi.register(formData);
      handleAuthSuccess(result);
      toast.success('Account created successfully!');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isNetworkError(err)) setError('Network error. Please check your internet connection.');
      else if (msg.includes('Email already registered')) setError('This email is already registered. Try signing in instead.');
      else setError(msg || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };



  // ── Phone OTP Send ──
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || otpCooldown > 0) return;
    setLoading(true); setError(null);
    try {
      const result = await apiFetch<{ success: boolean; message: string; devOtp?: string; isNewUser?: boolean }>('/api/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone, name: phoneName || undefined }),
        timeout: 20000,
      });
      setOtpSent(true);
      setMode('phone-verify');
      setDevOtp(result.devOtp || null);
      toast.success(result.message);
      setOtpCooldown(60);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isNetworkError(err)) setError('Network error. Please check your internet connection.');
      else setError(msg || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Phone OTP Verify ──
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || otp.length !== 6) return;
    setLoading(true); setError(null);
    try {
      const result = await apiFetch<{ token: string; user: any; isNewUser?: boolean }>('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, name: phoneName || undefined }),
        timeout: 20000,
      });

      if (result.isNewUser) {
        setPendingSetup({ token: result.token, user: result.user, provider: 'PHONE' });
        setSetupData({ name: result.user.name !== 'New User' ? result.user.name : (phoneName || ''), rollNumber: '', batch: '', department: '', section: '' });
        setMode('profile-setup');
      } else {
        handleAuthSuccess(result);
        toast.success('Phone verified successfully!');
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isNetworkError(err)) setError('Network error. Please check your internet connection.');
      else setError(msg || 'OTP verification failed.');
    } finally { setLoading(false); }
  };

  // ── Resend OTP ──
  const handleResendOtp = async () => {
    if (otpCooldown > 0) return;
    setLoading(true);
    try {
      const result = await apiFetch<{ success: boolean; devOtp?: string }>('/api/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone }),
        timeout: 20000,
      });
      setDevOtp(result.devOtp || null);
      setOtp('');
      toast.success('New OTP sent!');
      setOtpCooldown(60);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP.');
    } finally { setLoading(false); }
  };

  // ── Profile Setup Submit ──
  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !pendingSetup) return;
    if (!setupData.batch || !setupData.department) {
      setError('Please select your batch and department.');
      return;
    }
    setLoading(true); setError(null);
    try {
      // Update profile via API
      const result = await apiFetch<{ user: any }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: setupData.name || pendingSetup.user.name,
          rollNumber: setupData.rollNumber,
          batch: setupData.batch,
          department: setupData.department,
          section: setupData.section || undefined,
        }),
        headers: { Authorization: `Bearer ${pendingSetup.token}` },
        timeout: 15000,
      });

      const updatedUser = { ...pendingSetup.user, ...result.user };
      handleAuthSuccess({ user: updatedUser, token: pendingSetup.token });
      toast.success('Profile setup complete! Welcome to PU-ALRMS! 🎓');
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to save profile. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Demo Login ──
  const quickDemoLogin = async () => {
    if (loading) return;
    setLoading(true); setError(null);
    try {
      const result = await authApi.login('alice@stu.pu.edu', 'student123');
      handleAuthSuccess(result);
    } catch (err: any) {
      setError('Demo login failed. Please try again.');
    } finally { setLoading(false); }
  };

  // ── Animation Variants ──
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
  };

  const slideIn = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  // ── Back Navigation ──
  const goBack = () => {
    setError(null);
    setOtp(''); setOtpSent(false);
    if (mode === 'profile-setup') setMode('login-methods');
    else if (mode === 'email-register' || mode === 'email-login') setMode('login-methods');
    else if (mode === 'phone-verify') setMode('phone-otp');
    else setMode('login-methods');
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          className="w-full max-w-md"
          initial="hidden"
          animate="visible"
        >
          {/* ─── Logo & Branding ─────────────────────────── */}
          <motion.div className="text-center mb-8" variants={fadeUp} custom={0}>
            <div className="relative inline-flex items-center justify-center mb-5">
              <motion.div
                className="absolute w-28 h-28 rounded-3xl"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)' }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10"
                style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.1)' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <img src="/logo.png" alt="PU-ALRMS" className="w-full h-full object-cover" />
              </motion.div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              PU-ALRMS
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">
              Prime University Academic Management System
            </p>
          </motion.div>

          {/* ─── Auth Card ──────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            custom={1}
            className="rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl"
            style={{ boxShadow: '0 24px 48px -12px rgba(0,0,0,0.4)' }}
          >
            <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="p-6 sm:p-8">

              {/* Step Progress Indicator */}
              <div className="flex items-center justify-center gap-1 mb-5">
                {(['login-methods', 'verify', 'profile-setup'] as const).map((step, i) => {
                  const stepModes: Record<number, string[]> = {
                    0: ['login-methods'],
                    1: ['phone-otp', 'phone-verify', 'email-login', 'email-register', 'google-verify'],
                    2: ['profile-setup'],
                  };
                  const currentStep = Object.entries(stepModes).find(([_, modes]) => modes.includes(mode))?.[0];
                  const stepNum = Number(currentStep);
                  const isActive = i === stepNum;
                  const isCompleted = i < stepNum;
                  const stepLabels = ['Choose Method', 'Verify', 'Setup Profile'];
                  return (
                    <React.Fragment key={step}>
                      {i > 0 && (
                        <div className={`w-8 h-px mx-1 transition-colors duration-300 ${isCompleted || isActive ? 'bg-emerald-500/40' : 'bg-white/[0.06]'}`} />
                      )}
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : isActive ? 'bg-emerald-400 ring-2 ring-emerald-400/20 scale-110' : 'bg-gray-600'}`} />
                        <span className={`text-[9px] font-medium transition-colors duration-300 ${isActive || isCompleted ? 'text-emerald-400/80' : 'text-gray-600'}`}>
                          {stepLabels[i]}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Back Button */}
              {mode !== 'login-methods' && (
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white -ml-2 mb-4" onClick={goBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />Back
                </Button>
              )}

              <AnimatePresence mode="wait">

                {/* ═══ LOGIN METHOD SELECTION ═══ */}
                {mode === 'login-methods' && (
                  <motion.div key="methods" {...slideIn} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                    <h2 className="text-xl font-bold text-white mb-1">Welcome Back</h2>
                    <p className="text-sm text-gray-500 mb-6">Choose your preferred sign-in method</p>

                    <div className="space-y-3">
                      {/* Google Sign In */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleLogin}
                        disabled={googleLoading}
                        className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-white/[0.08] hover:border-white/[0.15] border-l-[3px] border-l-[#4285F4] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 text-gray-200 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                        <span className="text-sm font-medium">{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                      </motion.button>

                      {/* Phone Number */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('phone-otp')}
                        className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-white/[0.08] hover:border-white/[0.15] border-l-[3px] border-l-[#10b981] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 text-gray-200 hover:text-white"
                      >
                        <Phone className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-medium">Continue with Phone</span>
                      </motion.button>

                      {/* Divider */}
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">or</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                      </div>

                      {/* Email/Password */}
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('email-login')}
                        className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border border-white/[0.08] hover:border-white/[0.15] border-l-[3px] border-l-[#8b5cf6] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 text-gray-200 hover:text-white"
                      >
                        <Mail className="w-5 h-5 text-blue-400" />
                        <span className="text-sm font-medium">Continue with Email</span>
                      </motion.button>
                    </div>

                    {/* Demo Access */}
                    <div className="mt-6">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={quickDemoLogin}
                        disabled={loading}
                        className="flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl border border-white/[0.06] hover:border-emerald-500/30 bg-white/[0.02] hover:bg-emerald-500/[0.04] transition-all duration-200 w-full text-gray-400 hover:text-emerald-300"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Try Demo</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ═══ EMAIL LOGIN ═══ */}
                {mode === 'email-login' && (
                  <motion.div key="email-login" {...slideIn} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-white">Sign In</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Use your email and password</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 text-xs" onClick={() => setMode('email-register')}>
                        Create Account
                      </Button>
                    </div>
                    <form onSubmit={handleEmailLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input type="email" autoComplete="email" placeholder="Enter your email"
                            value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          />
                        </div>
                        {formData.email && !isValidEmail(formData.email) && (
                          <p className="text-[11px] text-red-400/80 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Please enter a valid email address
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter password"
                            value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            className="h-11 pl-10 pr-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button type="button" className="text-xs text-emerald-400/70 hover:text-emerald-400" onClick={() => toast.info('Password reset coming soon.')}>
                          Forgot password?
                        </button>
                      </div>
                      <ErrorDisplay error={error} onDismiss={() => setError(null)} />
                      <SubmitButton loading={loading} label="Sign In" />

                      {/* Google Divider on Email Login */}
                      <div className="relative pt-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                        <div className="relative flex justify-center text-xs">
                          <span className="px-3 bg-transparent text-gray-600">or continue with</span>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleLogin}
                        disabled={googleLoading}
                        className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon className="w-4 h-4" />}
                        <span className="text-sm font-medium">{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
                      </motion.button>
                    </form>
                  </motion.div>
                )}

                {/* ═══ EMAIL REGISTER ═══ */}
                {mode === 'email-register' && (
                  <motion.div key="email-register" {...slideIn} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                    <h2 className="text-xl font-bold text-white mb-1">Create Account</h2>
                    <p className="text-xs text-gray-500 mb-6">Fill in your details to get started</p>
                    <form onSubmit={handleEmailRegister} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Full Name</Label>
                        <div className="relative">
                          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input placeholder="Enter your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                            className={`h-11 pl-10 bg-white/[0.04] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:ring-emerald-500/20 ${nameError ? 'border-red-500/50' : 'border-white/[0.08] focus:border-emerald-500/50'}`}
                          />
                        </div>
                        {nameError && <p className="text-[11px] text-red-400/80 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{nameError}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input type="email" autoComplete="email" placeholder="Enter your email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required
                            className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Create a password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required
                            className="h-11 pl-10 pr-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formData.password && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] text-gray-500">Strength</span>
                              <span className={`text-[10px] font-semibold ${pwStrength.score >= 4 ? 'text-emerald-400' : pwStrength.score >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{pwStrength.label}</span>
                            </div>
                            <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <motion.div className="h-full rounded-full" style={{ background: pwStrength.score >= 4 ? '#34d399' : pwStrength.score >= 2 ? '#fbbf24' : '#f87171' }} initial={{ width: 0 }} animate={{ width: pwStrength.width }} transition={{ duration: 0.3 }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Role</Label>
                        <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
                          <SelectTrigger className="h-11 rounded-xl text-sm border-white/[0.08] bg-white/[0.04] text-gray-300 focus:ring-emerald-500/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-white/[0.08] bg-gray-900">
                            <SelectItem value="STUDENT" className="text-gray-300">Student</SelectItem>
                            <SelectItem value="TEACHER" className="text-gray-300">Teacher</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <ErrorDisplay error={error} onDismiss={() => setError(null)} />
                      <SubmitButton loading={loading} label="Create Account" />

                      {/* Google Divider on Register */}
                      <div className="relative pt-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                        <div className="relative flex justify-center text-xs">
                          <span className="px-3 bg-transparent text-gray-600">or sign up with</span>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleLogin}
                        disabled={googleLoading}
                        className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl border border-white/[0.08] hover:border-white/[0.15] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon className="w-4 h-4" />}
                        <span className="text-sm font-medium">{googleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
                      </motion.button>
                    </form>
                  </motion.div>
                )}

                {/* ═══ PHONE OTP ENTRY ═══ */}
                {mode === 'phone-otp' && (
                  <motion.div key="phone-otp" {...slideIn} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                    <h2 className="text-xl font-bold text-white mb-1">Phone Sign In</h2>
                    <p className="text-xs text-gray-500 mb-6">We&apos;ll send you a verification code via SMS</p>
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Phone Number</Label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input type="tel" placeholder="+880 1XXX XXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} required
                            className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Your Name <span className="text-gray-600">(optional)</span></Label>
                        <Input placeholder="Enter your name" value={phoneName} onChange={(e) => setPhoneName(e.target.value)}
                          className="h-11 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <Shield className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-emerald-300/70 leading-relaxed">Your phone number is kept secure and only used for login verification.</p>
                      </div>
                      <ErrorDisplay error={error} onDismiss={() => setError(null)} />
                      <SubmitButton loading={loading} label="Send Verification Code" />
                    </form>
                  </motion.div>
                )}

                {/* ═══ OTP VERIFICATION ═══ */}
                {mode === 'phone-verify' && (
                  <motion.div key="phone-verify" {...slideIn} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h2 className="text-xl font-bold text-white">Verify Your Phone</h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the 6-digit code sent to <span className="text-gray-300 font-medium">{phone}</span>
                      </p>
                    </div>

                    {devOtp && (
                      <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                        <p className="text-[10px] text-amber-400/60 uppercase tracking-wider font-semibold mb-1">Dev Mode — OTP</p>
                        <p className="text-2xl font-bold text-amber-300 tracking-[0.3em]">{devOtp}</p>
                      </div>
                    )}

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} value={otp} onChange={setOtp} containerClassName="justify-center gap-2">
                          <InputOTPGroup>
                            <InputOTPSlot index={0} className="w-11 h-12 text-lg rounded-lg bg-white/[0.04] border-white/[0.08] text-white" />
                            <InputOTPSlot index={1} className="w-11 h-12 text-lg rounded-lg bg-white/[0.04] border-white/[0.08] text-white" />
                            <InputOTPSlot index={2} className="w-11 h-12 text-lg rounded-lg bg-white/[0.04] border-white/[0.08] text-white" />
                          </InputOTPGroup>
                          <InputOTPSeparator className="text-gray-600" />
                          <InputOTPGroup>
                            <InputOTPSlot index={3} className="w-11 h-12 text-lg rounded-lg bg-white/[0.04] border-white/[0.08] text-white" />
                            <InputOTPSlot index={4} className="w-11 h-12 text-lg rounded-lg bg-white/[0.04] border-white/[0.08] text-white" />
                            <InputOTPSlot index={5} className="w-11 h-12 text-lg rounded-lg bg-white/[0.04] border-white/[0.08] text-white" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <ErrorDisplay error={error} onDismiss={() => setError(null)} />
                      <SubmitButton loading={loading} label="Verify & Sign In" disabled={otp.length !== 6} />
                      <div className="text-center">
                        <button type="button" onClick={handleResendOtp} disabled={otpCooldown > 0 || loading}
                          className="text-xs text-emerald-400/70 hover:text-emerald-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                          {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend Code'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* ═══ PROFILE SETUP (New Users) ═══ */}
                {mode === 'profile-setup' && pendingSetup && (
                  <motion.div key="profile-setup" {...slideIn} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.25 }}>
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 10 }}
                        className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
                      >
                        <GraduationCap className="w-7 h-7 text-white" />
                      </motion.div>
                      <h2 className="text-xl font-bold text-white">Complete Your Profile</h2>
                      <p className="text-xs text-gray-500 mt-1">
                        {pendingSetup.provider === 'GOOGLE' && (
                          <span className="flex items-center justify-center gap-1.5">
                            <GoogleIcon className="w-3.5 h-3.5" /> Signed in as {pendingSetup.user.email}
                          </span>
                        )}
                        {pendingSetup.provider === 'PHONE' && (
                          <span className="flex items-center justify-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Verified: {pendingSetup.user.phone}
                          </span>
                        )}
                      </p>
                    </div>

                    <form onSubmit={handleProfileSetup} className="space-y-4">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input placeholder="Your full name" value={setupData.name} onChange={(e) => setSetupData({ ...setupData, name: e.target.value })} required
                            className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      {/* Roll Number */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Roll Number <span className="text-gray-600">(optional)</span></Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <Input placeholder="e.g., 2024-CSE-001" value={setupData.rollNumber} onChange={(e) => setSetupData({ ...setupData, rollNumber: e.target.value })}
                            className="h-11 pl-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      {/* Department */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Department <span className="text-red-400">*</span></Label>
                        <Select value={setupData.department} onValueChange={(val) => setSetupData({ ...setupData, department: val, section: '' })} required>
                          <SelectTrigger className="h-11 rounded-xl text-sm border-white/[0.08] bg-white/[0.04] text-gray-300 focus:ring-emerald-500/20">
                            <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                            <SelectValue placeholder="Select your department" />
                          </SelectTrigger>
                          <SelectContent className="border-white/[0.08] bg-gray-900">
                            {DEPARTMENTS.map(dept => (
                              <SelectItem key={dept.value} value={dept.value} className="text-gray-300">
                                <span className="flex items-center gap-2">
                                  <span>{DEPARTMENT_ICONS[dept.value] || ''}</span>
                                  {dept.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {/* Department badge pills */}
                        {setupData.department && (
                          <div className="flex items-center gap-2 mt-1">
                            {DEPARTMENTS.map(dept => (
                              <button
                                key={dept.value}
                                type="button"
                                onClick={() => setSetupData({ ...setupData, department: dept.value, section: '' })}
                                className={`text-[10px] px-2 py-0.5 rounded-full transition-all duration-200 ${setupData.department === dept.value ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:border-white/[0.12]'}`}
                              >
                                {DEPARTMENT_ICONS[dept.value]} {dept.value}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section */}
                      {setupData.department && SECTIONS_MAP[setupData.department] && (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-gray-400">Section / Course <span className="text-gray-600">(optional)</span></Label>
                          <Select value={setupData.section} onValueChange={(val) => setSetupData({ ...setupData, section: val })}>
                            <SelectTrigger className="h-11 rounded-xl text-sm border-white/[0.08] bg-white/[0.04] text-gray-300 focus:ring-emerald-500/20">
                              <BookOpen className="w-4 h-4 mr-2 text-gray-500" />
                              <SelectValue placeholder={`Select ${setupData.department} section`} />
                            </SelectTrigger>
                            <SelectContent className="border-white/[0.08] bg-gray-900">
                              {SECTIONS_MAP[setupData.department].map(sec => (
                                <SelectItem key={sec} value={sec} className="text-gray-300">{sec}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Batch */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-400">Batch / Year <span className="text-red-400">*</span></Label>
                        <Select value={setupData.batch} onValueChange={(val) => setSetupData({ ...setupData, batch: val })} required>
                          <SelectTrigger className="h-11 rounded-xl text-sm border-white/[0.08] bg-white/[0.04] text-gray-300 focus:ring-emerald-500/20">
                            <GraduationCap className="w-4 h-4 mr-2 text-gray-500" />
                            <SelectValue placeholder="Select your batch year" />
                          </SelectTrigger>
                          <SelectContent className="border-white/[0.08] bg-gray-900">
                            {BATCHES.map(b => (
                              <SelectItem key={b.value} value={b.value} className="text-gray-300">{b.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Info Box */}
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-blue-300/70 leading-relaxed">You can update your profile details later from the Profile page.</p>
                      </div>

                      <ErrorDisplay error={error} onDismiss={() => setError(null)} />
                      <SubmitButton loading={loading} label="Complete Setup" />
                    </form>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>

          {/* ─── Footer ──────────────────────────────────── */}
          <motion.div className="mt-6 text-center space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
            <p className="text-[10px] text-gray-600">
              Prime University &mdash; Academic Learning Resource Management System
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Reusable Error Display ────────────────────────────────
function ErrorDisplay({ error, onDismiss }: { error: string | null; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -6, height: 0 }}
          className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300/80 flex-1 leading-relaxed">{error}</p>
          <button type="button" className="text-red-400/50 hover:text-red-300 p-0.5" onClick={onDismiss}>
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Reusable Submit Button ────────────────────────────────
function SubmitButton({ loading, label, disabled }: { loading: boolean; label: string; disabled?: boolean }) {
  return (
    <Button type="submit" disabled={loading || disabled}
      className={`w-full h-12 rounded-xl text-sm font-semibold text-white border-0 transition-all duration-300 relative overflow-hidden ${loading || disabled ? 'opacity-80 cursor-wait' : 'hover:shadow-lg active:scale-[0.98]'}`}
      style={loading || disabled ? undefined : { background: 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0891b2 100%)', boxShadow: '0 4px 24px rgba(16,185,129,0.2)' }}
    >
      {loading ? (
        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Processing...</span>
      ) : (
        <span className="flex items-center justify-center gap-2">{label}<ArrowRight className="w-4 h-4" /></span>
      )}
    </Button>
  );
}

export default AuthPage;
